import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Linking } from 'react-native';
import { COMPANY_INFO, numberToWords } from '../config/companyInfo';

export interface InvoiceReceiptItem {
  name: string;
  sku?: string;
  hsn?: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceReceiptData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  vehicleNumber?: string;
  operatorName?: string;
  depotLocation?: string;
  paymentMethod: string;
  paymentStatus?: string;
  discount?: number;
  items: InvoiceReceiptItem[];
  subtotal: number;
  taxable: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

export const generateReceiptHtml = (data: InvoiceReceiptData): string => {
  const itemsRows = data.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding: 8px 10px; color: #64748B; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px 10px;">
          <strong style="color: #0F172A; font-size: 12px;">${item.name}</strong>
          ${item.sku ? `<div style="font-size: 10px; color: #0284C7; font-weight: 600;">SKU: ${item.sku}</div>` : ''}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-size: 11px; font-weight: 600;">${item.hsn || '31021000'}</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: 800; color: #0369A1; font-size: 12px;">${item.qty}</td>
        <td style="padding: 8px 10px; text-align: right; font-size: 11px;">₹ ${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="padding: 8px 10px; text-align: right; font-weight: 800; font-size: 12px;">₹ ${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `
    )
    .join('');

  const amountInWords = numberToWords(data.grandTotal);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            background-color: #FFFFFF;
            color: #0F172A;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 16px;
            font-size: 11px;
            line-height: 1.45;
          }
          .printable-invoice-container {
            border: 1.5px solid #0056D2;
            border-radius: 8px;
            padding: 20px 24px;
            background-color: #FFFFFF;
            max-width: 800px;
            margin: 0 auto;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0056D2;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 900;
            color: #0056D2;
            letter-spacing: -0.01em;
          }
          .plant-address {
            font-size: 10.5px;
            color: #475569;
            max-width: 340px;
            margin-top: 3px;
          }
          .statutory-box {
            text-align: right;
            font-size: 10.5px;
            color: #334155;
            background-color: #F8FAFC;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
          }
          .stamp-band {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #0056D2;
            color: #FFFFFF;
            padding: 7px 12px;
            border-radius: 4px;
            margin-bottom: 14px;
          }
          .stamp-band-title {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .stamp-badge {
            background-color: #FFFFFF;
            color: #0056D2;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 800;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
          }
          .info-panel {
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 10px;
            background-color: #F8FAFC;
          }
          .info-panel-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0056D2;
            text-transform: uppercase;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .table-container {
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 14px;
          }
          .table-header {
            background-color: #0056D2;
            color: #FFFFFF;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .table-header th {
            padding: 8px 10px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            border-top: 1px solid #CBD5E1;
            padding-top: 12px;
          }
          .words-box {
            font-size: 11px;
            font-weight: 800;
            color: #0F172A;
            background-color: #F8FAFC;
            padding: 8px 10px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
            margin-top: 4px;
          }
          .total-highlight {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #0056D2;
            color: #FFFFFF;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 6px;
          }
          .footer-row {
            margin-top: 18px;
            border-top: 1.5px solid #0056D2;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 9.5px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <div class="printable-invoice-container">
          <!-- Header -->
          <div class="invoice-header">
            <div>
              <div class="brand-title">${COMPANY_INFO.brandName} • ${COMPANY_INFO.name}</div>
              <div class="plant-address">${COMPANY_INFO.plantAddress}</div>
              <div style="font-size: 10px; color: #0284C7; margin-top: 2px; font-weight: 600;">
                Licensed under ${COMPANY_INFO.isStandard} (${COMPANY_INFO.bisLicense})
              </div>
            </div>
            <div class="statutory-box">
              <div><span style="color: #64748B;">GSTIN:</span> <strong style="font-family: monospace; color: #0056D2; font-size: 11.5px;">${COMPANY_INFO.gstin}</strong></div>
              <div><span style="color: #64748B;">CIN:</span> <span style="font-family: monospace; font-weight: 600;">${COMPANY_INFO.cin}</span></div>
              <div style="color: #64748B; font-size: 9.5px; margin-top: 3px;">Support: ${COMPANY_INFO.supportPhone}</div>
            </div>
          </div>

          <!-- Title Stamp Band -->
          <div class="stamp-band">
            <span class="stamp-band-title">TAX INVOICE & DISPENSING SLIP</span>
            <span class="stamp-badge">ORIGINAL FOR RECIPIENT</span>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-panel">
              <div class="info-panel-title">Invoice & Dispensing Info</div>
              <table>
                <tr>
                  <td style="color: #64748B; width: 100px;">Invoice No:</td>
                  <td><strong style="color: #0056D2; font-family: monospace; font-size: 12px;">${data.invoiceNumber}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B;">Date & Time:</td>
                  <td><strong>${data.date}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B;">Depot / Hub:</td>
                  <td><strong>${data.depotLocation || 'Central Plant Depot'}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B;">POS Terminal:</td>
                  <td><strong>${data.operatorName || 'Forecourt Duty Operator'}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B;">Place of Supply:</td>
                  <td><strong>21-ODISHA (State Code: 21)</strong></td>
                </tr>
              </table>
            </div>

            <div class="info-panel">
              <div class="info-panel-title">Billed To / Recipient Details</div>
              <table>
                <tr>
                  <td style="color: #64748B; width: 100px;">Customer Name:</td>
                  <td><strong style="color: #0F172A;">${data.customerName}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B;">Mobile / Phone:</td>
                  <td><strong>${data.customerPhone}</strong></td>
                </tr>
                ${data.vehicleNumber ? `
                <tr>
                  <td style="color: #64748B;">Vehicle Reg No:</td>
                  <td><strong style="color: #0056D2; font-family: monospace; font-size: 12px;">${data.vehicleNumber.toUpperCase()}</strong></td>
                </tr>` : ''}
                <tr>
                  <td style="color: #64748B;">Payment Mode:</td>
                  <td><strong style="color: #059669;">${data.paymentMethod}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B;">Payment Status:</td>
                  <td><span style="background-color: #DCFCE7; color: #166534; padding: 1px 6px; border-radius: 4px; font-weight: 800; font-size: 9.5px;">${data.paymentStatus || 'PAID (100% SETTLED)'}</span></td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Items Table -->
          <div class="table-container">
            <table>
              <thead>
                <tr class="table-header">
                  <th style="text-align: left; width: 30px;">#</th>
                  <th style="text-align: left;">Description of Goods / Packaging</th>
                  <th style="text-align: center; width: 80px;">HSN Code</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 90px;">Rate/Unit (₹)</th>
                  <th style="text-align: right; width: 100px;">Total Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- Summary & Totals -->
          <div class="summary-grid">
            <div>
              <div style="color: #64748B; font-size: 10px;">Invoice Amount (in words):</div>
              <div class="words-box">${amountInWords}</div>
              <div style="margin-top: 10px; font-size: 9.5px; color: #0284C7; background-color: #F0F9FF; padding: 6px 10px; border-radius: 4px; border: 1px solid #BAE6FD;">
                <strong>GST E-Invoice & Batch Verified</strong><br />
                ISO 22241 Certified Genuine Automotive Grade Urea Solution.
              </div>
            </div>

            <div>
              <table style="width: 100%; font-size: 11px;">
                <tr>
                  <td style="color: #64748B; padding: 2px 0;">Gross Subtotal:</td>
                  <td style="text-align: right;"><strong>₹ ${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
                ${data.discount && data.discount > 0 ? `
                <tr style="color: #16A34A; font-weight: bold;">
                  <td style="padding: 2px 0;">Counter Discount:</td>
                  <td style="text-align: right;">- ₹ ${data.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>` : ''}
                <tr style="border-top: 1px dashed #CBD5E1;">
                  <td style="color: #64748B; padding: 3px 0;">Total Taxable Value:</td>
                  <td style="text-align: right;"><strong>₹ ${data.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 2px 0;">Central GST (CGST @ 9%):</td>
                  <td style="text-align: right;"><strong>₹ ${data.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 2px 0;">State GST (SGST @ 9%):</td>
                  <td style="text-align: right;"><strong>₹ ${data.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
              </table>

              <div class="total-highlight">
                <span style="font-weight: 900; text-transform: uppercase;">Grand Total (INR):</span>
                <span style="font-size: 16px; font-weight: 900;">₹ ${data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-row">
            <div style="max-width: 440px;">
              <strong>Statutory Declaration:</strong> We declare that this invoice shows actual price of the goods described and all particulars are true and correct.<br />
              <span style="color: #0056D2; font-weight: 600;">Computer-generated tax invoice verified by ${COMPANY_INFO.name} billing engine.</span>
            </div>
            <div style="text-align: right;">
              <div style="color: #0056D2; font-weight: 800; font-size: 11px;">${data.operatorName || COMPANY_INFO.name}</div>
              <div style="font-size: 9px; color: #64748B;">Billing Executive • ${COMPANY_INFO.name}</div>
              <div style="margin-top: 12px; border-top: 1px solid #94A3B8; padding-top: 2px; font-size: 8.5px; color: #475569;">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Generates the exact WhatsApp Invoice text matching web
export const generateWhatsAppText = (data: InvoiceReceiptData): string => {
  const itemsText = data.items
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.name}*${it.sku ? ` (${it.sku})` : ''}\n   Qty: ${it.qty} | Rate: ₹${it.unitPrice.toFixed(2)} | Total: ₹${it.total.toFixed(2)}`
    )
    .join('\n');

  return [
    `🧾 *GST TAX INVOICE & DISPENSING SLIP*`,
    `*${COMPANY_INFO.brandName}* — ${COMPANY_INFO.name}`,
    `GSTIN: ${COMPANY_INFO.gstin}`,
    `Plant: ${COMPANY_INFO.plantAddress}`,
    `----------------------------------------`,
    `*Invoice No:* #${data.invoiceNumber}`,
    `*Date & Time:* ${data.date}`,
    `*Customer Name:* ${data.customerName || 'Valued Customer'}`,
    `*Mobile:* ${data.customerPhone}`,
    data.vehicleNumber ? `*Vehicle Reg No:* ${data.vehicleNumber.toUpperCase()}` : '',
    data.depotLocation ? `*Depot / Hub:* ${data.depotLocation}` : '',
    data.operatorName ? `*POS Terminal:* ${data.operatorName}` : '',
    `*Payment Mode:* ${data.paymentMethod} (${data.paymentStatus || 'PAID'})`,
    `----------------------------------------`,
    `*DESCRIPTION OF GOODS / PACKAGING:*`,
    itemsText,
    `----------------------------------------`,
    `*BILLING & TAX BREAKDOWN:*`,
    `• Gross Subtotal: ₹${data.subtotal.toFixed(2)}`,
    data.discount && data.discount > 0 ? `• Counter Discount: -₹${data.discount.toFixed(2)}` : '',
    `• Total Taxable Value: ₹${data.taxable.toFixed(2)}`,
    `• Central GST (CGST @ 9%): ₹${data.cgst.toFixed(2)}`,
    `• State GST (SGST @ 9%): ₹${data.sgst.toFixed(2)}`,
    `*👉 GRAND TOTAL (INR): ₹${data.grandTotal.toFixed(2)}*`,
    `----------------------------------------`,
    `✅ *ISO 22241 & IS 17042 Certified Genuine DEF*`,
    `Statutory: Computer-generated invoice verified by ${COMPANY_INFO.name} billing engine.`,
    `📞 Helpline: ${COMPANY_INFO.supportPhone}`,
  ]
    .filter(Boolean)
    .join('\n');
};

export const printOrShareReceipt = async (data: InvoiceReceiptData): Promise<void> => {
  try {
    const html = generateReceiptHtml(data);
    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Tax Invoice #${data.invoiceNumber} - ${COMPANY_INFO.brandName}`,
      });
    } else {
      await Print.printAsync({ html });
    }
  } catch (error: any) {
    Alert.alert('Printing Error', error?.message || 'Failed to print or share PDF');
  }
};

export const shareViaWhatsAppDirect = async (data: InvoiceReceiptData): Promise<void> => {
  const text = generateWhatsAppText(data);
  const cleanPhone = (data.customerPhone || '').replace(/\D/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const url = targetPhone.length >= 10
    ? `whatsapp://send?phone=${targetPhone}&text=${encodeURIComponent(text)}`
    : `whatsapp://send?text=${encodeURIComponent(text)}`;

  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // Fallback to web link
    const webUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    await Linking.openURL(webUrl).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Could not open WhatsApp on this device.');
    });
  }
};
