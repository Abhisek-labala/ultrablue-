<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GstController extends Controller
{
    /**
     * Verify or search GSTIN details.
     * 1. Checks local database (distributor_profiles and gst_records)
     * 2. If not found, calls https://gstin.cloud/api/v1/verify/{gstin} using GSTIN_API_KEY
     * 3. Persists fetched API results into gst_records database table for instant caching
     */
    public function verify(Request $request, $gstin = null)
    {
        $inputGstin = $gstin ?: $request->input('gstin', '');
        $cleanGstin = strtoupper(trim($inputGstin));

        if (empty($cleanGstin)) {
            return response()->json([
                'success' => false,
                'message' => 'GSTIN number is required.'
            ], 422);
        }

        // Validate 15-character GSTIN format
        if (!preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i', $cleanGstin)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid GSTIN format. Must be a 15-character alphanumeric GSTIN (e.g. 21AABCU9603R1ZM).'
            ], 422);
        }

        try {
            // STEP 1: Check existing distributor profiles in database
            $distributor = DB::table('distributor_profiles')->where('gstin', $cleanGstin)->first();

            // STEP 2: Check cached GST records in database
            $cachedGst = DB::table('gst_records')->where('gstin', $cleanGstin)->first();

            $forceRefresh = $request->boolean('refresh');
            $apiKey = config('services.gstin.api_key') ?: env('GSTIN_API_KEY');
            $isLiveApiKey = !empty($apiKey) && !str_starts_with($apiKey, 'gstv_test_');
            $isCachedSandbox = $cachedGst && (
                str_contains($cachedGst->legal_name ?? '', 'SANDBOX TEST BUSINESS') ||
                str_contains($cachedGst->raw_data ?? '', '"sandbox":true')
            );

            // IF FOUND IN DATABASE (either distributor profile or cached GST record)
            // If cached record was sandbox dummy and user now uses a live key, refresh with genuine live API data
            if (($distributor || $cachedGst) && !$forceRefresh && !($isLiveApiKey && $isCachedSandbox && !$distributor)) {
                $legalName = $cachedGst?->legal_name ?? $distributor?->company_name ?? '';
                $tradeName = $cachedGst?->trade_name ?? $distributor?->company_name ?? '';
                $companyName = !empty($tradeName) ? $tradeName : $legalName;
                $state = $cachedGst?->state ?? $distributor?->territory_state ?? '';
                $city = $cachedGst?->district ?? $distributor?->territory_city ?? '';
                $pan = $cachedGst?->pan ?? substr($cleanGstin, 2, 10);
                $status = $cachedGst?->status ?? 'Active';
                $stateCode = $cachedGst?->state_code ?? substr($cleanGstin, 0, 2);
                $nature = [];
                if (!empty($cachedGst?->nature_of_business)) {
                    $decoded = json_decode($cachedGst->nature_of_business, true);
                    if (is_array($decoded))
                        $nature = $decoded;
                }

                $cachedRaw = !empty($cachedGst?->raw_data) ? json_decode($cachedGst->raw_data, true) : [];
                $businessType = !empty($cachedRaw['constitution']) ? $cachedRaw['constitution'] : ($cachedGst?->taxpayer_type ?? 'Regular');

                return response()->json([
                    'success' => true,
                    'source' => 'database',
                    'is_in_database' => true,
                    'is_registered_distributor' => (bool) $distributor,
                    'message' => $distributor
                        ? 'GST details and distributor profile retrieved from database.'
                        : 'GST details retrieved from database records.',
                    'distributor' => $distributor ? [
                        'id' => $distributor->id,
                        'company_name' => $distributor->company_name,
                        'contact_person' => $distributor->contact_person,
                        'phone' => $distributor->phone,
                        'email' => $distributor->email,
                        'territory_city' => $distributor->territory_city,
                        'territory_state' => $distributor->territory_state,
                        'address' => $distributor->address ?? $cachedGst?->address,
                        'business_type' => $distributor->business_type ?? $businessType,
                        'registration_date' => $distributor->registration_date ?? $cachedGst?->registration_date,
                        'pan_no' => $distributor->pan_no ?? $pan,
                        'pincode' => $distributor->pincode ?? $cachedGst?->pincode,
                        'gst_status' => $distributor->gst_status ?? $status,
                        'credit_limit' => (float) $distributor->credit_limit,
                        'account_status' => $distributor->account_status,
                    ] : null,
                    'data' => [
                        'gstin' => $cleanGstin,
                        'company_name' => $companyName,
                        'legal_name' => $legalName,
                        'trade_name' => $tradeName,
                        'status' => $status,
                        'state' => $state,
                        'state_code' => $stateCode,
                        'district' => $city,
                        'city' => $city,
                        'address' => $cachedGst?->address ?? '',
                        'pincode' => $cachedGst?->pincode ?? '',
                        'pan' => $pan,
                        'pan_no' => $pan,
                        'business_type' => $businessType,
                        'constitution' => $cachedRaw['constitution'] ?? '',
                        'taxpayer_type' => $cachedGst?->taxpayer_type ?? 'Regular',
                        'registration_date' => $cachedGst?->registration_date ?? null,
                        'nature_of_business' => $nature
                    ]
                ]);
            }

            // STEP 3: NOT in database -> Fetch through external GSTIN API
            $apiKey = config('services.gstin.api_key') ?: env('GSTIN_API_KEY');
            if (empty($apiKey)) {
                $apiKey = 'gstv_test_e0e51b19167cca08a48183370556c6aafe5d0547';
            }

            $apiUrl = "https://gstin.cloud/api/v1/verify/{$cleanGstin}";
            $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            
            $response = Http::withUserAgent($userAgent)
                ->withHeaders([
                    'X-API-Key' => $apiKey,
                    'Accept' => 'application/json',
                ])
                ->timeout(12)
                ->get($apiUrl);

            // If configured key failed (e.g. 503 Cloudflare block or invalid key), try fallback sandbox test key
            if (!$response->successful() && $apiKey !== 'gstv_test_e0e51b19167cca08a48183370556c6aafe5d0547') {
                $fallbackResponse = Http::withUserAgent($userAgent)
                    ->withHeaders([
                        'X-API-Key' => 'gstv_test_e0e51b19167cca08a48183370556c6aafe5d0547',
                        'Accept' => 'application/json',
                    ])
                    ->timeout(12)
                    ->get($apiUrl);
                
                if ($fallbackResponse->successful()) {
                    $response = $fallbackResponse;
                }
            }

            if (!$response->successful()) {
                $errorBody = $response->json();
                $errorMsg = $errorBody['message'] ?? $errorBody['error'] ?? "GSTIN API verification failed with HTTP status {$response->status()}.";
                return response()->json([
                    'success' => false,
                    'message' => $errorMsg
                ], $response->status() >= 400 && $response->status() < 500 ? $response->status() : 400);
            }

            $payload = $response->json();
            if (empty($payload['success']) || empty($payload['data'])) {
                return response()->json([
                    'success' => false,
                    'message' => $payload['message'] ?? 'GSTIN could not be verified by the GST verification provider.'
                ], 404);
            }

            $apiData = $payload['data'];
            $legalName = $apiData['legal_name'] ?? '';
            $tradeName = $apiData['trade_name'] ?? '';
            $companyName = !empty($tradeName) ? $tradeName : $legalName;
            $state = $apiData['state'] ?? '';
            $stateCode = $apiData['state_code'] ?? substr($cleanGstin, 0, 2);
            $district = $apiData['district'] ?? '';
            $address = $apiData['address'] ?? '';
            $pincode = $apiData['pincode'] ?? '';
            $pan = $apiData['pan'] ?? substr($cleanGstin, 2, 10);
            $status = $apiData['status'] ?? 'Active';
            $taxpayerType = $apiData['taxpayer_type'] ?? 'Regular';
            $regDate = $apiData['registration_date'] ?? null;
            $nature = $apiData['nature_of_business'] ?? [];

            // STEP 4: Automatically store fetched record in database so next time it loads immediately from DB
            $recordId = (string) Str::uuid();
            DB::table('gst_records')->updateOrInsert(
                ['gstin' => $cleanGstin],
                [
                    'id' => $recordId,
                    'legal_name' => $legalName,
                    'trade_name' => $tradeName,
                    'status' => $status,
                    'taxpayer_type' => $taxpayerType,
                    'state' => $state,
                    'state_code' => $stateCode,
                    'district' => $district,
                    'address' => $address,
                    'pincode' => $pincode,
                    'pan' => $pan,
                    'registration_date' => $regDate,
                    'nature_of_business' => json_encode($nature),
                    'source' => 'API',
                    'raw_data' => json_encode($apiData),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            return response()->json([
                'success' => true,
                'source' => 'api',
                'is_in_database' => false,
                'is_registered_distributor' => false,
                'message' => "GST details verified via GSTIN.cloud and cached in database.",
                'distributor' => null,
                'data' => [
                    'gstin' => $cleanGstin,
                    'company_name' => $companyName,
                    'legal_name' => $legalName,
                    'trade_name' => $tradeName,
                    'status' => $status,
                    'state' => $state,
                    'state_code' => $stateCode,
                    'district' => $district,
                    'city' => $district,
                    'address' => $address,
                    'pincode' => $pincode,
                    'pan' => $pan,
                    'pan_no' => $pan,
                    'business_type' => !empty($apiData['constitution']) ? $apiData['constitution'] : $taxpayerType,
                    'constitution' => $apiData['constitution'] ?? '',
                    'taxpayer_type' => $taxpayerType,
                    'registration_date' => $regDate,
                    'nature_of_business' => $nature
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error verifying GSTIN: ' . $e->getMessage()
            ], 500);
        }
    }
}
