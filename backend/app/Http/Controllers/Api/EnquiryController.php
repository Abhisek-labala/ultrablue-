<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\InquiryQuotationMail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class EnquiryController extends Controller
{
    private function findEnquiry(string $id): ?object
    {
        $query = DB::table('enquiries');
        if (Str::isUuid($id)) {
            $query->where('id', $id);
        } else {
            $query->where('inquiry_code', $id);
        }
        return $query->first();
    }

    private function normalizePhoneForWhatsApp(?string $rawPhone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $rawPhone);
        if (strlen($digits) === 10) {
            return '91' . $digits;
        }
        if (strlen($digits) === 11 && str_starts_with($digits, '0')) {
            return '91' . substr($digits, 1);
        }
        return $digits;
    }

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
            'status' => 'required|string|max:50'
        ]);

        $enquiry = $this->findEnquiry($id);
        if (!$enquiry) {
            return response()->json(['success' => false, 'message' => 'Enquiry not found.'], 404);
        }

        DB::table('enquiries')->where('id', $enquiry->id)->update([
            'status' => $validated['status'],
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Inquiry status updated to {$validated['status']}.",
            'status' => $validated['status']
        ]);
    }

    public function submitQuote(Request $request, $id)
    {
        $enquiry = $this->findEnquiry($id);
        if (!$enquiry) {
            return response()->json(['success' => false, 'message' => 'Enquiry not found.'], 404);
        }

        $validated = $request->validate([
            'product_name' => 'required|string|min:2|max:150',
            'price' => 'required|numeric|min:0.01',
            'valid_until' => 'required|date',
            'channels' => 'required|array|min:1',
            'channels.*' => 'string|in:whatsapp,sms,email',
            'phone' => 'nullable|string|max:30',
            'whatsapp_number' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:150',
            'sender_name' => 'nullable|string|max:120',
            'company_name' => 'nullable|string|max:150',
            'reviewed_by' => 'nullable|string|max:120',
        ]);

        $channels = array_values(array_unique($validated['channels']));
        $smsPhone = trim((string) ($validated['phone'] ?? $enquiry->phone ?? ''));
        $waPhone = trim((string) ($validated['whatsapp_number'] ?? $smsPhone));
        $recipientEmail = trim((string) ($validated['email'] ?? $enquiry->email ?? ''));

        if (in_array('whatsapp', $channels, true) && strlen($this->normalizePhoneForWhatsApp($waPhone)) < 10) {
            return response()->json(['success' => false, 'message' => 'A valid WhatsApp number is required.'], 422);
        }
        if (in_array('sms', $channels, true) && strlen($this->normalizePhoneForWhatsApp($smsPhone)) < 10) {
            return response()->json(['success' => false, 'message' => 'A valid mobile number is required for text message.'], 422);
        }
        if (in_array('email', $channels, true) && !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['success' => false, 'message' => 'A valid email address is required for email quotation.'], 422);
        }

        $priceVal = (float) $validated['price'];
        $priceDisplay = fmod($priceVal, 1.0) == 0.0
            ? number_format($priceVal, 0, '.', '')
            : number_format($priceVal, 2, '.', '');

        $dateObj = Carbon::parse($validated['valid_until']);
        $validUntilShort = $dateObj->format('d-m-Y');
        $validUntilLong = $dateObj->format('j F Y');

        $productName = trim($validated['product_name']);
        $customerName = trim((string) ($enquiry->name ?? '')) ?: 'Customer';
        $senderName = trim((string) ($validated['sender_name'] ?? '')) ?: 'Sales Desk';
        $companyName = trim((string) ($validated['company_name'] ?? '')) ?: 'Ayush Green Energy';

        $shortMessage = "The price for {$productName} is {$priceDisplay} and is valid until {$validUntilShort}.\nRegards UltraBluePlus";
        $emailSubject = "Quotation for {$productName}";
        $emailBody = "Dear {$customerName},\n\n"
            . "Thank you for your inquiry regarding {$productName}. We are pleased to offer it at ₹{$priceDisplay}. This quotation is valid through {$validUntilLong}.\n\n"
            . "Please let us know if you would like to proceed or require any additional information. We look forward to assisting you.\n\n"
            . "Kind regards,\n{$senderName}\n{$companyName}";

        $waDigits = $this->normalizePhoneForWhatsApp($waPhone);
        $smsDigits = $this->normalizePhoneForWhatsApp($smsPhone);
        $whatsappUrl = $waDigits ? 'https://wa.me/' . $waDigits . '?text=' . rawurlencode($shortMessage) : null;
        $smsUrl = $smsDigits ? 'sms:+' . $smsDigits . '?body=' . rawurlencode($shortMessage) : null;
        $mailtoUrl = $recipientEmail
            ? 'mailto:' . $recipientEmail . '?subject=' . rawurlencode($emailSubject) . '&body=' . rawurlencode($emailBody)
            : null;

        $emailStatus = null;
        $emailError = null;
        $mailDriver = (string) config('mail.default', 'log');

        if (in_array('email', $channels, true)) {
            try {
                Mail::to($recipientEmail)->send(new InquiryQuotationMail(
                    $customerName,
                    $productName,
                    $priceDisplay,
                    $validUntilLong,
                    $senderName,
                    $companyName,
                    (string) ($enquiry->inquiry_code ?? '')
                ));
                $emailStatus = in_array($mailDriver, ['log', 'array'], true) ? 'logged' : 'sent';
            } catch (\Throwable $e) {
                Log::error('Failed to send inquiry quotation email', [
                    'enquiry_id' => $enquiry->id,
                    'email' => $recipientEmail,
                    'error' => $e->getMessage(),
                ]);
                $emailStatus = 'failed';
                $emailError = $e->getMessage();

                if (count($channels) === 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to send quotation email: ' . $e->getMessage(),
                        'mailto_url' => $mailtoUrl,
                    ], 500);
                }
            }
        }

        // Optional external webhook hooks if configured in services/env
        foreach (['sms' => $smsPhone, 'whatsapp' => $waPhone] as $ch => $targetPhone) {
            $webhookUrl = config("services.{$ch}.webhook_url");
            if (in_array($ch, $channels, true) && !empty($webhookUrl)) {
                try {
                    Http::timeout(5)->post($webhookUrl, [
                        'to' => $targetPhone,
                        'message' => $shortMessage,
                        'inquiry_code' => $enquiry->inquiry_code,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning("Optional {$ch} webhook failed", ['error' => $e->getMessage()]);
                }
            }
        }

        $updateData = [
            'status' => 'RESOLVED',
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('enquiries', 'quoted_price')) {
            $recipients = [];
            if (in_array('whatsapp', $channels, true)) {
                $recipients[] = "WhatsApp: {$waPhone}";
            }
            if (in_array('sms', $channels, true)) {
                $recipients[] = "SMS: {$smsPhone}";
            }
            if (in_array('email', $channels, true)) {
                $recipients[] = "Email: {$recipientEmail}";
            }

            $updateData['quoted_price'] = $priceVal;
            $updateData['quoted_product'] = $productName;
            $updateData['valid_until'] = $dateObj->format('Y-m-d');
            $updateData['quote_channels'] = implode(',', $channels);
            $updateData['quote_recipient'] = implode(' | ', $recipients);
            $updateData['reviewed_by'] = trim((string) ($validated['reviewed_by'] ?? '')) ?: $senderName;
            $updateData['reviewed_at'] = now();
        }

        DB::table('enquiries')->where('id', $enquiry->id)->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Quotation for {$productName} (₹{$priceDisplay}) submitted.",
            'status' => 'RESOLVED',
            'short_message' => $shortMessage,
            'email_subject' => $emailSubject,
            'email_body' => $emailBody,
            'whatsapp_url' => in_array('whatsapp', $channels, true) ? $whatsappUrl : null,
            'sms_url' => in_array('sms', $channels, true) ? $smsUrl : null,
            'mailto_url' => in_array('email', $channels, true) ? $mailtoUrl : null,
            'email_status' => $emailStatus,
            'email_error' => $emailError,
            'mail_driver' => $mailDriver,
        ]);
    }

    public function reject(Request $request, $id)
    {
        $enquiry = $this->findEnquiry($id);
        if (!$enquiry) {
            return response()->json(['success' => false, 'message' => 'Enquiry not found.'], 404);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
            'reviewed_by' => 'nullable|string|max:120',
        ]);

        $updateData = [
            'status' => 'REJECTED',
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('enquiries', 'rejection_reason')) {
            $updateData['rejection_reason'] = !empty($validated['reason']) ? trim($validated['reason']) : null;
            $updateData['reviewed_by'] = !empty($validated['reviewed_by']) ? trim($validated['reviewed_by']) : 'Admin';
            $updateData['reviewed_at'] = now();
        }

        DB::table('enquiries')->where('id', $enquiry->id)->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Inquiry #{$enquiry->inquiry_code} has been rejected.",
            'status' => 'REJECTED',
        ]);
    }
}
