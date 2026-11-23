import React, { useRef, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Logo } from './Logo';
import {
  Printer,
  Download,
  CheckCircle2,
  Check,
  FileText
} from 'lucide-react';
import { COMPANY_INFO } from '../../config/companyInfo';
import { API_BASE_URL } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to convert numbers to Indian Rupee Words
const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(Number(num) || 0)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str ? str.trim() + ' Rupees Only' : 'Zero Rupees Only';
};

// Official WhatsApp SVG icon component
export const WhatsAppIcon = ({ size = 16, color = 'currentColor', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ flexShrink: 0 }}
    {...props}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Helper to normalize phone numbers for WhatsApp wa.me links
export const normalizePhoneForWhatsApp = (rawPhone) => {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 10) {
    return '91' + digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return '91' + digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
};

// Helper to generate formatted WhatsApp invoice message
export const generateWhatsAppInvoiceMessage = ({
  invoice,
  companyData,
  invNo,
  subtotal,
  discount,
  taxable,
  cgst,
  sgst,
  grandTotal,
  dateDisplay,
  depotDisplay,
  operatorDisplay,
  vehicleDisplay,
  paymentDisplay,
  customerNameDisplay,
  customerPhoneDisplay
}) => {
  const items = invoice?.items || [];
  let itemsFormatted = '';

  if (Array.isArray(items) && items.length > 0) {
    itemsFormatted = items
      .map((item, idx) => {
        const name = item.name || item.product_name || invoice.productName || 'UltraBlue+ DEF';
        const qty = item.qty || item.quantity || 1;
        const unitPrice = parseFloat(item.unitPrice || item.unit_price || 0);
        const amount = parseFloat(item.amount ?? item.total ?? item.line_total ?? (unitPrice * qty));
        const skuInfo = item.sku ? ` (${item.sku})` : '';
        return `${idx + 1}. *${name}*${skuInfo}\n   Qty: ${qty}  |  Rate: ₹${unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  |  Total: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      })
      .join('\n');
  } else if (invoice?.productName) {
    itemsFormatted = `1. *${invoice.productName}*\n   Total: ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    itemsFormatted = `1. *UltraBlue+ Diesel Exhaust Fluid*\n   Total: ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const lines = [
    `🧾 *GST TAX INVOICE & DISPENSING SLIP*`,
    `*${companyData?.brand || 'ULTRABLUE+'}* — ${companyData?.name || 'AYUSH GREEN ENERGY'}`,
    `GSTIN: ${companyData?.gstin || ''}`,
    `Plant: ${companyData?.plantAddress || ''}`,
    `----------------------------------------`,
    `*Invoice No:* #${invNo}`,
    `*Date & Time:* ${dateDisplay || new Date().toLocaleString('en-IN')}`,
    `*Customer Name:* ${customerNameDisplay || 'Valued Customer'}`
  ];

  if (customerPhoneDisplay) {
    lines.push(`*Mobile / Phone:* ${customerPhoneDisplay}`);
  }
  if (vehicleDisplay) {
    lines.push(`*Vehicle Reg No:* ${vehicleDisplay}`);
  }
  if (depotDisplay) {
    lines.push(`*Depot / Hub:* ${depotDisplay}`);
  }
  if (operatorDisplay) {
    lines.push(`*POS Terminal:* ${operatorDisplay}`);
  }
  if (paymentDisplay) {
    const status = invoice.paymentStatus || invoice.payment_status || 'PAID';
    lines.push(`*Payment Mode:* ${paymentDisplay} (${status})`);
  }

  lines.push(`----------------------------------------`);
  lines.push(`*DESCRIPTION OF GOODS / PACKAGING:*`);
  lines.push(itemsFormatted);
  lines.push(`----------------------------------------`);
  lines.push(`*BILLING & TAX BREAKDOWN:*`);
  lines.push(`• Gross Subtotal: ₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (discount > 0) {
    lines.push(`• Counter Discount: -₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  lines.push(`• Total Taxable Value: ₹${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  lines.push(`• Central GST (CGST @ 9%): ₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  lines.push(`• State GST (SGST @ 9%): ₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  const rawBreakdownTotal = (taxable + cgst + sgst);
  const diffRoundOff = Math.round((grandTotal - rawBreakdownTotal) * 100) / 100;
  if (Math.abs(diffRoundOff) > 0.001) {
    const sign = diffRoundOff >= 0 ? '+' : '-';
    lines.push(`• Round Off: ${sign}₹${Math.abs(diffRoundOff).toFixed(2)}`);
  }
  lines.push(`*👉 GRAND TOTAL (INR): ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
  lines.push(`----------------------------------------`);
  lines.push(`✅ *ISO 22241 & IS 17042 Certified Genuine DEF*`);
  lines.push(`Statutory: Computer-generated invoice verified by ${companyData?.name || 'Ayush Green Energy'} billing engine.`);
  if (companyData?.phone) {
    lines.push(`📞 Customer Support Helpline: ${companyData.phone}`);
  }

  return lines.join('\n');
};

export const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  const invoicePrintRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsAppNotice, setWhatsAppNotice] = useState('');

  const companyData = {
    name: COMPANY_INFO.name,
    brand: COMPANY_INFO.brandName,
    plantAddress: COMPANY_INFO.plantAddress,
    gstin: COMPANY_INFO.gstin,
    cin: COMPANY_INFO.cin,
    phone: COMPANY_INFO.salesHotline || COMPANY_INFO.phone || '',
    email: COMPANY_INFO.email || ''
  };

  if (!invoice) return null;

  const invNo = invoice.invoiceNumber || invoice.invoice_number || invoice.id || '';
  const subtotal = parseFloat(invoice.subtotal || 0);
  const discount = parseFloat(invoice.discount || invoice.discount_amount || 0);
  const taxable = parseFloat(invoice.taxable || invoice.taxable_amount || (subtotal - discount));
  const cgst = parseFloat(invoice.cgst || invoice.cgst_amount || 0);
  const sgst = parseFloat(invoice.sgst || invoice.sgst_amount || 0);
  const grandTotal = parseFloat(invoice.grandTotal || invoice.grand_total || (taxable + cgst + sgst));
  const roundOff = invoice.roundOff !== undefined
    ? parseFloat(invoice.roundOff)
    : (invoice.round_off !== undefined ? parseFloat(invoice.round_off) : Math.round((grandTotal - (taxable + cgst + sgst)) * 100) / 100);
  const dateDisplay = invoice.createdAt || invoice.created_at || invoice.date || '';
  const depotDisplay = invoice.depotName || invoice.location_name || invoice.location || '';
  const operatorDisplay = invoice.operatorName || invoice.operator_name || '';
  const vehicleDisplay = invoice.vehicleNumber || invoice.vehicle_number || invoice.vehicleNo || '';
  const paymentDisplay = invoice.paymentMethod || invoice.payment_method || '';
  const customerNameDisplay = invoice.customerName || invoice.customer_name || 'Valued Customer';
  const customerPhoneDisplay = invoice.customerPhone || invoice.customer_phone || invoice.phone || invoice.mobile || '';

  // Share complete formatted invoice summary to customer via WhatsApp
  const handleShareWhatsApp = () => {
    setIsSharingWhatsApp(true);

    const messageText = generateWhatsAppInvoiceMessage({
      invoice,
      companyData,
      invNo,
      subtotal,
      discount,
      taxable,
      cgst,
      sgst,
      grandTotal,
      dateDisplay,
      depotDisplay,
      operatorDisplay,
      vehicleDisplay,
      paymentDisplay,
      customerNameDisplay,
      customerPhoneDisplay
    });

    // Copy formatted invoice text to clipboard for quick paste or backup
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(messageText).catch(() => {});
      }
    } catch {
      // ignore
    }

    let targetPhone = normalizePhoneForWhatsApp(customerPhoneDisplay);

    if (!targetPhone || targetPhone.length < 10) {
      const prompted = window.prompt(
        'Customer mobile number is missing from this invoice.\nEnter 10-digit WhatsApp number (or leave blank to select chat directly in WhatsApp):',
        ''
      );
      if (prompted !== null) {
        targetPhone = normalizePhoneForWhatsApp(prompted);
      }
    }

    const whatsappUrl = targetPhone && targetPhone.length >= 10
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    setWhatsAppNotice('WhatsApp opened & invoice data copied to clipboard!');
    setTimeout(() => {
      setIsSharingWhatsApp(false);
      setWhatsAppNotice('');
    }, 4000);
  };

  // High-Resolution Direct PDF Download (Pixel-Perfect A4 Desktop Layout matching Print Preview)
  const handleDownloadPdf = async () => {
    const original = invoicePrintRef.current;
    if (!original) return;

    setIsGeneratingPdf(true);
    try {
      // Create a dedicated off-screen container with fixed standard A4 desktop width (794px)
      // and explicit non-wrapping layout to match the official print slip
      const printClone = original.cloneNode(true);

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = '794px';
      wrapper.style.backgroundColor = '#FFFFFF';
      wrapper.style.zIndex = '-9999';
      wrapper.style.opacity = '0';
      wrapper.style.pointerEvents = 'none';

      // Force desktop styling on the clone regardless of mobile screen
      printClone.style.width = '794px';
      printClone.style.maxWidth = '794px';
      printClone.style.minWidth = '794px';
      printClone.style.boxSizing = 'border-box';
      printClone.style.padding = '22px 26px';
      printClone.style.margin = '0';
      printClone.style.border = '1.5px solid #0056D2';
      printClone.style.borderRadius = '8px';
      printClone.style.boxShadow = 'none';
      printClone.style.backgroundColor = '#FFFFFF';

      // Ensure internal flex/grid elements maintain their 2-column desktop layouts
      const headerRow = printClone.querySelector('.invoice-header-row');
      if (headerRow) {
        headerRow.style.display = 'flex';
        headerRow.style.flexWrap = 'nowrap';
        headerRow.style.justifyContent = 'space-between';
      }

      const infoGrid = printClone.querySelector('.invoice-info-grid');
      if (infoGrid) {
        infoGrid.style.display = 'grid';
        infoGrid.style.gridTemplateColumns = '1fr 1fr';
        infoGrid.style.gap = '14px';
      }

      const summaryGrid = printClone.querySelector('.invoice-summary-grid');
      if (summaryGrid) {
        summaryGrid.style.display = 'grid';
        summaryGrid.style.gridTemplateColumns = '1fr 1fr';
        summaryGrid.style.gap = '16px';
      }

      const footerRow = printClone.querySelector('.invoice-footer-row');
      if (footerRow) {
        footerRow.style.display = 'flex';
        footerRow.style.flexWrap = 'nowrap';
        footerRow.style.justifyContent = 'space-between';
      }

      wrapper.appendChild(printClone);
      document.body.appendChild(wrapper);

      // Wait a tick for layout and QR code image paint
      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(printClone, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 794,
        windowWidth: 1200
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 is 210mm x 297mm. Set clean 8mm horizontal margins.
      const marginX = 8;
      const marginY = 8;
      const pdfPrintWidth = 210 - (marginX * 2); // 194mm
      const pdfPrintHeight = (canvas.height * pdfPrintWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', marginX, marginY, pdfPrintWidth, Math.min(pdfPrintHeight, 281));
      pdf.save(`Tax_Invoice_${invNo || 'UltraBlue'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      // If error occurs, fallback to native browser print
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!invoicePrintRef.current) {
      window.print();
      return;
    }

    try {
      const printContent = invoicePrintRef.current.outerHTML;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Tax Invoice #${invNo || 'UltraBlue'}</title>
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
                background-color: #FFFFFF !important;
                color: #0F172A !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                padding: 0;
              }
              .printable-invoice-container {
                border: 1.5px solid #0056D2 !important;
                border-radius: 6px !important;
                padding: 20px 24px !important;
                box-shadow: none !important;
                width: 100% !important;
              }
              table {
                border-collapse: collapse;
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    } catch (err) {
      console.error('Print iframe error:', err);
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice #${invNo}`}
      subtitle="GST Tax Invoice & ISO 22241 Verification Slip"
      maxWidth="840px"
      icon={FileText}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: whatsAppNotice ? '#16A34A' : 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <CheckCircle2 size={16} />
            {whatsAppNotice || (invoice?.is_sms_sent || invoice?.smsSent ? 'Stock successfully decremented & SMS dispatched' : 'Stock successfully decremented & verified')}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="primary"
              size="sm"
              icon={WhatsAppIcon}
              onClick={handleShareWhatsApp}
              style={{
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                color: '#FFFFFF',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.28)'
              }}
              title={customerPhoneDisplay ? `Share invoice via WhatsApp to ${customerPhoneDisplay}` : 'Share invoice via WhatsApp'}
            >
              {isSharingWhatsApp ? 'Opening WhatsApp...' : 'Share on WhatsApp'}
            </Button>
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
              Print Invoice
            </Button>
            <Button
              variant="gold"
              size="sm"
              icon={Download}
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
            >
              {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="invoice-scroll-wrapper" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* HIGH-RES PRINTABLE INVOICE DOCUMENT CONTAINER */}
        <div
          ref={invoicePrintRef}
          className="printable-invoice-container"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            padding: '24px 20px',
            borderRadius: '8px',
            border: '1.5px solid #0056D2',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '11.5px',
            lineHeight: '1.45',
            minWidth: '0',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Header with Official Logo & Company Tax Profile */}
          <div className="invoice-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0056D2', paddingBottom: '16px', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            {/* Brand Logo & Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ transform: 'scale(1.05)', transformOrigin: 'left top' }}>
                <Logo size="small" variant="light" subtitle={true} />
              </div>
              <div style={{ marginTop: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0056D2', letterSpacing: '-0.01em' }}>
                  {companyData.name}
                </h2>
                <div style={{ fontSize: '11px', color: '#475569', maxWidth: '340px', marginTop: '2px' }}>
                  {companyData.plantAddress}
                </div>
              </div>
            </div>

            {/* Statutory Registration Details */}
            <div className="invoice-statutory-box" style={{ textAlign: 'right', fontSize: '11px', color: '#334155', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', minWidth: '220px' }}>
              <div><span style={{ color: '#64748B' }}>GSTIN:</span> <strong style={{ fontFamily: 'monospace', color: '#0056D2', fontSize: '12px' }}>{companyData.gstin}</strong></div>
              <div><span style={{ color: '#64748B' }}>CIN:</span> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{companyData.cin}</span></div>
              {companyData.phone && <div style={{ color: '#64748B', marginTop: '4px', fontSize: '10px' }}>Helpline: {companyData.phone}</div>}
              {companyData.email && <div style={{ color: '#64748B', fontSize: '10px' }}>Email: {companyData.email}</div>}
            </div>
          </div>

          {/* Title & Official Stamp Band */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0056D2', color: '#FFFFFF', padding: '8px 14px', borderRadius: '4px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TAX INVOICE & DISPENSING SLIP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#FFFFFF', color: '#0056D2', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
              <Check size={12} strokeWidth={3} />
              <span>ORIGINAL FOR RECIPIENT</span>
            </div>
          </div>

          {/* Invoice & Customer Metadata 2-Column Grid */}
          <div className="invoice-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '14px', marginBottom: '18px' }}>
            {/* Left: Invoice Metadata */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0056D2', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                Invoice & Dispensing Info
              </div>
              <table style={{ width: '100%', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#64748B', padding: '2px 0', width: '110px' }}>Invoice No:</td>
                    <td><strong style={{ color: '#0056D2', fontFamily: 'monospace', fontSize: '12px' }}>{invNo}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748B', padding: '2px 0' }}>Date & Time:</td>
                    <td><strong>{dateDisplay}</strong></td>
                  </tr>
                  {depotDisplay && (
                    <tr>
                      <td style={{ color: '#64748B', padding: '2px 0' }}>Depot / Hub:</td>
                      <td><strong>{depotDisplay}</strong></td>
                    </tr>
                  )}
                  {operatorDisplay && (
                    <tr>
                      <td style={{ color: '#64748B', padding: '2px 0' }}>POS Terminal:</td>
                      <td><strong>{operatorDisplay}</strong></td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: '#64748B', padding: '2px 0' }}>Place of Supply:</td>
                    <td><strong>21-ODISHA (State Code: 21)</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Billed To / Customer Details */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0056D2', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                Billed To / Recipient Details
              </div>
              <table style={{ width: '100%', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#64748B', padding: '2px 0', width: '110px' }}>Customer Name:</td>
                    <td><strong style={{ color: '#0F172A' }}>{customerNameDisplay}</strong></td>
                  </tr>
                  {vehicleDisplay && (
                    <tr>
                      <td style={{ color: '#64748B', padding: '2px 0' }}>Vehicle Reg No:</td>
                      <td><strong style={{ color: '#0056D2', fontFamily: 'monospace', fontSize: '12px' }}>{vehicleDisplay}</strong></td>
                    </tr>
                  )}
                  {customerPhoneDisplay && (
                    <tr>
                      <td style={{ color: '#64748B', padding: '2px 0' }}>Mobile / Phone:</td>
                      <td><strong>{customerPhoneDisplay}</strong></td>
                    </tr>
                  )}
                  {paymentDisplay && (
                    <tr>
                      <td style={{ color: '#64748B', padding: '2px 0' }}>Payment Mode:</td>
                      <td><strong style={{ color: '#059669' }}>{paymentDisplay}</strong></td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: '#64748B', padding: '2px 0' }}>Payment Status:</td>
                    <td><span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, fontSize: '10px' }}>{invoice.paymentStatus || 'PAID (100% SETTLED)'}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Table with Horizontal Touch Scroll */}
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '16px', border: '1px solid #CBD5E1', borderRadius: '4px' }}>
            <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0056D2', color: '#FFFFFF', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: '30px' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Description of Goods / Packaging</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '75px' }}>HSN Code</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '75px' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '90px' }}>Rate/Unit (₹)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>Total Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, idx) => {
                  const itemPrice = parseFloat(item.unitPrice || 0);
                  const itemQty = parseInt(item.qty || item.quantity || 1, 10);
                  const itemTotal = parseFloat(item.amount ?? item.total ?? (itemPrice * itemQty));

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <td style={{ padding: '10px', color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '10px' }}>
                        <strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{item.name || invoice.productName || ''}</strong>
                        {item.sku && (
                          <div style={{ fontSize: '10.5px', color: '#0284C7', fontWeight: 600 }}>
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>31021000</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, color: '#0369A1' }}>{itemQty}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>₹ {itemPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800 }}>₹ {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary, Scannable QR, and GST Tax Breakdown */}
          <div className="invoice-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', alignItems: 'flex-start', borderTop: '1px solid #CBD5E1', paddingTop: '14px' }}>
            {/* Left: Amount in Words & Dynamic Scannable QR Code */}
            <div>
              <div style={{ fontSize: '10.5px', color: '#64748B', marginBottom: '4px' }}>Invoice Amount (in words):</div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {numberToWords(grandTotal)}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '12px',
                backgroundColor: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <img
                  src="/images/ayush_green_energy_logo.jpg"
                  alt="Ayush Green Energy"
                  style={{
                    height: '52px',
                    width: 'auto',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}
                />
                <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>
                  <strong style={{ fontSize: '11.5px', color: '#15803D', display: 'block', marginBottom: '2px' }}>
                    Ayush Green Energy
                  </strong>
                  <span>Manufacturer of Genuine DEF • ISO 22241 &amp; BIS Certified AUS 32 Fleet Solution</span>
                </div>
              </div>
            </div>

            {/* Right: Detailed Tax Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11.5px' }}>
                <span style={{ color: '#64748B' }}>Gross Subtotal:</span>
                <strong>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#16A34A', fontSize: '11.5px', fontWeight: 700 }}>
                  <span>Counter Discount:</span>
                  <span>- ₹ {discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderTop: '1px dashed #E2E8F0', fontSize: '11.5px' }}>
                <span style={{ color: '#64748B' }}>Total Taxable Value:</span>
                <strong>₹ {taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11.5px' }}>
                <span style={{ color: '#64748B' }}>Central GST (CGST @ 9%):</span>
                <strong>₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11.5px' }}>
                <span style={{ color: '#64748B' }}>State GST (SGST @ 9%):</span>
                <strong>₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              {Math.abs(roundOff) > 0.001 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11.5px' }}>
                  <span style={{ color: '#64748B' }}>Round Off:</span>
                  <strong style={{ color: roundOff >= 0 ? '#16A34A' : '#D97706' }}>
                    {roundOff >= 0 ? `+ ₹ ${roundOff.toFixed(2)}` : `- ₹ ${Math.abs(roundOff).toFixed(2)}`}
                  </strong>
                </div>
              )}

              {/* Grand Total Highlight Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#0056D2', color: '#FFFFFF', borderRadius: '6px', marginTop: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Grand Total (INR):
                </span>
                <span style={{ fontSize: '17px', fontWeight: 900 }}>
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Compliance Certification Seal & System Signature Stamp */}
          <div className="invoice-footer-row" style={{ marginTop: '20px', borderTop: '1.5px solid #0056D2', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '9.5px', color: '#64748B', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ maxWidth: '420px' }}>
              <strong>Statutory Declaration:</strong> We declare that this invoice shows actual price of the goods described and all particulars are true and correct.<br />
              <span style={{ color: '#0056D2', fontWeight: 600 }}>This is a computer-generated tax invoice verified by {companyData.name} billing engine.</span>
            </div>
            <div style={{ textAlign: 'right', minWidth: '160px' }}>
              <div style={{ color: '#0056D2', fontWeight: 800, fontSize: '12px' }}>
                {operatorDisplay || companyData.name}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '1px' }}>
                {operatorDisplay ? `Billing Executive • ${companyData.name}` : companyData.name}
              </div>
              <div style={{ marginTop: '16px', borderTop: '1px solid #94A3B8', paddingTop: '3px', fontSize: '9px', color: '#475569' }}>
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
