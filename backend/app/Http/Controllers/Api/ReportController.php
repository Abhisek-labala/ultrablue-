<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get Aggregated Analytics & Reports Summary
     */
    public function summary(Request $request)
    {
        // 1. Sales & POS Invoices Metrics
        $totalSales = (float) DB::table('invoices')->sum('grand_total');
        $totalSubtotal = (float) DB::table('invoices')->sum('subtotal');
        $totalTax = (float) (DB::table('invoices')->sum('cgst_amount') + DB::table('invoices')->sum('sgst_amount'));
        $totalInvoicesCount = DB::table('invoices')->count();
        $avgInvoiceValue = $totalInvoicesCount > 0 ? ($totalSales / $totalInvoicesCount) : 0;

        // Sales by Depot Location
        $salesByLocation = DB::table('invoices')
            ->join('inventory_locations', 'invoices.location_id', '=', 'inventory_locations.id')
            ->select('inventory_locations.name as location_name', DB::raw('SUM(invoices.grand_total) as total_amount'), DB::raw('COUNT(invoices.id) as invoice_count'))
            ->groupBy('inventory_locations.name')
            ->get();

        // Sales by Payment Method
        $salesByPaymentMethod = DB::table('invoices')
            ->select('payment_method', DB::raw('SUM(grand_total) as total_amount'), DB::raw('COUNT(id) as count'))
            ->groupBy('payment_method')
            ->get();

        // 2. Customer Inquiries Metrics
        $totalInquiriesCount = DB::table('enquiries')->count();
        $inquiriesByStatus = DB::table('enquiries')
            ->select('status', DB::raw('COUNT(id) as count'))
            ->groupBy('status')
            ->get();

        $inquiriesByProduct = DB::table('enquiries')
            ->select('product_requested', DB::raw('COUNT(id) as count'))
            ->groupBy('product_requested')
            ->get();

        // 3. Distributor Accounts & Activity Metrics
        $totalDistributorsCount = DB::table('distributor_profiles')->count();
        $distributorsByStatus = DB::table('distributor_profiles')
            ->select('account_status', DB::raw('COUNT(id) as count'))
            ->groupBy('account_status')
            ->get();

        $distributorsByTier = DB::table('distributor_profiles')
            ->select('discount_tier', DB::raw('COUNT(id) as count'), DB::raw('SUM(credit_limit) as total_credit'))
            ->groupBy('discount_tier')
            ->get();

        $totalCreditLimit = (float) DB::table('distributor_profiles')->sum('credit_limit');

        // 4. Inventory Health Summary
        $totalAvailableUnits = (int) DB::table('inventory_batches')->sum('available_stock');
        $lowStockBatches = DB::table('inventory_batches')
            ->whereColumn('available_stock', '<=', 'min_threshold')
            ->where('available_stock', '>', 0)
            ->count();
        $outOfStockBatches = DB::table('inventory_batches')
            ->where('available_stock', '<=', 0)
            ->count();

        // Top Selling Variants
        $topItems = DB::table('invoice_items')
            ->join('product_pack_variants', 'invoice_items.variant_id', '=', 'product_pack_variants.id')
            ->select('product_pack_variants.pack_size', 'product_pack_variants.sku', DB::raw('SUM(invoice_items.quantity) as total_qty'), DB::raw('SUM(invoice_items.line_total) as total_revenue'))
            ->groupBy('product_pack_variants.pack_size', 'product_pack_variants.sku')
            ->orderBy('total_qty', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'sales' => [
                    'totalRevenue' => $totalSales,
                    'totalTax' => $totalTax,
                    'totalSubtotal' => $totalSubtotal,
                    'totalInvoices' => $totalInvoicesCount,
                    'avgInvoiceValue' => round($avgInvoiceValue, 2),
                    'byLocation' => $salesByLocation,
                    'byPaymentMethod' => $salesByPaymentMethod,
                    'topProducts' => $topItems
                ],
                'inquiries' => [
                    'totalInquiries' => $totalInquiriesCount,
                    'byStatus' => $inquiriesByStatus,
                    'byProduct' => $inquiriesByProduct
                ],
                'distributors' => [
                    'totalDistributors' => $totalDistributorsCount,
                    'totalCreditLimit' => $totalCreditLimit,
                    'byStatus' => $distributorsByStatus,
                    'byTier' => $distributorsByTier
                ],
                'inventory' => [
                    'totalAvailableUnits' => $totalAvailableUnits,
                    'lowStockBatches' => $lowStockBatches,
                    'outOfStockBatches' => $outOfStockBatches
                ]
            ]
        ]);
    }
}
