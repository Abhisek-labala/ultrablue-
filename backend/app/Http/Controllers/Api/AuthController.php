<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Services\JwtService;

class AuthController extends Controller
{
    /**
     * Strictly Authenticate User against PostgreSQL Database and Issue Signed JWT Token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:4',
            'role' => 'nullable|string|in:admin,operator,distributor'
        ], [
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email format (e.g. name@domain.com).',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 4 characters long.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');
        $requestedRole = $request->input('role');

        // 1. Strictly Query PostgreSQL `public.users` Table
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => "No account found with email '{$email}'. Please check your spelling or register a new account."
            ], 404);
        }

        // 2. Strict Password Validation
        if (!Hash::check($password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Incorrect password. Please verify your credentials and try again.'
            ], 401);
        }

        // 3. Strict Role Matching Check
        if ($requestedRole && $user->role !== $requestedRole) {
            $userRoleUpper = strtoupper($user->role);
            $requestedRoleUpper = strtoupper($requestedRole);
            return response()->json([
                'status' => 'error',
                'message' => "Role Permission Mismatch: Your account is registered as [{$userRoleUpper}], but you attempted to sign into the [{$requestedRoleUpper}] portal. Please click the {$userRoleUpper} tab above."
            ], 403);
        }

        // 4. Strict Account Status Check
        if ($user->status && !in_array(strtoupper($user->status), ['ACTIVE', 'APPROVED'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Your account is currently pending KYC verification or has been suspended. Please contact plant dispatch.'
            ], 403);
        }

        // 5. Issue Signed RFC 7519 JWT Token
        $payload = [
            'sub' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'title' => $user->role === 'admin' ? 'Super Administrator' : ($user->role === 'operator' ? 'Plant POS Operator' : 'Authorized Gold Distributor'),
            'organization' => $user->organization ?: 'Ayush Green Energy',
            'phone' => $user->phone,
            'permissions' => [$user->role]
        ];

        $token = JwtService::generateToken($payload, 86400 * 7); // 7 days token

        return response()->json([
            'status' => 'success',
            'message' => "Authenticated successfully! Welcome, {$user->name}",
            'token' => $token,
            'user' => $payload
        ], 200);
    }

    /**
     * Strictly Register New Distributor or Sales Operator into PostgreSQL `public.users` & Issue JWT
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullName' => 'required|string|min:3|max:100',
            'email' => 'required|email|max:150',
            'password' => 'required|string|min:6|max:100',
            'role' => 'required|string|in:operator,distributor',
            'companyName' => 'required|string|min:3|max:150',
            'phone' => 'required|string|min:10|max:20',
            'gstin' => 'nullable|string|max:30',
            'location' => 'nullable|string|max:150'
        ], [
            'fullName.required' => 'Full Name is required (min 3 characters).',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must contain at least 6 characters.',
            'companyName.required' => 'Company Name or Operating Station is required.',
            'phone.required' => 'A valid contact mobile number is required.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $role = $request->input('role');
        $fullName = trim($request->input('fullName'));
        $email = strtolower(trim($request->input('email')));
        $password = $request->input('password');
        $companyName = trim($request->input('companyName'));
        $phone = trim($request->input('phone'));
        $gstin = strtoupper(trim($request->input('gstin', '')));
        $location = trim($request->input('location', 'Bhadrak Industrial Estate, Odisha'));

        // Strict Uniqueness Check in PostgreSQL
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            return response()->json([
                'status' => 'error',
                'message' => "An account with email '{$email}' already exists. Please switch to the Sign In tab."
            ], 409);
        }

        // 1. Create User in PostgreSQL `public.users` Table
        $user = User::create([
            'name' => $fullName,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => $role,
            'phone' => $phone,
            'organization' => $companyName,
            'status' => 'ACTIVE'
        ]);

        // 2. If Distributor, also insert into `distributor_profiles`
        if ($role === 'distributor') {
            DB::table('distributor_profiles')->insertOrIgnore([
                'id' => (string) Str::uuid(),
                'company_name' => $companyName,
                'contact_person' => $fullName,
                'phone' => $phone,
                'email' => $email,
                'gstin' => $gstin ?: '21AAAAA' . rand(1000, 9999) . 'A1Z5',
                'territory_city' => $location,
                'territory_state' => 'Odisha',
                'discount_tier' => 'Gold Tier (15% Disc)',
                'credit_limit' => 500000.00,
                'account_status' => 'APPROVED',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        $payload = [
            'sub' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'title' => $role === 'distributor' ? 'Authorized Distributor' : 'Sales POS Operator',
            'organization' => $user->organization,
            'phone' => $user->phone,
            'permissions' => [$role]
        ];

        // 3. Issue Signed RFC 7519 JWT Token
        $token = JwtService::generateToken($payload, 86400 * 7);

        return response()->json([
            'status' => 'success',
            'message' => "Registration Successful! Account created for {$fullName}.",
            'token' => $token,
            'user' => $payload
        ], 201);
    }

    /**
     * Validate JWT Token & Return Current User Profile
     */
    public function me(Request $request)
    {
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Authorization header with Bearer token is required'
            ], 401);
        }

        $token = $matches[1];
        $payload = JwtService::validateToken($token);

        if (!$payload) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired JWT token'
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'user' => $payload
        ], 200);
    }

    /**
     * Logout / Invalidate Session Acknowledgment
     */
    public function logout(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Session logged out successfully'
        ], 200);
    }
}
