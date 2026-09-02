<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('inventory_batches')
            ->join('inventory_locations', 'inventory_batches.location_id', '=', 'inventory_locations.id')
            ->join('product_pack_variants', 'inventory_batches.variant_id', '=', 'product_pack_variants.id')
            ->join('products', 'product_pack_variants.product_id', '=', 'products.id')
            ->select(
                'inventory_batches.*',
                'inventory_locations.name as location_name',
                'product_pack_variants.sku',
                'product_pack_variants.pack_size',
                'products.name as product_name'
            );

        if ($request->filled('location_id')) {
            $query->where('inventory_batches.location_id', $request->input('location_id'));
        }
        if ($request->filled('location_name')) {
            $query->where('inventory_locations.name', 'ILIKE', '%' . $request->input('location_name') . '%');
        }
        if ($request->filled('assigned_depot')) {
            $query->where('inventory_locations.name', 'ILIKE', '%' . $request->input('assigned_depot') . '%');
        }

        $batches = $query->get();

        return response()->json(['success' => true, 'data' => $batches]);
    }

    public function locations(Request $request)
    {
        $query = DB::table('inventory_locations');
        if (!$request->has('all')) {
            $query->where('is_active', true);
        }
        if ($request->filled('assigned_depot')) {
            $query->where('name', 'ILIKE', '%' . $request->input('assigned_depot') . '%');
        }
        $locations = $query->orderBy('name', 'asc')->get();
        return response()->json(['success' => true, 'data' => $locations]);
    }

    public function refill(Request $request)
    {
        $validated = $request->validate([
            'location_id' => 'required|uuid|exists:inventory_locations,id',
            'sku' => 'required|string|exists:product_pack_variants,sku',
            'quantity' => 'required|integer|min:1',
            'batch_number' => 'required|string|max:60',
            'mfg_date' => 'nullable|date',
            'expiry_date' => 'nullable|date'
        ]);

        $mfgDate = $request->input('mfg_date') ?: now()->toDateString();
        $expDate = $request->input('expiry_date') ?: now()->addYear()->toDateString();

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
                    'mfg_date' => $mfgDate,
                    'expiry_date' => $expDate,
                    'updated_at' => now()
                ]);
        } else {
            DB::table('inventory_batches')->insert([
                'id' => (string) Str::uuid(),
                'location_id' => $validated['location_id'],
                'variant_id' => $variant->id,
                'batch_number' => $validated['batch_number'],
                'mfg_date' => $mfgDate,
                'expiry_date' => $expDate,
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

    public function storeLocation(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:150',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'location_type' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'pincode' => 'nullable|string|max:10',
            'contact_phone' => 'nullable|string|max:20'
        ], [
            'name.required' => 'Depot / Station Name is required.',
            'name.min' => 'Depot Name must be at least 2 characters.'
        ]);

        $code = strtoupper(Str::slug($validated['name'], ''));
        if (strlen($code) > 25) {
            $code = substr($code, 0, 25);
        }
        if (empty($code)) {
            $code = 'DEPOT' . rand(100, 999);
        }
        if (DB::table('inventory_locations')->where('code', $code)->exists()) {
            $code .= rand(10, 99);
        }

        $id = (string) Str::uuid();
        DB::table('inventory_locations')->insert([
            'id' => $id,
            'code' => $code,
            'name' => trim($validated['name']),
            'location_type' => $validated['location_type'] ?? 'depot',
            'address' => $validated['address'] ?? ($validated['name'] . ', ' . ($validated['city'] ?? 'Odisha')),
            'city' => $validated['city'] ?? 'Hub',
            'state' => $validated['state'] ?? 'Odisha',
            'pincode' => $validated['pincode'] ?? '756100',
            'contact_phone' => $validated['contact_phone'] ?? '9853675971',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $loc = DB::table('inventory_locations')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => "Depot / Dispenser Station '{$loc->name}' added to database successfully.",
            'data' => $loc
        ], 201);
    }

    public function updateLocation(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:150',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean'
        ]);

        $updateData = [
            'name' => trim($validated['name']),
            'updated_at' => now()
        ];
        if (isset($validated['city'])) $updateData['city'] = trim($validated['city']);
        if (isset($validated['state'])) $updateData['state'] = trim($validated['state']);
        if (isset($validated['address'])) $updateData['address'] = trim($validated['address']);
        if (isset($validated['contact_phone'])) $updateData['contact_phone'] = trim($validated['contact_phone']);
        if (isset($validated['is_active'])) $updateData['is_active'] = (bool) $validated['is_active'];

        DB::table('inventory_locations')->where('id', $id)->update($updateData);

        $loc = DB::table('inventory_locations')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => "Depot '{$loc->name}' updated successfully.",
            'data' => $loc
        ]);
    }

    public function toggleLocationStatus($id)
    {
        $loc = DB::table('inventory_locations')->where('id', $id)->first();
        if (!$loc) {
            return response()->json(['success' => false, 'message' => 'Depot not found.'], 404);
        }
        $newStatus = !$loc->is_active;
        DB::table('inventory_locations')->where('id', $id)->update([
            'is_active' => $newStatus,
            'updated_at' => now()
        ]);
        return response()->json([
            'success' => true,
            'message' => "Depot '{$loc->name}' is now " . ($newStatus ? 'Active' : 'Deactivated') . ".",
            'is_active' => $newStatus
        ]);
    }

    public function deleteLocation($id)
    {
        $loc = DB::table('inventory_locations')->where('id', $id)->first();
        if ($loc) {
            DB::table('inventory_batches')->where('location_id', $id)->delete();
            DB::table('inventory_locations')->where('id', $id)->delete();
        }
        return response()->json([
            'success' => true,
            'message' => 'Depot deleted from database successfully.'
        ]);
    }
}
