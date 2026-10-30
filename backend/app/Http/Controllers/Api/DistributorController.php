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
            'company_name' => 'required|string|min:2|max:200',
            'contact_person' => 'required|string|min:2|max:150',
            'phone' => ['required', 'string', 'regex:/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/'],
            'email' => 'required|email|max:150',
            'gstin' => ['required', 'string', 'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i', 'unique:distributor_profiles,gstin'],
            'territory_city' => 'required|string|min:2|max:100',
            'territory_state' => 'required|string|min:2|max:100',
            'credit_limit' => 'required|numeric|min:0',
            'password' => 'nullable|string|min:4'
        ], [
            'company_name.required' => 'Enterprise / Company Name is required.',
            'contact_person.required' => 'Contact Person Name is required.',
            'phone.required' => 'Mobile number is required.',
            'phone.regex' => 'Please enter a valid 10-digit mobile number (e.g. 9853675971).',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address (e.g. distributor@domain.com).',
            'gstin.required' => 'GSTIN Number is required.',
            'gstin.regex' => 'Please enter a valid 15-character GSTIN (e.g. 21AABCU9603R1ZM).',
            'gstin.unique' => 'A distributor with this GSTIN is already registered in the database.',
            'territory_state.required' => 'Please select or specify a State.',
            'territory_city.required' => 'Please select or specify a City / Territory.',
            'credit_limit.required' => 'Credit limit is required.',
            'credit_limit.numeric' => 'Credit limit must be a valid number.',
            'password.min' => 'Password must be at least 4 characters.'
        ]);

        $distId = (string) Str::uuid();
        $creditLimit = (float) $validated['credit_limit'];
        $password = !empty($validated['password']) ? $validated['password'] : 'distributor123';
        $state = $validated['territory_state'];
        $cleanGstin = strtoupper(trim($validated['gstin']));

        // Retrieve verified GST details from database cache if available
        $gstRec = DB::table('gst_records')->where('gstin', $cleanGstin)->first();
        $rawGstData = !empty($gstRec?->raw_data) ? json_decode($gstRec->raw_data, true) : [];

        $address = $request->input('address', $gstRec?->address ?? null);
        $businessType = $request->input('business_type', $rawGstData['constitution'] ?? ($gstRec?->taxpayer_type ?? null));
        $regDate = $request->input('registration_date', $gstRec?->registration_date ?? null);
        $panNo = $request->input('pan_no', $gstRec?->pan ?? substr($cleanGstin, 2, 10));
        $pincode = $request->input('pincode', $gstRec?->pincode ?? null);
        $gstStatus = $request->input('gst_status', $gstRec?->status ?? 'Active');

        // 1. Insert Distributor Profile
        DB::table('distributor_profiles')->insert([
            'id' => $distId,
            'company_name' => trim($validated['company_name']),
            'contact_person' => trim($validated['contact_person']),
            'phone' => trim($validated['phone']),
            'email' => strtolower(trim($validated['email'])),
            'gstin' => $cleanGstin,
            'territory_city' => trim($validated['territory_city']),
            'territory_state' => trim($state),
            'address' => $address,
            'business_type' => $businessType,
            'registration_date' => $regDate,
            'pan_no' => $panNo,
            'pincode' => $pincode,
            'gst_status' => $gstStatus,
            'discount_tier' => 'Authorized Partner',
            'credit_limit' => $creditLimit,
            'account_status' => 'APPROVED',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 2. Create User login credentials if not exists
        User::updateOrCreate(
            ['email' => strtolower(trim($validated['email']))],
            [
                'name' => trim($validated['contact_person']),
                'password' => Hash::make($password),
                'role' => 'distributor',
                'phone' => trim($validated['phone']),
                'organization' => trim($validated['company_name']),
                'status' => 'ACTIVE'
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Distributor account created successfully for {$validated['company_name']}.",
            'id' => $distId,
            'data' => [
                'id' => $distId,
                'company_name' => trim($validated['company_name']),
                'contact_person' => trim($validated['contact_person']),
                'phone' => trim($validated['phone']),
                'email' => strtolower(trim($validated['email'])),
                'gstin' => strtoupper(trim($validated['gstin'])),
                'territory_city' => trim($validated['territory_city']),
                'territory_state' => $state,
                'credit_limit' => $creditLimit,
                'account_status' => 'APPROVED'
            ]
        ], 201);
    }

    public function register(Request $request)
    {
        $gstinInput = strtoupper(trim($request->input('gstin', '')));
        $territoryState = $request->input('territory_state', $request->input('state', ''));
        if (empty($territoryState) && !empty($gstinInput)) {
            $gstRec = DB::table('gst_records')->where('gstin', $gstinInput)->first();
            $territoryState = $gstRec?->state ?: 'Odisha';
        }
        $request->merge(['territory_state' => $territoryState ?: 'Odisha']);

        $validated = $request->validate([
            'company_name' => 'required|string|min:2|max:200',
            'contact_person' => 'required|string|min:2|max:150',
            'phone' => ['required', 'string', 'regex:/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/'],
            'email' => 'required|email|max:150',
            'gstin' => ['required', 'string', 'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i', 'unique:distributor_profiles,gstin'],
            'territory_city' => 'required|string|max:100',
            'territory_state' => 'required|string|max:100'
        ], [
            'phone.regex' => 'Please enter a valid 10-digit mobile number.',
            'gstin.regex' => 'Please enter a valid 15-character GSTIN (e.g. 21AABCU9603R1ZM).',
            'gstin.unique' => 'A distributor with this GSTIN is already registered in the database.'
        ]);

        $distId = (string) Str::uuid();
        $cleanGstin = strtoupper(trim($validated['gstin']));

        // Retrieve verified GST details from database cache if available
        $gstRec = DB::table('gst_records')->where('gstin', $cleanGstin)->first();
        $rawGstData = !empty($gstRec?->raw_data) ? json_decode($gstRec->raw_data, true) : [];

        $address = $request->input('address', $gstRec?->address ?? null);
        $businessType = $request->input('business_type', $rawGstData['constitution'] ?? ($gstRec?->taxpayer_type ?? null));
        $regDate = $request->input('registration_date', $gstRec?->registration_date ?? null);
        $panNo = $request->input('pan_no', $gstRec?->pan ?? substr($cleanGstin, 2, 10));
        $pincode = $request->input('pincode', $gstRec?->pincode ?? null);
        $gstStatus = $request->input('gst_status', $gstRec?->status ?? 'Active');

        DB::table('distributor_profiles')->insert([
            'id' => $distId,
            'company_name' => $validated['company_name'],
            'contact_person' => $validated['contact_person'],
            'phone' => $validated['phone'],
            'email' => strtolower(trim($validated['email'])),
            'gstin' => $cleanGstin,
            'territory_city' => $validated['territory_city'],
            'territory_state' => $validated['territory_state'],
            'address' => $address,
            'business_type' => $businessType,
            'registration_date' => $regDate,
            'pan_no' => $panNo,
            'pincode' => $pincode,
            'gst_status' => $gstStatus,
            'discount_tier' => 'Pending Verification',
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

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|min:2|max:200',
            'contact_person' => 'nullable|string|min:2|max:150',
            'phone' => ['nullable', 'string', 'regex:/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/'],
            'email' => 'nullable|email|max:150',
            'gstin' => ['nullable', 'string', 'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i'],
            'territory_city' => 'nullable|string|max:100',
            'territory_state' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:500',
            'business_type' => 'nullable|string|max:100',
            'registration_date' => 'nullable|string|max:50',
            'pan_no' => 'nullable|string|max:20',
            'pincode' => 'nullable|string|max:20',
            'gst_status' => 'nullable|string|max:50',
            'account_status' => 'nullable|in:APPROVED,REJECTED,SUSPENDED,PENDING_REVIEW',
            'credit_limit' => 'nullable|numeric|min:0'
        ], [
            'phone.regex' => 'Please enter a valid 10-digit mobile number.',
            'email.email' => 'Please enter a valid email address.',
            'gstin.regex' => 'Please enter a valid 15-character GSTIN (e.g. 21AABCU9603R1ZM).'
        ]);

        $updateData = ['updated_at' => now()];
        if (isset($validated['company_name'])) $updateData['company_name'] = trim($validated['company_name']);
        if (isset($validated['contact_person'])) $updateData['contact_person'] = trim($validated['contact_person']);
        if (isset($validated['phone'])) $updateData['phone'] = trim($validated['phone']);
        if (isset($validated['email'])) $updateData['email'] = strtolower(trim($validated['email']));
        if (isset($validated['gstin'])) $updateData['gstin'] = strtoupper(trim($validated['gstin']));
        if (isset($validated['territory_city'])) $updateData['territory_city'] = trim($validated['territory_city']);
        if (isset($validated['territory_state'])) $updateData['territory_state'] = trim($validated['territory_state']);
        if (array_key_exists('address', $validated)) $updateData['address'] = $validated['address'];
        if (array_key_exists('business_type', $validated)) $updateData['business_type'] = $validated['business_type'];
        if (array_key_exists('registration_date', $validated)) $updateData['registration_date'] = $validated['registration_date'];
        if (array_key_exists('pan_no', $validated)) $updateData['pan_no'] = $validated['pan_no'];
        if (array_key_exists('pincode', $validated)) $updateData['pincode'] = $validated['pincode'];
        if (array_key_exists('gst_status', $validated)) $updateData['gst_status'] = $validated['gst_status'];
        if (isset($validated['account_status'])) $updateData['account_status'] = $validated['account_status'];
        if (isset($validated['credit_limit'])) $updateData['credit_limit'] = (float) $validated['credit_limit'];

        DB::table('distributor_profiles')->where('id', $id)->update($updateData);

        // Also synchronize user profile details in users table
        $dist = DB::table('distributor_profiles')->where('id', $id)->first();
        if ($dist) {
            User::where('email', $dist->email)->update([
                'name' => $dist->contact_person,
                'phone' => $dist->phone,
                'organization' => $dist->company_name,
                'status' => $dist->account_status === 'APPROVED' ? 'ACTIVE' : ($dist->account_status === 'REJECTED' ? 'REJECTED' : 'PENDING')
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Distributor account details updated successfully.",
            'data' => $dist
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'account_status' => 'required|in:APPROVED,REJECTED,SUSPENDED,PENDING_REVIEW',
            'credit_limit' => 'nullable|numeric'
        ]);

        $updateData = ['account_status' => $validated['account_status'], 'updated_at' => now()];
        if (isset($validated['credit_limit'])) $updateData['credit_limit'] = (float) $validated['credit_limit'];

        DB::table('distributor_profiles')->where('id', $id)->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Distributor account status updated to {$validated['account_status']}."
        ]);
    }
}
