<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation for {{ $productName }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 6px 24px rgba(6,20,47,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#06142f 0%,#0b2b5e 100%);padding:24px 32px;border-bottom:3px solid #00c8f5;">
              <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">
                UltraBlue<span style="color:#f5b400;">+</span>
              </div>
              <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">
                {{ $companyName }}@if($inquiryCode) &bull; Reference: {{ $inquiryCode }}@endif
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#0f172a;">
                Dear {{ $customerName }},
              </p>

              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#334155;">
                Thank you for your inquiry regarding <strong>{{ $productName }}</strong>. We are pleased to offer it at <strong>&#8377;{{ $priceDisplay }}</strong>. This quotation is valid through <strong>{{ $validUntilLong }}</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 22px 0;">
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Product</td>
                  <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#0f172a;text-align:right;">{{ $productName }}</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Offered Price</td>
                  <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;font-size:16px;font-weight:800;color:#008fe0;text-align:right;">&#8377;{{ $priceDisplay }}</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#64748b;">Valid Through</td>
                  <td style="padding:14px 18px;font-size:14px;font-weight:700;color:#0f172a;text-align:right;">{{ $validUntilLong }}</td>
                </tr>
              </table>

              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:#334155;">
                Please let us know if you would like to proceed or require any additional information. We look forward to assisting you.
              </p>

              <p style="margin:0;font-size:15px;line-height:1.6;color:#0f172a;">
                Kind regards,<br>
                <strong>{{ $senderName }}</strong><br>
                <span style="color:#475569;">{{ $companyName }}</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              IS 17042:2018 &bull; ISO 22241-1 &bull; BIS Licensed Manufacturing
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

