<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DistributorOrderController extends Controller
{
    /**
     * List all distributor orders with items and distributor profile info
     */
    public function index(Request $request)
    {
        $query = DB::table('distributor_orders')
            ->leftJoin('distributor_profiles', 'distributor_orders.distributor_id', '=', 'distributor_profiles.id')
            ->select(
                'distributor_orders.*',
                'distributor_profiles.credit_limit',
                'distributor_profiles.outstanding_credit',
                'distributor_profiles.account_status as distributor_status'
            );

        if ($request->filled('status')) {
            $status = strtoupper(trim($request->query('status')));
            if ($status === 'PENDING') {
                $query->where('distributor_orders.status', 'PENDING_ADMIN_APPROVAL');
            } else {
                $query->where('distributor_orders.status', $status);
            }
        }

        if ($request->filled('distributor_id')) {
            $query->where('distributor_orders.distributor_id', $request->query('distributor_id'));
        }

        if ($request->filled('phone')) {
            $cleanPhone = preg_replace('/\D/', '', $request->query('phone'));
            if (strlen($cleanPhone) >= 10) {
                $last10 = substr($cleanPhone, -10);
                $query->where('distributor_orders.distributor_phone', 'LIKE', "%{$last10}%");
            }
        }

        if ($request->filled('search')) {
            $s = strtolower(trim($request->query('search')));
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(distributor_orders.order_number) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(distributor_orders.distributor_name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(distributor_orders.distributor_company) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(distributor_orders.distributor_phone) LIKE ?', ["%{$s}%"]);
            });
        }

        $orders = $query->orderBy('distributor_orders.created_at', 'desc')->get();

        $orderIds = $orders->pluck('id')->toArray();
        $items = DB::table('distributor_order_items')
            ->whereIn('order_id', $orderIds)
            ->get()
            ->groupBy('order_id');

        $result = $orders->map(function ($ord) use ($items) {
            $ord->items = $items->get($ord->id, []);
            $limit = floatval($ord->credit_limit ?? 0);
            $outstanding = floatval($ord->outstanding_credit ?? 0);
            $ord->available_credit = max(0, $limit - $outstanding);
            return $ord;
        });

        return response()->json(['success' => true, 'data' => $result]);
    }

    /**
     * Submit a new distributor stock order / requisition
     */
    public function store(Request $request)
    {
        if ($request->filled('distributor_id')) {
            $profile = DB::table('distributor_profiles')->where('id', $request->input('distributor_id'))->first();
            if ($profile) {
                $request->merge([
                    'distributor_name' => $request->input('distributor_name') ?: ($profile->contact_person ?? ''),
                    'distributor_company' => $request->input('distributor_company') ?: ($profile->company_name ?? ''),
                    'distributor_phone' => $request->input('distributor_phone') ?: ($profile->phone ?? ''),
                    'distributor_email' => $request->input('distributor_email') ?: ($profile->email ?? null),
                    'distributor_gstin' => $request->input('distributor_gstin') ?: ($profile->gstin ?? null),
                    'delivery_city' => $request->input('delivery_city') ?: ($profile->territory_city ?? null),
                    'delivery_state' => $request->input('delivery_state') ?: ($profile->territory_state ?? null),
                ]);
            }
        }

        $validated = $request->validate([
            'distributor_name' => 'required|string|min:2|max:150',
            'distributor_company' => 'required|string|min:2|max:200',
            'distributor_phone' => 'required|string',
            'distributor_email' => 'nullable|email|max:150',
            'distributor_gstin' => 'nullable|string|max:25',
            'delivery_city' => 'nullable|string|max:100',
            'delivery_state' => 'nullable|string|max:100',
            'order_notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.sku' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0'
        ]);

        return DB::transaction(function () use ($validated) {
            $cleanPhone = preg_replace('/\D/', '', $validated['distributor_phone']);
            $last10 = strlen($cleanPhone) >= 10 ? substr($cleanPhone, -10) : $cleanPhone;

            // Match existing distributor profile if possible
            $distProfile = DB::table('distributor_profiles')
                ->where('phone', 'LIKE', "%{$last10}%")
                ->orWhereRaw('LOWER(company_name) = ?', [strtolower(trim($validated['distributor_company']))])
                ->first();

            $distId = $distProfile ? $distProfile->id : null;

            // Generate Sequential Order Number: ORD-DIST-YY-XXXX
            $year = date('y');
            $prefix = "ORD-DIST-{$year}-";
            $latest = DB::table('distributor_orders')
                ->where('order_number', 'LIKE', "{$prefix}%")
                ->orderByRaw("LENGTH(order_number) DESC, order_number DESC")
                ->lockForUpdate()
                ->value('order_number');

            if ($latest && preg_match('/^ORD-DIST-\d{2}-(\d+)$/', $latest, $m)) {
                $nextSeq = ((int) $m[1]) + 1;
            } else {
                $nextSeq = 1001;
            }
            $orderNumber = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            $orderId = (string) Str::uuid();
            $totalEst = 0;
            $itemsToInsert = [];

            foreach ($validated['items'] as $item) {
                $variant = DB::table('product_pack_variants')
                    ->join('products', 'product_pack_variants.product_id', '=', 'products.id')
                    ->where('product_pack_variants.sku', $item['sku'])
                    ->select(
                        'product_pack_variants.id',
                        'product_pack_variants.pack_size',
                        'product_pack_variants.distributor_base_price',
                        'product_pack_variants.standard_mrp',
                        'products.name as product_name'
                    )
                    ->first();

                $unitPrice = floatval($item['unit_price'] ?? 0);
                if ($unitPrice <= 0 && $variant) {
                    $unitPrice = floatval($variant->distributor_base_price ?? ($variant->standard_mrp * 0.75));
                }
                $qty = intval($item['quantity']);
                $lineTotal = $unitPrice * $qty;
                $totalEst += $lineTotal;

                $itemsToInsert[] = [
                    'id' => (string) Str::uuid(),
                    'order_id' => $orderId,
                    'variant_id' => $variant ? $variant->id : null,
                    'sku' => $item['sku'],
                    'product_name' => $variant ? $variant->product_name : 'UltraBlue+ DEF Fluids',
                    'pack_size' => $variant ? $variant->pack_size : 'Pack',
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }

            // Insert parent distributor order first
            DB::table('distributor_orders')->insert([
                'id' => $orderId,
                'order_number' => $orderNumber,
                'distributor_id' => $distId,
                'distributor_name' => trim($validated['distributor_name']),
                'distributor_company' => trim($validated['distributor_company']),
                'distributor_phone' => trim($validated['distributor_phone']),
                'distributor_email' => !empty($validated['distributor_email']) ? trim($validated['distributor_email']) : ($distProfile->email ?? null),
                'distributor_gstin' => !empty($validated['distributor_gstin']) ? strtoupper(trim($validated['distributor_gstin'])) : ($distProfile->gstin ?? null),
                'delivery_city' => $validated['delivery_city'] ?? ($distProfile->territory_city ?? null),
                'delivery_state' => $validated['delivery_state'] ?? ($distProfile->territory_state ?? null),
                'total_estimated_value' => round($totalEst, 2),
                'status' => 'PENDING_ADMIN_APPROVAL',
                'order_notes' => $validated['order_notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Insert items child records
            foreach ($itemsToInsert as $childItem) {
                DB::table('distributor_order_items')->insert($childItem);
            }

            return response()->json([
                'success' => true,
                'message' => "Stock order #{$orderNumber} placed successfully! Pending Admin verification.",
                'id' => $orderId,
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'status' => 'PENDING_ADMIN_APPROVAL',
                'total_estimated_value' => $totalEst
            ], 201);
        });
    }

    /**
     * Admin approves the distributor order
     */
    public function approve(Request $request, $id)
    {
        $order = DB::table('distributor_orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Distributor order not found.'], 404);
        }

        if ($order->status === 'CONVERTED_TO_INVOICE') {
            return response()->json(['success' => false, 'message' => 'This order has already been billed and completed.'], 422);
        }

        $adminUser = $request->input('admin_name') ?: ($request->user()?->name ?: 'Admin');
        $adminNotes = $request->input('admin_notes', 'Approved for Depot Dispensing & POS Billing');

        DB::table('distributor_orders')->where('id', $id)->update([
            'status' => 'APPROVED',
            'approved_by' => $adminUser,
            'admin_notes' => $adminNotes,
            'approved_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Order #{$order->order_number} has been approved and routed to Sales Operators for billing & dispatch.",
            'order_id' => $id,
            'status' => 'APPROVED'
        ]);
    }

    /**
     * Admin rejects the distributor order
     */
    public function reject(Request $request, $id)
    {
        $order = DB::table('distributor_orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Distributor order not found.'], 404);
        }

        $reason = $request->input('reason', 'Order declined by Plant Administration.');

        DB::table('distributor_orders')->where('id', $id)->update([
            'status' => 'REJECTED',
            'admin_notes' => $reason,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Order #{$order->order_number} has been rejected.",
            'order_id' => $id,
            'status' => 'REJECTED'
        ]);
    }

    /**
     * Fetch credit ledger and statement for a distributor
     */
    public function creditLedger($distributorId)
    {
        $dist = DB::table('distributor_profiles')->where('id', $distributorId)->first();
        if (!$dist) {
            return response()->json(['success' => false, 'message' => 'Distributor not found.'], 404);
        }

        $transactions = DB::table('distributor_credit_transactions')
            ->leftJoin('invoices', 'distributor_credit_transactions.invoice_id', '=', 'invoices.id')
            ->where('distributor_credit_transactions.distributor_id', $distributorId)
            ->select(
                'distributor_credit_transactions.*',
                'invoices.invoice_number'
            )
            ->orderBy('distributor_credit_transactions.created_at', 'desc')
            ->get();

        $creditLimit = floatval($dist->credit_limit);
        $outstanding = floatval($dist->outstanding_credit ?? 0);
        $available = max(0, $creditLimit - $outstanding);

        return response()->json([
            'success' => true,
            'distributor' => [
                'id' => $dist->id,
                'company_name' => $dist->company_name,
                'contact_person' => $dist->contact_person,
                'phone' => $dist->phone,
                'gstin' => $dist->gstin,
                'credit_limit' => $creditLimit,
                'outstanding_credit' => $outstanding,
                'available_credit' => $available
            ],
            'transactions' => $transactions
        ]);
    }

    /**
     * Record full or partial credit settlement payment
     */
    public function settleCredit(Request $request)
    {
        $isCash = strtoupper($request->input('payment_method', '')) === 'CASH';
        $validated = $request->validate([
            'distributor_id' => 'required|uuid|exists:distributor_profiles,id',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string|max:50',
            'reference_no' => $isCash ? 'nullable|string|max:100' : 'required|string|max:100',
            'notes' => 'nullable|string|max:255',
            'recorded_by' => 'nullable|string|max:100'
        ], [
            'amount.min' => 'Settlement amount must be at least ₹1.',
            'reference_no.required' => 'Payment reference / UTR / Cheque number is required.'
        ]);

        return DB::transaction(function () use ($validated, $isCash) {
            $distId = $validated['distributor_id'];
            $settleAmount = floatval($validated['amount']);

            $dist = DB::table('distributor_profiles')->where('id', $distId)->lockForUpdate()->first();
            $currentOutstanding = floatval($dist->outstanding_credit ?? 0);

            if ($currentOutstanding <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Distributor has zero outstanding credit balance.'
                ], 422);
            }

            if ($settleAmount > $currentOutstanding) {
                return response()->json([
                    'success' => false,
                    'message' => "Settlement amount (₹" . number_format($settleAmount, 2) . ") cannot exceed current outstanding balance (₹" . number_format($currentOutstanding, 2) . ")."
                ], 422);
            }

            $newOutstanding = max(0, $currentOutstanding - $settleAmount);

            DB::table('distributor_profiles')->where('id', $distId)->update([
                'outstanding_credit' => $newOutstanding,
                'updated_at' => now()
            ]);

            $txId = (string) Str::uuid();
            $finalRefNo = !empty($validated['reference_no']) ? trim($validated['reference_no']) : ($isCash ? 'CASH-RECEIPT' : null);
            DB::table('distributor_credit_transactions')->insert([
                'id' => $txId,
                'distributor_id' => $distId,
                'invoice_id' => null,
                'type' => 'CREDIT_SETTLEMENT',
                'amount' => $settleAmount,
                'balance_after' => $newOutstanding,
                'payment_method' => $validated['payment_method'],
                'reference_no' => $finalRefNo,
                'notes' => $validated['notes'] ?? 'Credit balance settlement payment',
                'recorded_by' => $validated['recorded_by'] ?? 'Admin Accounts',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => "Settlement of ₹" . number_format($settleAmount, 2) . " recorded successfully. Remaining outstanding: ₹" . number_format($newOutstanding, 2),
                'new_outstanding' => $newOutstanding,
                'outstanding_credit' => $newOutstanding,
                'settled_amount' => $settleAmount
            ]);
        });
    }
}
