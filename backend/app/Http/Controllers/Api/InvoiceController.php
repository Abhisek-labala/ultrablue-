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
            'payment_ref' => 'nullable|string|max:100',
            'distributor_id' => 'nullable|uuid',
            'distributor_order_id' => 'nullable|uuid',
            'payment_mode' => 'nullable|string',
            'paid_amount' => 'nullable|numeric|min:0',
            'credit_amount' => 'nullable|numeric|min:0'
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

            // 2b. Payment Mode, Credit, and Distributor Linking
            $paymentMode = $request->input('payment_mode', 'FULL_PAID');
            $distId = $request->input('distributor_id');
            $distOrderId = $request->input('distributor_order_id');

            // Auto-detect distributor profile by phone or company if ID not supplied
            if (!$distId) {
                $cleanPhone = preg_replace('/\D/', '', $validated['customer_phone']);
                if (strlen($cleanPhone) >= 10) {
                    $last10 = substr($cleanPhone, -10);
                    $matched = DB::table('distributor_profiles')->where('phone', 'LIKE', "%{$last10}%")->first();
                    if ($matched) $distId = $matched->id;
                }
            }

            $paidAmount = $grandTotal;
            $creditAmount = 0.00;

            if ($paymentMode === 'FULL_CREDIT') {
                $paidAmount = 0.00;
                $creditAmount = $grandTotal;
            } elseif ($paymentMode === 'PART_CREDIT') {
                $paidAmount = round(floatval($request->input('paid_amount', 0)), 2);
                $creditAmount = round(max(0, $grandTotal - $paidAmount), 2);
            }

            // If Credit is being utilized, validate against Distributor's available credit limit
            if ($creditAmount > 0) {
                if (!$distId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Credit billing is only permitted for registered and verified B2B Distributors.'
                    ], 422);
                }

                $dist = DB::table('distributor_profiles')->where('id', $distId)->lockForUpdate()->first();
                if (!$dist) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Associated Distributor Profile not found for credit billing.'
                    ], 404);
                }

                $creditLimit = floatval($dist->credit_limit ?? 0);
                $currentOutstanding = floatval($dist->outstanding_credit ?? 0);
                $availableCredit = max(0, $creditLimit - $currentOutstanding);

                if ($creditAmount > $availableCredit) {
                    return response()->json([
                        'success' => false,
                        'message' => "Credit Limit Exceeded: B2B Credit of ₹" . number_format($creditAmount, 2) . 
                                     " exceeds available credit limit ₹" . number_format($availableCredit, 2) . 
                                     " (Approved Limit: ₹" . number_format($creditLimit, 2) . 
                                     ", Current Outstanding: ₹" . number_format($currentOutstanding, 2) . "). Please collect a partial upfront payment."
                    ], 422);
                }

                $newOutstanding = round($currentOutstanding + $creditAmount, 2);
            }

            $paymentStatus = 'PAID';
            if ($creditAmount > 0 && $paidAmount > 0) {
                $paymentStatus = 'PART_CREDIT';
            } elseif ($creditAmount > 0) {
                $paymentStatus = 'ON_CREDIT';
            }

            $basePaymentMethod = $validated['payment_method'] ?? 'Cash';
            if ($paymentMode === 'FULL_CREDIT') {
                $finalPaymentMethod = 'Revolving Credit (30 Days)';
            } elseif ($paymentMode === 'PART_CREDIT') {
                $finalPaymentMethod = "{$basePaymentMethod} (₹" . number_format($paidAmount, 2) . ") + Credit (₹" . number_format($creditAmount, 2) . ")";
            } else {
                $paymentRef = !empty($validated['payment_ref']) ? trim($validated['payment_ref']) : null;
                $finalPaymentMethod = $paymentRef ? "{$basePaymentMethod} (UTR: {$paymentRef})" : $basePaymentMethod;
            }

            // Insert Invoice Record first
            DB::table('invoices')->insert([
                'id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
                'location_id' => $locationId,
                'operator_name' => !empty($validated['operator_name']) ? $validated['operator_name'] : null,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'distributor_id' => $distId,
                'distributor_order_id' => $distOrderId,
                'vehicle_number' => $validated['vehicle_number'],
                'subtotal' => round($subtotal, 2),
                'discount_amount' => round($finalDiscount, 2),
                'taxable_amount' => $taxable,
                'cgst_amount' => $cgst,
                'sgst_amount' => $sgst,
                'grand_total' => $grandTotal,
                'paid_amount' => round($paidAmount, 2),
                'credit_amount' => round($creditAmount, 2),
                'payment_method' => $finalPaymentMethod,
                'payment_status' => $paymentStatus,
                'is_sms_sent' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // If Credit is used, record debt and credit ledger transaction
            if ($creditAmount > 0 && $distId) {
                DB::table('distributor_profiles')->where('id', $distId)->update([
                    'outstanding_credit' => $newOutstanding,
                    'updated_at' => now()
                ]);

                DB::table('distributor_credit_transactions')->insert([
                    'id' => (string) Str::uuid(),
                    'distributor_id' => $distId,
                    'invoice_id' => $invoiceId,
                    'type' => 'DEBIT_INVOICE',
                    'amount' => $creditAmount,
                    'balance_after' => $newOutstanding,
                    'payment_method' => $paymentMode === 'PART_CREDIT' ? ($basePaymentMethod . ' + CREDIT') : 'CREDIT',
                    'reference_no' => $invoiceNumber,
                    'notes' => "Dispatched against Invoice #{$invoiceNumber}" . ($paidAmount > 0 ? " (Paid upfront: ₹" . number_format($paidAmount, 2) . ")" : ""),
                    'recorded_by' => !empty($validated['operator_name']) ? $validated['operator_name'] : ($request->user()?->name ?: 'POS Terminal'),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // If order was converted, update distributor_orders record
            if ($distOrderId) {
                DB::table('distributor_orders')->where('id', $distOrderId)->update([
                    'status' => 'CONVERTED_TO_INVOICE',
                    'invoice_id' => $invoiceId,
                    'invoice_number' => $invoiceNumber,
                    'updated_at' => now()
                ]);
            }

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
                'grand_total' => $grandTotal,
                'paid_amount' => round($paidAmount, 2),
                'credit_amount' => round($creditAmount, 2)
            ], 201);
        });
    }

    public function downloadPdf(Request $request, $id)
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
        $amountInWords = $this->numberToWords(floatval($invoice->grand_total));

        $itemsHtml = '';
        $sno = 1;
        foreach ($items as $item) {
            $hsn = $item->hsn_code ?: $defaultHsn;
            $qty = $item->quantity;
            $unitPrice = number_format((float) $item->unit_price, 2);
            $lineTotal = number_format((float) $item->line_total, 2);
            $bg = $sno % 2 === 0 ? '#f8fafc' : '#ffffff';
            $itemsHtml .= "
                <tr style='background-color: {$bg};'>
                    <td style='text-align: center; padding: 7px 8px; border-bottom: 1px solid #e2e8f0;'>{$sno}</td>
                    <td style='padding: 7px 8px; border-bottom: 1px solid #e2e8f0;'>
                        <strong style='color: #0f172a; font-size: 11.5px;'>{$item->product_name}</strong>
                        <div style='font-size: 9.5px; color: #0284c7; margin-top: 1px;'>Pack: {$item->pack_size} | SKU: {$item->sku}</div>
                    </td>
                    <td style='text-align: center; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 10.5px;'>{$hsn}</td>
                    <td style='text-align: center; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0369a1;'>{$qty}</td>
                    <td style='text-align: right; padding: 7px 8px; border-bottom: 1px solid #e2e8f0;'>₹ {$unitPrice}</td>
                    <td style='text-align: right; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>₹ {$lineTotal}</td>
                </tr>
            ";
            $sno++;
        }

        if (empty($itemsHtml)) {
            $fallbackProduct = DB::table('products')->value('name') ?: $brandName;
            $itemsHtml = "
                <tr style='background-color: #ffffff;'>
                    <td style='text-align: center; padding: 7px 8px; border-bottom: 1px solid #e2e8f0;'>1</td>
                    <td style='padding: 7px 8px; border-bottom: 1px solid #e2e8f0;'>
                        <strong style='color: #0f172a;'>{$fallbackProduct}</strong>
                        <div style='font-size: 9.5px; color: #0284c7;'>Wholesale B2B Allocation</div>
                    </td>
                    <td style='text-align: center; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;'>{$defaultHsn}</td>
                    <td style='text-align: center; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0369a1;'>1</td>
                    <td style='text-align: right; padding: 7px 8px; border-bottom: 1px solid #e2e8f0;'>₹ {$taxableFormatted}</td>
                    <td style='text-align: right; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>₹ {$taxableFormatted}</td>
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

        // Clean, standard A4 printable and Dompdf-compatible HTML document
        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice - {$invoice->invoice_number}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 8mm 10mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'DejaVu Sans', sans-serif;
        }
        body {
            background-color: #ffffff;
            color: #0f172a;
            font-size: 9.5px;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .wrapper-table {
            width: 100%;
            border: 1.5px solid #0056D2;
            border-radius: 6px;
        }
        .main-cell {
            padding: 12px 14px;
        }
        .brand-title {
            font-size: 17px;
            font-weight: bold;
            color: #0056D2;
        }
        .sub-brand {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 1px;
        }
        .plant-address {
            font-size: 9px;
            color: #475569;
            margin-top: 2px;
        }
        .statutory-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 6px 10px;
            text-align: right;
            font-size: 9px;
            color: #334155;
            line-height: 1.4;
        }
        .band-table {
            background-color: #0056D2;
            color: #ffffff;
            font-weight: bold;
            font-size: 10px;
            margin: 10px 0;
        }
        .band-table td {
            padding: 5px 10px;
            color: #ffffff;
        }
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 10px;
            font-size: 9.5px;
            vertical-align: top;
            line-height: 1.45;
        }
        .box-title {
            font-size: 9.5px;
            font-weight: bold;
            color: #0056D2;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 5px;
        }
        .items-table {
            margin: 10px 0;
            border: 1px solid #cbd5e1;
        }
        .items-table th {
            background-color: #0056D2;
            color: #ffffff;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 8px;
            border: none;
        }
        .items-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9.5px;
        }
        .summary-table td {
            padding: 2.5px 0;
            font-size: 10px;
        }
        .grand-total-table {
            background-color: #0056D2;
            color: #ffffff;
            font-weight: bold;
            font-size: 13px;
            margin-top: 5px;
        }
        .grand-total-table td {
            padding: 6px 8px;
            color: #ffffff;
        }
        .footer-table td {
            vertical-align: bottom;
            font-size: 8.5px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <table class="wrapper-table">
        <tr>
            <td class="main-cell">
                <!-- Official Company Header -->
                <table style="border-bottom: 2px solid #0056D2; padding-bottom: 8px;">
                    <tr>
                        <td width="58%" style="vertical-align: top;">
                            <div class="brand-title">{$companyName}</div>
                            <div class="sub-brand">{$brandName}</div>
                            <div class="plant-address">{$plantAddress}</div>
                        </td>
                        <td width="42%" align="right" style="vertical-align: top;">
                            <div class="statutory-box">
                                <div><span style="color: #64748b;">GSTIN:</span> <strong style="font-family: monospace; color: #0056D2;">{$gstin}</strong></div>
                                <div><span style="color: #64748b;">CIN:</span> <span style="font-family: monospace;">{$cin}</span></div>
                                <div><span style="color: #64748b;">Helpline:</span> {$phone}</div>
                                <div><span style="color: #64748b;">Email:</span> {$email}</div>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Banner -->
                <table class="band-table">
                    <tr>
                        <td align="left" style="color: #ffffff; font-weight: bold;">TAX INVOICE &amp; DISPENSING SLIP</td>
                        <td align="right" style="color: #ffffff; font-weight: bold;">ORIGINAL FOR RECIPIENT</td>
                    </tr>
                </table>

                <!-- Metadata Boxes -->
                <table>
                    <tr>
                        <td width="49%" class="info-box">
                            <div class="box-title">Invoice &amp; Dispensing Info</div>
                            <table style="font-size: 9.5px;">
                                <tr><td style="color: #64748b; width: 90px;">Invoice No:</td><td><strong style="color: #0056D2; font-family: monospace;">{$invoice->invoice_number}</strong></td></tr>
                                <tr><td style="color: #64748b;">Date &amp; Time:</td><td><strong>{$dateFormatted}</strong></td></tr>
                                <tr><td style="color: #64748b;">Depot / Hub:</td><td><strong>{$invoice->location_name}</strong></td></tr>
                                <tr><td style="color: #64748b;">POS Terminal:</td><td><strong>{$invoice->operator_name}</strong></td></tr>
                                <tr><td style="color: #64748b;">Place of Supply:</td><td><strong>{$stateCode}-{$state} (State Code: {$stateCode})</strong></td></tr>
                            </table>
                        </td>
                        <td width="2%"></td>
                        <td width="49%" class="info-box">
                            <div class="box-title">Billed To / Recipient Details</div>
                            <table style="font-size: 9.5px;">
                                <tr><td style="color: #64748b; width: 100px;">Customer Name:</td><td><strong style="color: #0f172a;">{$invoice->customer_name}</strong></td></tr>
                                <tr><td style="color: #64748b;">Vehicle Reg No:</td><td><strong style="color: #0056D2; font-family: monospace;">{$invoice->vehicle_number}</strong></td></tr>
                                <tr><td style="color: #64748b;">Contact Mobile:</td><td><strong>{$invoice->customer_phone}</strong></td></tr>
                                <tr><td style="color: #64748b;">Payment Method:</td><td><strong style="color: #059669;">{$invoice->payment_method}</strong></td></tr>
                                <tr><td style="color: #64748b;">Payment Status:</td><td><strong>{$invoice->payment_status}</strong></td></tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Itemized Line Items Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th width="5%" style="text-align: center;">#</th>
                            <th style="text-align: left;">Description of Goods / Packaging</th>
                            <th width="14%" style="text-align: center;">HSN Code</th>
                            <th width="10%" style="text-align: center;">Qty</th>
                            <th width="16%" style="text-align: right;">Rate / Unit (₹)</th>
                            <th width="18%" style="text-align: right;">Total Value (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemsHtml}
                    </tbody>
                </table>

                <!-- Bottom Summary & Totals -->
                <table style="margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 8px;">
                    <tr>
                        <td width="55%" style="vertical-align: top; padding-right: 12px;">
                            <div style="font-size: 9px; color: #64748b; margin-bottom: 2px;">Invoice Amount (in words):</div>
                            <div style="font-size: 9.5px; font-weight: bold; color: #0f172a; background-color: #f8fafc; padding: 6px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">
                                {$amountInWords}
                            </div>

                            <div style="margin-top: 8px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 6px 8px; font-size: 8.5px; color: #0369a1; line-height: 1.35;">
                                <strong style="color: #0056D2; font-size: 9.5px;">ISO 22241-1 &amp; BIS Certified AUS 32 DEF</strong><br>
                                High-purity automotive urea solution tested in compliance with standard specification limits.
                            </div>
                        </td>
                        <td width="45%" style="vertical-align: top;">
                            <table class="summary-table">
                                <tr>
                                    <td style="color: #64748b;">Gross Subtotal:</td>
                                    <td align="right"><strong>₹ {$subtotalFormatted}</strong></td>
                                </tr>
                                <tr>
                                    <td style="color: #16a34a; font-weight: bold;">Counter Discount:</td>
                                    <td align="right" style="color: #16a34a; font-weight: bold;">- ₹ {$discountFormatted}</td>
                                </tr>
                                <tr style="border-top: 1px dashed #e2e8f0;">
                                    <td style="color: #64748b; padding-top: 3px;">Total Taxable Value:</td>
                                    <td align="right" style="padding-top: 3px;"><strong>₹ {$taxableFormatted}</strong></td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b;">Central GST (CGST @ {$cgstPercent}%):</td>
                                    <td align="right"><strong>₹ {$cgstFormatted}</strong></td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b;">State GST (SGST @ {$sgstPercent}%):</td>
                                    <td align="right"><strong>₹ {$sgstFormatted}</strong></td>
                                </tr>
                            </table>

                            <table class="grand-total-table">
                                <tr>
                                    <td style="color: #ffffff; text-transform: uppercase; font-size: 10px;">Grand Total (INR):</td>
                                    <td align="right" style="color: #ffffff; font-size: 13.5px;">₹ {$grandTotalFormatted}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Signatory & Declarations -->
                <table class="footer-table" style="margin-top: 14px; border-top: 1.5px solid #0056D2; padding-top: 6px;">
                    <tr>
                        <td width="65%">
                            <strong>Statutory Declaration:</strong> We declare that this invoice shows the actual price of the goods described and all particulars are true and correct.<br>
                            <span style="color: #0056D2; font-weight: bold;">This is a computer-generated tax invoice verified by {$companyName} billing engine.</span>
                        </td>
                        <td width="35%" align="right">
                            <div style="font-weight: bold; color: #0056D2; font-size: 10px;">{$invoice->operator_name}</div>
                            <div style="font-size: 8px; color: #64748b;">Billing Executive &bull; {$companyName}</div>
                            <div style="margin-top: 14px; border-top: 1px solid #94a3b8; padding-top: 2px; font-size: 7.5px; color: #475569;">
                                Authorized Signatory
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        // If client specifically requests format=html, return pure HTML for browser view/print
        if ($request->query('format') === 'html') {
            return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
        }

        // Otherwise generate real A4 PDF via Dompdf with DejaVu Sans (native Rupee ₹ support)
        try {
            $options = new \Dompdf\Options();
            $options->set('isRemoteEnabled', true);
            $options->set('defaultFont', 'DejaVu Sans');
            $options->set('dpi', 120);

            $dompdf = new \Dompdf\Dompdf($options);
            $dompdf->loadHtml($html, 'UTF-8');
            $dompdf->setPaper('a4', 'portrait');
            $dompdf->render();

            $filename = "Tax_Invoice_{$invoice->invoice_number}.pdf";
            $disposition = $request->query('inline') ? 'inline' : 'attachment';

            return response($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ]);
        } catch (\Exception $e) {
            // Fallback to HTML if PDF engine encountered an unexpected error
            return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
        }
    }

    private function numberToWords($num)
    {
        $no = floor($num);
        $decimal = round($num - $no, 2) * 100;
        $words = [
            0 => '', 1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four', 5 => 'Five',
            6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine', 10 => 'Ten',
            11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen', 14 => 'Fourteen',
            15 => 'Fifteen', 16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen',
            19 => 'Nineteen', 20 => 'Twenty', 30 => 'Thirty', 40 => 'Forty',
            50 => 'Fifty', 60 => 'Sixty', 70 => 'Seventy', 80 => 'Eighty', 90 => 'Ninety'
        ];
        $digits = ['', 'Hundred', 'Thousand', 'Lakh', 'Crore'];

        $str = [];
        $digits_length = strlen((string) $no);
        $i = 0;
        while ($i < $digits_length) {
            $divider = ($i == 2) ? 10 : 100;
            $number = floor($no % $divider);
            $no = floor($no / $divider);
            $i += ($divider == 10) ? 1 : 2;
            if ($number) {
                $plural = (($counter = count($str)) && $number > 9) ? 's' : null;
                $hundred = ($counter == 1 && !empty($str[0])) ? ' and ' : null;
                $str[] = ($number < 21) ? $words[$number] . ' ' . $digits[$counter] . $plural . ' ' . $hundred
                    : $words[floor($number / 10) * 10] . ' ' . $words[$number % 10] . ' ' . $digits[$counter] . $plural . ' ' . $hundred;
            } else {
                $str[] = null;
            }
        }
        $rupees = implode('', array_reverse(array_filter($str)));
        $paise = ($decimal > 0 && isset($words[$decimal])) ? ' and ' . $words[$decimal] . ' Paise' : '';
        return ($rupees ? trim($rupees) : 'Zero') . ' Rupees' . $paise . ' Only';
    }
}
