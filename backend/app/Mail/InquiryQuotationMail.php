<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InquiryQuotationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $customerName;
    public string $productName;
    public string $priceDisplay;
    public string $validUntilLong;
    public string $senderName;
    public string $companyName;
    public string $inquiryCode;

    public function __construct(
        string $customerName,
        string $productName,
        string $priceDisplay,
        string $validUntilLong,
        string $senderName,
        string $companyName,
        string $inquiryCode = ''
    ) {
        $this->customerName = $customerName;
        $this->productName = $productName;
        $this->priceDisplay = $priceDisplay;
        $this->validUntilLong = $validUntilLong;
        $this->senderName = $senderName;
        $this->companyName = $companyName;
        $this->inquiryCode = $inquiryCode;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Quotation for {$this->productName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inquiry_quotation',
            text: 'emails.inquiry_quotation_plain',
        );
    }
}

