<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ComplianceController extends Controller
{
    // =========================================================================
    // 1. COMPLIANCE PARAMETERS (ISO 22241 / BIS Standards Matrix)
    // =========================================================================

    public function getParameters()
    {
        $params = DB::table('compliance_parameters')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $params]);
    }

    public function storeParameter(Request $request)
    {
        $validated = $request->validate([
            'prop' => 'required|string|max:150',
            'unit' => 'nullable|string|max:50',
            'limit' => 'required|string|max:100',
            'batch' => 'required|string|max:100',
            'method' => 'required|string|max:150',
        ]);

        $id = (string) Str::uuid();
        $record = [
            'id' => $id,
            'prop' => $validated['prop'],
            'unit' => $validated['unit'] ?? '%',
            'limit' => $validated['limit'],
            'batch' => $validated['batch'],
            'method' => $validated['method'],
            'verified' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('compliance_parameters')->insert($record);

        return response()->json(['success' => true, 'message' => 'Compliance parameter saved successfully.', 'data' => $record], 201);
    }

    public function deleteParameter($id)
    {
        DB::table('compliance_parameters')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Compliance parameter removed successfully.']);
    }

    // =========================================================================
    // 2. OEM MANUFACTURER APPROVALS
    // =========================================================================

    public function getOemApprovals()
    {
        $approvals = DB::table('oem_approvals')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $approvals]);
    }

    public function storeOemApproval(Request $request)
    {
        $validated = $request->validate([
            'oem' => 'required|string|max:200',
            'approval_no' => 'required|string|max:100',
            'engine_standard' => 'required|string|max:150',
            'valid_date' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
        ]);

        $id = (string) Str::uuid();
        $record = [
            'id' => $id,
            'oem' => $validated['oem'],
            'approval_no' => $validated['approval_no'],
            'engine_standard' => $validated['engine_standard'],
            'valid_date' => $validated['valid_date'] ?? '31-Dec-2027',
            'status' => $validated['status'] ?? 'APPROVED',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('oem_approvals')->insert($record);

        return response()->json(['success' => true, 'message' => 'OEM Approval registered successfully.', 'data' => $record], 201);
    }

    public function deleteOemApproval($id)
    {
        DB::table('oem_approvals')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'OEM Approval deleted successfully.']);
    }

    // =========================================================================
    // 3. MASTER PACKAGING FORMATS REGISTRY
    // =========================================================================

    public function getPackSizes()
    {
        $packs = DB::table('pack_sizes_master')
            ->orderBy('volume', 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $packs]);
    }

    public function storePackSize(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'volume' => 'required|numeric|min:0.1',
            'type' => 'nullable|string|max:200',
            'handle' => 'nullable|string|max:150',
            'tare_weight' => 'nullable|string|max:50',
            'nozzle' => 'nullable|string|max:150',
            'barcode_prefix' => 'nullable|string|max:50',
        ]);

        $id = (string) Str::uuid();
        $record = [
            'id' => $id,
            'name' => $validated['name'],
            'volume' => $validated['volume'],
            'type' => $validated['type'] ?? '',
            'handle' => $validated['handle'] ?? '',
            'tare_weight' => $validated['tare_weight'] ?? '',
            'nozzle' => $validated['nozzle'] ?? '',
            'barcode_prefix' => $validated['barcode_prefix'] ?? 'UBP',
            'status' => 'ACTIVE',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('pack_sizes_master')->insert($record);

        return response()->json(['success' => true, 'message' => 'Pack configuration created successfully.', 'data' => $record], 201);
    }

    public function deletePackSize($id)
    {
        DB::table('pack_sizes_master')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Pack configuration deleted successfully.']);
    }

    // =========================================================================
    // 4. BATCH QUALITY CERTIFICATES
    // =========================================================================

    public function getBatchCertificates()
    {
        $certs = DB::table('batch_certificates')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $certs]);
    }

    public function storeBatchCertificate(Request $request)
    {
        $validated = $request->validate([
            'cert_no' => 'required|string|max:100',
            'batch_no' => 'required|string|max:100',
            'date' => 'nullable|string|max:50',
            'location' => 'required|string|max:150',
            'purity' => 'required|string|max:100',
            'density' => 'required|string|max:100',
            'chemist' => 'required|string|max:150',
            'status' => 'nullable|string|max:50',
        ]);

        $id = (string) Str::uuid();
        $record = [
            'id' => $id,
            'cert_no' => $validated['cert_no'],
            'batch_no' => $validated['batch_no'],
            'date' => $validated['date'] ?? now()->format('d-M-Y'),
            'location' => $validated['location'],
            'purity' => $validated['purity'],
            'density' => $validated['density'],
            'chemist' => $validated['chemist'],
            'status' => $validated['status'] ?? 'PASSED',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('batch_certificates')->insert($record);

        return response()->json(['success' => true, 'message' => 'Batch Certificate issued successfully.', 'data' => $record], 201);
    }

    public function deleteBatchCertificate($id)
    {
        DB::table('batch_certificates')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Batch Certificate removed successfully.']);
    }
}
