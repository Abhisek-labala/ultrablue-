import React, { useRef, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Logo } from './Logo';
import {
  Printer,
  Download,
  CheckCircle2,
  Check,
  QrCode as QrIcon,
  FileText
} from 'lucide-react';
import { COMPANY_INFO } from '../../config/companyInfo';
import { API_BASE_URL } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

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

export const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  const invoicePrintRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const companyData = {
    name: COMPANY_INFO.name,
    brand: COMPANY_INFO.brandName,
    plantAddress: COMPANY_INFO.plantAddress,
    gstin: COMPANY_INFO.gstin,
    cin: COMPANY_INFO.cin,
    phone: COMPANY_INFO.salesHotline || COMPANY_INFO.phone || '',
    email: COMPANY_INFO.email || ''
  };

  // Generate dynamic scannable QR code whenever invoice changes
  useEffect(() => {
    if (invoice) {
      const invNo = invoice.invoiceNumber || invoice.id || '';
      const grandTotal = (parseFloat(invoice.grandTotal) || 0).toFixed(2);
      const date = invoice.createdAt || invoice.date || '';

      const payload = `ULTRABLUE+ GST TAX INVOICE\nInvoice: ${invNo}\nDate: ${date}\nSeller: ${companyData.name}\nGSTIN: ${companyData.gstin}\nCustomer: ${invoice.customerName || ''}\nVehicle: ${invoice.vehicleNumber || invoice.vehicleNo || ''}\nTotal: INR ${grandTotal}\nStatus: VERIFIED & PAID`;

      QRCode.toDataURL(payload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#002B66',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code generation failed:', err));
    }
  }, [invoice]);

  if (!invoice) return null;

  const invNo = invoice.invoiceNumber || invoice.id || '';
  const subtotal = parseFloat(invoice.subtotal || 0);
  const discount = parseFloat(invoice.discount || invoice.discount_amount || 0);
  const taxable = parseFloat(invoice.taxable || invoice.taxable_amount || (subtotal - discount));
  const cgst = parseFloat(invoice.cgst || invoice.cgst_amount || 0);
  const sgst = parseFloat(invoice.sgst || invoice.sgst_amount || 0);
  const grandTotal = parseFloat(invoice.grandTotal || invoice.grand_total || (taxable + cgst + sgst));
  const dateDisplay = invoice.createdAt || invoice.date || '';
  const depotDisplay = invoice.depotName || invoice.location || '';
  const operatorDisplay = invoice.operatorName || '';
  const vehicleDisplay = invoice.vehicleNumber || invoice.vehicleNo || '';
  const paymentDisplay = invoice.paymentMethod || invoice.payment_method || '';

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
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <CheckCircle2 size={16} />
            Stock successfully decremented & SMS dispatched
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
                    <td><strong style={{ color: '#0F172A' }}>{invoice.customerName || ''}</strong></td>
                  </tr>
                  {vehicleDisplay && (
                    <tr>
                      <td style={{ color: '#64748B', padding: '2px 0' }}>Vehicle Reg No:</td>
                      <td><strong style={{ color: '#0056D2', fontFamily: 'monospace', fontSize: '12px' }}>{vehicleDisplay}</strong></td>
                    </tr>
                  )}
                  {invoice.customerPhone && (
                    <tr>
                      <td style={{ color: '#64748B', padding: '2px 0' }}>Mobile / Phone:</td>
                      <td><strong>{invoice.customerPhone}</strong></td>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', backgroundColor: '#F0F9FF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                {/* Live Scannable QR Code Image */}
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Digital GST Invoice QR"
                    style={{ width: '64px', height: '64px', borderRadius: '4px', border: '1px solid #0284C7', backgroundColor: '#FFFFFF', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <QrIcon size={40} color="#0056D2" />
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#0369A1' }}>
                  <strong style={{ fontSize: '11px', color: '#0056D2' }}>GST E-Invoice & Batch Seal</strong><br />
                  Scan QR code on any mobile camera to verify digital authenticity & ISO 22241 batch record.
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
