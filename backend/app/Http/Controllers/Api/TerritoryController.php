<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TerritoryController extends Controller
{
    /**
     * Get all territories from the database (grouped by State)
     */
    public function index()
    {
        $territories = DB::table('territories')
            ->where('is_active', true)
            ->orderBy('state')
            ->orderBy('city')
            ->get();

        $grouped = [];
        foreach ($territories as $t) {
            if (!isset($grouped[$t->state])) {
                $grouped[$t->state] = [];
            }
            $grouped[$t->state][] = [
                'id' => $t->id,
                'city' => $t->city,
                'region_code' => $t->region_code
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $territories,
            'grouped' => $grouped
        ]);
    }

    /**
     * Admin adds a new State/City territory into the database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'state' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'region_code' => 'nullable|string|max:50'
        ]);

        $state = trim($validated['state']);
        $city = trim($validated['city']);

        // Check if already exists
        $existing = DB::table('territories')
            ->whereRaw('LOWER(state) = ?', [strtolower($state)])
            ->whereRaw('LOWER(city) = ?', [strtolower($city)])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => "Territory '{$city}, {$state}' is already in the database.",
                'data' => $existing
            ]);
        }

        $id = (string) Str::uuid();
        $code = !empty($validated['region_code']) 
            ? $validated['region_code'] 
            : strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $state), 0, 3));

        DB::table('territories')->insert([
            'id' => $id,
            'state' => $state,
            'city' => $city,
            'region_code' => $code,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $newRecord = DB::table('territories')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => "Territory '{$city}, {$state}' added to database successfully.",
            'data' => $newRecord
        ], 201);
    }

    /**
     * Admin updates a State/City territory in the database
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'state' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'region_code' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean'
        ]);

        $state = trim($validated['state']);
        $city = trim($validated['city']);

        $updateData = [
            'state' => $state,
            'city' => $city,
            'updated_at' => now()
        ];

        if (isset($validated['region_code'])) {
            $updateData['region_code'] = $validated['region_code'];
        }
        if (isset($validated['is_active'])) {
            $updateData['is_active'] = $validated['is_active'];
        }

        DB::table('territories')->where('id', $id)->update($updateData);

        $updated = DB::table('territories')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => "Territory '{$city}, {$state}' updated successfully.",
            'data' => $updated
        ]);
    }

    /**
     * Admin deletes a territory from the database
     */
    public function destroy($id)
    {
        DB::table('territories')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => "Territory deleted from database."
        ]);
    }
}
