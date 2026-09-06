<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('invoices')
            ->leftJoin('inventory_locations', 'invoices.location_id', '=', 'inventory_locations.id')
            ->select('invoices.*', 'inventory_locations.name as location_name');

        if ($request->filled('distributor_phone') || $request->filled('phone') || $request->filled('distributor_company')) {
            $phone = $request->query('distributor_phone', $request->query('phone', ''));
            $cleanPhone = preg_replace('/\D/', '', $phone);
            $company = strtolower(trim($request->query('distributor_company', '')));
            $name = strtolower(trim($request->query('distributor_name', '')));

            $query->where(function ($q) use ($cleanPhone, $company, $name) {
                $hasCond = false;
                if (strlen($cleanPhone) >= 10) {
                    $last10 = substr($cleanPhone, -10);
                    $q->where('invoices.customer_phone', 'LIKE', "%{$last10}%");
                    $hasCond = true;
                }
                if (!empty($company) && strlen($company) >= 3) {
                    if ($hasCond) {
                        $q->orWhereRaw('LOWER(invoices.customer_name) LIKE ?', ["%{$company}%"]);
                    } else {
                        $q->whereRaw('LOWER(invoices.customer_name) LIKE ?', ["%{$company}%"]);
                        $hasCond = true;
                    }
                }
                if (!empty($name) && strlen($name) >= 3) {
                    if ($hasCond) {
                        $q->orWhereRaw('LOWER(invoices.customer_name) LIKE ?', ["%{$name}%"]);
                    } else {
                        $q->whereRaw('LOWER(invoices.customer_name) LIKE ?', ["%{$name}%"]);
                    }
                }
            });
        } elseif ($request->filled('customer_name')) {
            $name = strtolower(trim($request->query('customer_name')));
            $query->whereRaw('LOWER(invoices.customer_name) LIKE ?', ["%{$name}%"]);
        }

        $invoices = $query->orderBy('invoices.created_at', 'desc')->get();

        $invoiceIds = $invoices->pluck('id')->toArray();
        $items = DB::table('invoice_items')
            ->join('product_pack_variants', 'invoice_items.variant_id', '=', 'product_pack_variants.id')
            ->join('products', 'product_pack_variants.product_id', '=', 'products.id')
            ->whereIn('invoice_items.invoice_id', $invoiceIds)
            ->select(
                'invoice_items.*',
                'products.name as product_name',
                'product_pack_variants.pack_size',
                'product_pack_variants.sku'
            )
            ->get()
            ->groupBy('invoice_id');

        $result = $invoices->map(function ($inv) use ($items) {
            $inv->items = $items->get($inv->id, []);
            return $inv;
        });

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => [
                'required',
                'string',
                'min:3',
                'max:120',
                'regex:/^[a-zA-Z0-9\s\.\,\-\&]+$/'
            ],
            'customer_phone' => [
                'required',
                'string',
                'regex:/^(\+91[\-\s]?)?[6-9]\d{9}$/'
            ],
            'vehicle_number' => [
                'nullable',
                'string',
                'max:30',
                'regex:/^([A-Za-z]{2}[\s\-]?[0-9]{1,2}[\s\-]?[A-Za-z]{0,3}[\s\-]?[0-9]{4}|[0-9]{2}[\s\-]?BH[\s\-]?[0-9]{4}[\s\-]?[A-Za-z]{1,2}|Counter Sale|Direct Counter Sale)$/i'
            ],
            'location_id' => 'required|uuid|exists:inventory_locations,id',
            'operator_name' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.sku' => 'required|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|string|max:50',
            'coupon_code' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string',
            'payment_ref' => 'nullable|string|max:100'
        ], [
            'customer_name.required' => 'Customer / Fleet Name is required.',
            'customer_name.min' => 'Customer / Fleet Name must be at least 3 characters.',
            'customer_name.regex' => 'Customer Name contains invalid characters.',
            'customer_phone.required' => 'Customer Mobile is required for SMS receipt.',
            'customer_phone.regex' => 'Please enter a valid 10-digit Indian mobile number (e.g. 9853675971 or +91 9853675971).',
            'vehicle_number.regex' => 'Invalid vehicle registration format (e.g. OD05AX4892 or 22BH1234AA).'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $locationId = $validated['location_id'];
            $items = $validated['items'];

            // 1. Strict Stock Check with Lock
            foreach ($items as $item) {
                $variant = DB::table('product_pack_variants')->where('sku', $item['sku'])->first();
                if (!$variant) {
                    return response()->json(['success' => false, 'message' => "SKU {$item['sku']} not found."], 422);
                }

                $batch = DB::table('inventory_batches')
                    ->where('location_id', $locationId)
                    ->where('variant_id', $variant->id)
                    ->lockForUpdate()
                    ->first();

                if (!$batch || $batch->available_stock < $item['qty']) {
                    $avail = $batch ? $batch->available_stock : 0;
                    return response()->json([
                        'success' => false,
                        'message' => "Anti-Overbilling Protection: Requested {$item['qty']} units for {$item['sku']}, but only {$avail} units are physically available in stock."
                    ], 422);
                }
            }

            // 2. Dynamic Product-Wise GST Calculations (Inclusive vs Exclusive) with Discount Support
            $rawSubtotal = 0;
            foreach ($items as $i) {
                $rawSubtotal += ($i['unit_price'] * $i['qty']);
            }

            $requestedDiscount = floatval($validated['discount_amount'] ?? $request->input('discount') ?? 0);
            $finalDiscount = min($rawSubtotal, max(0, $requestedDiscount));
            $discountRatio = $rawSubtotal > 0 ? ($finalDiscount / $rawSubtotal) : 0;

            $subtotal = $rawSubtotal;
            $totalTaxable = 0;
            $totalCgst = 0;
            $totalSgst = 0;
            $grandTotal = 0;

            foreach ($items as $i) {
                $rawAmount = $i['unit_price'] * $i['qty'];
                $lineDiscount = $rawAmount * $discountRatio;
                $lineNet = max(0, $rawAmount - $lineDiscount);

                $productInfo = DB::table('product_pack_variants')
                    ->join('products', 'product_pack_variants.product_id', '=', 'products.id')
                    ->where('product_pack_variants.sku', $i['sku'])
                    ->select('products.gst_rate', 'products.is_gst_inclusive')
                    ->first();

                $gstRate = ($productInfo && isset($productInfo->gst_rate)) ? floatval($productInfo->gst_rate) : floatval(config('company.default_gst_rate', 18.00));
                $isInclusive = ($productInfo && isset($productInfo->is_gst_inclusive)) ? (bool) $productInfo->is_gst_inclusive : true;

                if ($isInclusive) {
                    // MRP includes GST -> Extract base taxable from net line
                    $lineTaxable = $lineNet / (1 + ($gstRate / 100));
                    $lineGst = $lineNet - $lineTaxable;
                    $lineFinalTotal = $lineNet;
                } else {
                    // MRP excludes GST -> Add GST on top of net line
                    $lineTaxable = $lineNet;
                    $lineGst = $lineNet * ($gstRate / 100);
                    $lineFinalTotal = $lineTaxable + $lineGst;
                }

                $totalTaxable += $lineTaxable;
                $totalCgst += ($lineGst / 2);
                $totalSgst += ($lineGst / 2);
                $grandTotal += $lineFinalTotal;
            }

            $taxable = round($totalTaxable, 2);
            $cgst = round($totalCgst, 2);
            $sgst = round($totalSgst, 2);
            $grandTotal = round($grandTotal, 2);

            $invoiceId = (string) Str::uuid();

            // Dynamic Sequential Invoice Number: {PREFIX}YY-0000001
            $year = date('y');
            $prefix = config('company.invoice_prefix', 'INVOICE-') . "{$year}-";

            $latestInvoice = DB::table('invoices')
                ->where('invoice_number', 'LIKE', "{$prefix}%")
                ->orderByRaw("LENGTH(invoice_number) DESC, invoice_number DESC")
                ->lockForUpdate()
                ->value('invoice_number');

            if ($latestInvoice && preg_match('/^INVOICE-\d{2}-(\d+)$/', $latestInvoice, $matches)) {
                $nextIndex = ((int) $matches[1]) + 1;
            } else {
                $nextIndex = 1;
            }

            $invoiceNumber = $prefix . str_pad($nextIndex, 7, '0', STR_PAD_LEFT);

            $basePaymentMethod = $validated['payment_method'] ?? 'Cash';
            $paymentRef = !empty($validated['payment_ref']) ? trim($validated['payment_ref']) : null;
            $finalPaymentMethod = $paymentRef ? "{$basePaymentMethod} (UTR: {$paymentRef})" : $basePaymentMethod;

            DB::table('invoices')->insert([
                'id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
                'location_id' => $locationId,
                'operator_name' => !empty($validated['operator_name']) ? $validated['operator_name'] : null,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'vehicle_number' => $validated['vehicle_number'],
                'subtotal' => round($subtotal, 2),
                'discount_amount' => round($finalDiscount, 2),
                'taxable_amount' => $taxable,
                'cgst_amount' => $cgst,
                'sgst_amount' => $sgst,
                'grand_total' => $grandTotal,
                'payment_method' => $finalPaymentMethod,
                'payment_status' => 'PAID',
                'is_sms_sent' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 3. Insert line items & decrement stock
            foreach ($items as $item) {
                $variant = DB::table('product_pack_variants')->where('sku', $item['sku'])->first();

                DB::table('invoice_items')->insert([
                    'id' => (string) Str::uuid(),
                    'invoice_id' => $invoiceId,
                    'variant_id' => $variant->id,
                    'quantity' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['unit_price'] * $item['qty'],
                    'created_at' => now()
                ]);

                DB::table('inventory_batches')
                    ->where('location_id', $locationId)
                    ->where('variant_id', $variant->id)
                    ->decrement('available_stock', $item['qty']);
            }

            return response()->json([
                'success' => true,
                'message' => "Invoice #{$invoiceNumber} successfully created and stock decremented.",
                'invoice_number' => $invoiceNumber,
                'grand_total' => $grandTotal
            ], 201);
        });
    }

    public function downloadPdf($id)
    {
        $query = DB::table('invoices')
            ->leftJoin('inventory_locations', 'invoices.location_id', '=', 'inventory_locations.id')
            ->select(
                'invoices.*',
                'inventory_locations.name as location_name',
                'inventory_locations.address as location_address',
                'inventory_locations.city as location_city',
                'inventory_locations.state as location_state',
                'inventory_locations.pincode as location_pincode',
                'inventory_locations.contact_phone as location_phone'
            );

        if (Str::isUuid($id)) {
            $query->where(function ($q) use ($id) {
                $q->where('invoices.id', $id)->orWhere('invoices.invoice_number', $id);
            });
        } else {
            $query->where('invoices.invoice_number', $id);
        }

        $invoice = $query->first();

        if (!$invoice) {
            return response()->json(['success' => false, 'message' => "Invoice '{$id}' not found."], 404);
        }

        $items = DB::table('invoice_items')
            ->join('product_pack_variants', 'invoice_items.variant_id', '=', 'product_pack_variants.id')
            ->join('products', 'product_pack_variants.product_id', '=', 'products.id')
            ->where('invoice_items.invoice_id', $invoice->id)
            ->select(
                'invoice_items.*',
                'products.name as product_name',
                'products.hsn_code',
                'product_pack_variants.pack_size',
                'product_pack_variants.sku'
            )
            ->get();

        // Company & Plant details dynamically retrieved from config and database
        $companyName = config('company.name', 'AYUSH GREEN ENERGY');
        $brandName = config('company.brand', 'UltraBlue+ Diesel Exhaust Fluid (DEF)');
        $plantAddress = !empty($invoice->location_address)
            ? trim("{$invoice->location_address}, {$invoice->location_city}, {$invoice->location_state}" . (!empty($invoice->location_pincode) ? " - {$invoice->location_pincode}" : ''))
            : config('company.plant_address', 'At- Charampa, Dist- Bhadrak, Odisha, Pin- 756101, India');
        $gstin = config('company.gstin', '21AABCU9603R1ZM');
        $cin = config('company.cin', 'U23209OR2026PTC048912');
        $phone = $invoice->location_phone ?: config('company.phone', '+91 9853675971');
        $email = config('company.email', 'ayush.greenenergy1@gmail.com');
        $state = $invoice->location_state ?: config('company.state', 'Odisha');
        $stateCode = config('company.state_code', '21');
        $defaultHsn = config('company.default_hsn', '31021000');

        $dateFormatted = date('d M Y, h:i A', strtotime($invoice->created_at));
        $grandTotalFormatted = number_format((float) $invoice->grand_total, 2);
        $subtotalFormatted = number_format((float) $invoice->subtotal, 2);
        $taxableFormatted = number_format((float) $invoice->taxable_amount, 2);
        $cgstFormatted = number_format((float) $invoice->cgst_amount, 2);
        $sgstFormatted = number_format((float) $invoice->sgst_amount, 2);
        $discountFormatted = number_format((float) $invoice->discount_amount, 2);

        // Dynamically compute tax percentages from invoice amounts
        $taxableVal = floatval($invoice->taxable_amount);
        $cgstPercent = $taxableVal > 0 ? round((floatval($invoice->cgst_amount) / $taxableVal) * 100, 1) : 9;
        $sgstPercent = $taxableVal > 0 ? round((floatval($invoice->sgst_amount) / $taxableVal) * 100, 1) : 9;

        $itemsHtml = '';
        $sno = 1;
        foreach ($items as $item) {
            $hsn = $item->hsn_code ?: $defaultHsn;
            $qty = $item->quantity;
            $unitPrice = number_format((float) $item->unit_price, 2);
            $lineTotal = number_format((float) $item->line_total, 2);
            $itemsHtml .= "
                <tr>
                    <td style='text-align: center;'>{$sno}</td>
                    <td><strong>{$item->product_name}</strong><br><span style='font-size: 11px; color: #64748b;'>Pack: {$item->pack_size} | SKU: {$item->sku}</span></td>
                    <td style='text-align: center;'>{$hsn}</td>
                    <td style='text-align: center;'><strong>{$qty}</strong></td>
                    <td style='text-align: right;'>₹ {$unitPrice}</td>
                    <td style='text-align: right;'><strong>₹ {$lineTotal}</strong></td>
                </tr>
            ";
            $sno++;
        }

        if (empty($itemsHtml)) {
            $fallbackProduct = DB::table('products')->value('name') ?: $brandName;
            $itemsHtml = "
                <tr>
                    <td style='text-align: center;'>1</td>
                    <td><strong>{$fallbackProduct}</strong><br><span style='font-size: 11px; color: #64748b;'>Wholesale B2B Allocation</span></td>
                    <td style='text-align: center;'>{$defaultHsn}</td>
                    <td style='text-align: center;'><strong>1</strong></td>
                    <td style='text-align: right;'>₹ {$taxableFormatted}</td>
                    <td style='text-align: right;'><strong>₹ {$taxableFormatted}</strong></td>
                </tr>
            ";
        }

        // Terms & Conditions dynamically rendered from config
        $terms = config('company.terms', [
            'Manufactured strictly adhering to ISO 22241-1 & BIS specifications.',
            'Keep sealed and store between -11°C and 30°C away from direct sunlight.',
            'Electronic GST invoice generated under Section 31 of CGST Act.'
        ]);
        $termsHtml = '';
        foreach ($terms as $idx => $term) {
            $num = $idx + 1;
            $termsHtml .= "{$num}. {$term}<br>";
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - {$invoice->invoice_number}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #f1f5f9; padding: 30px 15px; color: #1e293b; }
        .invoice-container { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 36px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .action-bar { max-width: 820px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
        .btn { background: #0056D2; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }
        .btn:hover { background: #004099; }
        .btn-outline { background: #ffffff; color: #0056D2; border: 1px solid #0056D2; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0056D2; padding-bottom: 16px; margin-bottom: 16px; }
        .company-title { font-size: 20px; font-weight: 900; color: #0056D2; letter-spacing: -0.5px; }
        .badge-band { background: #0056D2; color: #ffffff; padding: 8px 14px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; font-weight: 800; font-size: 12px; letter-spacing: 0.5px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 12px; line-height: 1.6; }
        .box-header { font-weight: 800; color: #0056D2; text-transform: uppercase; font-size: 11px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        table.items-table th { background: #0f172a; color: #ffffff; padding: 10px; font-weight: 700; text-align: left; }
        table.items-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        .summary-grid { display: flex; justify-content: flex-end; margin-bottom: 24px; }
        .summary-box { width: 340px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 12px; line-height: 1.8; }
        .grand-total-row { font-size: 16px; font-weight: 900; color: #0056D2; border-top: 2px solid #0056D2; padding-top: 6px; margin-top: 6px; display: flex; justify-content: space-between; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; align-items: flex-end; }
        @media print {
            body { background: #ffffff; padding: 0; }
            .action-bar { display: none; }
            .invoice-container { box-shadow: none; padding: 0; max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="action-bar">
        <a href="javascript:history.back()" class="btn btn-outline">&larr; Back to Portal</a>
        <button onclick="window.print()" class="btn">Print / Save as PDF</button>
    </div>

    <div class="invoice-container">
        <div class="header">
            <div>
                <div class="company-title">{$companyName}</div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">{$brandName}</div>
                <div style="font-size: 11px; color: #64748b; max-width: 360px; margin-top: 4px;">{$plantAddress}</div>
            </div>
            <div style="text-align: right; font-size: 11px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div><span style="color: #64748b;">GSTIN:</span> <strong style="color: #0056D2; font-family: monospace; font-size: 12px;">{$gstin}</strong></div>
                <div><span style="color: #64748b;">CIN:</span> {$cin}</div>
                <div><span style="color: #64748b;">Phone:</span> {$phone}</div>
                <div><span style="color: #64748b;">Email:</span> {$email}</div>
            </div>
        </div>

        <div class="badge-band">
            <span>OFFICIAL GST TAX INVOICE & DISPATCH RECORD</span>
            <span>ORIGINAL FOR RECIPIENT</span>
        </div>

        <div class="grid-2">
            <div class="box">
                <div class="box-header">Invoice Information</div>
                <div><strong>Invoice No:</strong> <span style="font-family: monospace; font-weight: 800; color: #0056D2;">{$invoice->invoice_number}</span></div>
                <div><strong>Date & Time:</strong> {$dateFormatted}</div>
                <div><strong>Dispatch Depot:</strong> {$invoice->location_name}</div>
                <div><strong>Operator / POS:</strong> {$invoice->operator_name}</div>
                <div><strong>State Code:</strong> {$stateCode} ({$state})</div>
            </div>
            <div class="box">
                <div class="box-header">Billed To (Authorized Partner)</div>
                <div><strong>Company:</strong> <span style="color: #0f172a; font-size: 13px; font-weight: 800;">{$invoice->customer_name}</span></div>
                <div><strong>Contact Phone:</strong> {$invoice->customer_phone}</div>
                <div><strong>Vehicle / Fleet Reg:</strong> {$invoice->vehicle_number}</div>
                <div><strong>Payment Method:</strong> {$invoice->payment_method}</div>
                <div><strong>Payment Status:</strong> <strong style="color: #15803d;">{$invoice->payment_status}</strong></div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Product Description</th>
                    <th style="width: 100px; text-align: center;">HSN Code</th>
                    <th style="width: 70px; text-align: center;">Qty</th>
                    <th style="width: 110px; text-align: right;">Unit Rate</th>
                    <th style="width: 120px; text-align: right;">Taxable Amount</th>
                </tr>
            </thead>
            <tbody>
                {$itemsHtml}
            </tbody>
        </table>

        <div class="summary-grid">
            <div class="summary-box">
                <div style="display: flex; justify-content: space-between;">
                    <span>Subtotal:</span>
                    <strong>₹ {$subtotalFormatted}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #15803d;">
                    <span>Trade Discount:</span>
                    <strong>- ₹ {$discountFormatted}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Taxable Base Value:</span>
                    <strong>₹ {$taxableFormatted}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>CGST ({$cgstPercent}%):</span>
                    <strong>₹ {$cgstFormatted}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>SGST ({$sgstPercent}%):</span>
                    <strong>₹ {$sgstFormatted}</strong>
                </div>
                <div class="grand-total-row">
                    <span>Grand Total:</span>
                    <span>₹ {$grandTotalFormatted}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div>
                <strong>Terms & Conditions:</strong><br>
                {$termsHtml}
            </div>
            <div style="text-align: right;">
                <div style="height: 35px;"></div>
                <strong>For {$companyName}</strong><br>
                <span style="font-size: 10px; color: #64748b;">Authorised Signatory</span>
            </div>
        </div>
    </div>
</body>
</html>
HTML;

        return response($html)->header('Content-Type', 'text/html');
    }
}
