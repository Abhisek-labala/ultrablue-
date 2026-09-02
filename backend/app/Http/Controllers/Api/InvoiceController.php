<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = DB::table('invoices')
            ->leftJoin('inventory_locations', 'invoices.location_id', '=', 'inventory_locations.id')
            ->select('invoices.*', 'inventory_locations.name as location_name')
            ->orderBy('invoices.created_at', 'desc')
            ->get();

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

                $gstRate = ($productInfo && isset($productInfo->gst_rate)) ? floatval($productInfo->gst_rate) : 18.00;
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

            // Dynamic Sequential Invoice Number: INVOICE-YY-0000001
            $year = date('y');
            $prefix = "INVOICE-{$year}-";

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
}
