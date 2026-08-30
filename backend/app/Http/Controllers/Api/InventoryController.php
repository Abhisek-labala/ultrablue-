<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    public function index()
    {
        $batches = DB::table('inventory_batches')
            ->join('inventory_locations', 'inventory_batches.location_id', '=', 'inventory_locations.id')
            ->join('product_pack_variants', 'inventory_batches.variant_id', '=', 'product_pack_variants.id')
            ->join('products', 'product_pack_variants.product_id', '=', 'products.id')
            ->select(
                'inventory_batches.*',
                'inventory_locations.name as location_name',
                'product_pack_variants.sku',
                'product_pack_variants.pack_size',
                'products.name as product_name'
            )
            ->get();

        return response()->json(['success' => true, 'data' => $batches]);
    }

    public function locations()
    {
        $locations = DB::table('inventory_locations')->where('is_active', true)->get();
        return response()->json(['success' => true, 'data' => $locations]);
    }

    public function refill(Request $request)
    {
        $validated = $request->validate([
            'location_id' => 'required|uuid|exists:inventory_locations,id',
            'sku' => 'required|string|exists:product_pack_variants,sku',
            'quantity' => 'required|integer|min:1',
            'batch_number' => 'required|string|max:60'
        ]);

        $variant = DB::table('product_pack_variants')->where('sku', $validated['sku'])->first();

        $batch = DB::table('inventory_batches')
            ->where('location_id', $validated['location_id'])
            ->where('variant_id', $variant->id)
            ->first();

        if ($batch) {
            DB::table('inventory_batches')
                ->where('id', $batch->id)
                ->update([
                    'available_stock' => $batch->available_stock + $validated['quantity'],
                    'batch_number' => $validated['batch_number'],
                    'updated_at' => now()
                ]);
        } else {
            DB::table('inventory_batches')->insert([
                'id' => (string) Str::uuid(),
                'location_id' => $validated['location_id'],
                'variant_id' => $variant->id,
                'batch_number' => $validated['batch_number'],
                'mfg_date' => now()->toDateString(),
                'expiry_date' => now()->addYear()->toDateString(),
                'available_stock' => $validated['quantity'],
                'reserved_stock' => 0,
                'min_threshold' => 20,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Stock successfully refilled with {$validated['quantity']} units for {$validated['sku']}."
        ]);
    }
}
