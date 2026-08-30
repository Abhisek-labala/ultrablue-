<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class DistributorController extends Controller
{
    public function index()
    {
        $distributors = DB::table('distributor_profiles')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $distributors]);
    }

    /**
     * Admin Direct Distributor Creation (Creates both profile & login user)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:200',
            'contact_person' => 'required|string|max:150',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:150|unique:distributor_profiles,email',
            'gstin' => 'required|string|max:20|unique:distributor_profiles,gstin',
            'territory_city' => 'required|string|max:100',
            'territory_state' => 'required|string|max:100',
            'discount_tier' => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
            'password' => 'nullable|string|min:4'
        ]);

        $distId = (string) Str::uuid();
        $tier = $validated['discount_tier'] ?? 'Gold Tier (15% Disc)';
        $creditLimit = $validated['credit_limit'] ?? 500000.00;
        $password = $validated['password'] ?? 'distributor123';

        // 1. Insert Distributor Profile
        DB::table('distributor_profiles')->insert([
            'id' => $distId,
            'company_name' => $validated['company_name'],
            'contact_person' => $validated['contact_person'],
            'phone' => $validated['phone'],
            'email' => strtolower(trim($validated['email'])),
            'gstin' => strtoupper(trim($validated['gstin'])),
            'territory_city' => $validated['territory_city'],
            'territory_state' => $validated['territory_state'],
            'discount_tier' => $tier,
            'credit_limit' => $creditLimit,
            'account_status' => 'APPROVED',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 2. Create User login credentials if not exists
        User::firstOrCreate(
            ['email' => strtolower(trim($validated['email']))],
            [
                'name' => $validated['contact_person'],
                'password' => Hash::make($password),
                'role' => 'distributor',
                'phone' => $validated['phone'],
                'organization' => $validated['company_name'],
                'status' => 'ACTIVE'
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Distributor account created successfully for {$validated['company_name']}.",
            'id' => $distId
        ], 201);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:200',
            'contact_person' => 'required|string|max:150',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:150',
            'gstin' => 'required|string|max:20|unique:distributor_profiles,gstin',
            'territory_city' => 'required|string|max:100',
            'territory_state' => 'required|string|max:100'
        ]);

        $distId = (string) Str::uuid();

        DB::table('distributor_profiles')->insert([
            'id' => $distId,
            'company_name' => $validated['company_name'],
            'contact_person' => $validated['contact_person'],
            'phone' => $validated['phone'],
            'email' => strtolower(trim($validated['email'])),
            'gstin' => strtoupper(trim($validated['gstin'])),
            'territory_city' => $validated['territory_city'],
            'territory_state' => $validated['territory_state'],
            'discount_tier' => 'Pending Tier Assignment',
            'credit_limit' => 0.00,
            'account_status' => 'PENDING_REVIEW',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Distributor KYC submitted successfully. Admin review initiated.',
            'id' => $distId
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'account_status' => 'required|in:APPROVED,REJECTED,SUSPENDED,PENDING_REVIEW',
            'discount_tier' => 'nullable|string',
            'credit_limit' => 'nullable|numeric'
        ]);

        $updateData = ['account_status' => $validated['account_status'], 'updated_at' => now()];
        if (isset($validated['discount_tier'])) $updateData['discount_tier'] = $validated['discount_tier'];
        if (isset($validated['credit_limit'])) $updateData['credit_limit'] = $validated['credit_limit'];

        DB::table('distributor_profiles')->where('id', $id)->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Distributor account status updated to {$validated['account_status']}."
        ]);
    }
}
