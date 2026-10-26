<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnquiryController extends Controller
{
    public function index()
    {
        $enquiries = DB::table('enquiries')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $enquiries]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:150',
            'company_name' => 'required|string|min:2|max:200',
            'phone' => ['required', 'string', 'regex:/^(\+91[\-\s]?)?[0]?[6-9]\d{9}$/'],
            'email' => 'nullable|email|max:150',
            'location' => 'required|string|min:2|max:150',
            'product_requested' => 'required|string|max:150',
            'estimated_quantity' => 'required|string|min:1|max:100',
            'message' => 'nullable|string|max:2000'
        ], [
            'name.min' => 'Contact person name must be at least 2 characters.',
            'company_name.min' => 'Fleet or company name must be at least 2 characters.',
            'phone.regex' => 'Please enter a valid 10-digit Indian mobile number (e.g. 9853675971 or +91 9853675971).',
            'location.min' => 'Delivery location must be at least 2 characters.',
            'estimated_quantity.required' => 'Please enter the estimated volume or quantity.'
        ]);

        $inqId = (string) Str::uuid();
        $inqCode = 'INQ-' . rand(4000, 9999);

        DB::table('enquiries')->insert([
            'id' => $inqId,
            'inquiry_code' => $inqCode,
            'name' => $validated['name'],
            'company_name' => $validated['company_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'location' => $validated['location'],
            'product_requested' => $validated['product_requested'],
            'estimated_quantity' => $validated['estimated_quantity'],
            'message' => $validated['message'] ?? null,
            'status' => 'NEW_INQUIRY',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('system_notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'CUSTOMER_INQUIRY',
            'title' => "New Bulk Inquiry: {$validated['company_name']}",
            'message' => "{$validated['name']} requested quote for {$validated['estimated_quantity']} ({$validated['location']}).",
            'action_route' => 'GO_TO_INQUIRIES',
            'created_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Bulk inquiry #{$inqCode} received successfully. Bhadrak dispatch notified.",
            'inquiry_code' => $inqCode
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string'
        ]);

        DB::table('enquiries')
            ->where('id', $id)
            ->orWhere('inquiry_code', $id)
            ->update([
                'status' => $validated['status'],
                'updated_at' => now()
            ]);

        return response()->json([
            'success' => true,
            'message' => "Inquiry status updated to {$validated['status']}."
        ]);
    }
}
