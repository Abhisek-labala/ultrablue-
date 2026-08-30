import React, { useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Logo } from './Logo';
import { Printer, Download, CheckCircle, Share2, FileText } from 'lucide-react';
import { COMPANY_INFO } from '../../config/companyInfo';

export const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  const invoiceRef = useRef(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice #${invoice.id}`}
      subtitle="Generated via UltraBlue+ POS Billing Engine"
      maxWidth="780px"
      icon={FileText}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} />
            Stock successfully decremented & SMS dispatched
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
              Print Invoice
            </Button>
            <Button variant="primary" size="sm" icon={Download} onClick={() => alert(`Downloading PDF Invoice #${invoice.id}...`)}>
              Download PDF
            </Button>
          </div>
        </div>
      }
    >
      {/* Printable Invoice Container */}
      <div 
        ref={invoiceRef}
        style={{
          padding: 'var(--space-6)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: "'Inter', sans-serif",
          color: '#172033'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--brand-navy-primary)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <Logo size="small" variant="light" />
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#5F6B7A', lineHeight: 1.4 }}>
              <strong>Manufactured by: {COMPANY_INFO.manufacturer}</strong><br />
              {COMPANY_INFO.plantAddress}<br />
              GSTIN: <strong>{COMPANY_INFO.gstin}</strong> | State: 21-Odisha<br />
              Helpline: {COMPANY_INFO.salesHotline} | Email: {COMPANY_INFO.email}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-navy-primary)', display: 'block', letterSpacing: '0.05em' }}>
              TAX INVOICE
            </span>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              <strong>Invoice No:</strong> {invoice.id}<br />
              <strong>Date & Time:</strong> {invoice.date}<br />
              <strong>Place of Supply:</strong> {invoice.location}
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            backgroundColor: '#F8FAFC',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            marginBottom: '20px',
            fontSize: '12px'
          }}
        >
          <div>
            <span style={{ color: '#64748B', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '10px' }}>Billed To Customer</span>
            <strong style={{ fontSize: '14px', color: '#0F172A' }}>{invoice.customerName}</strong><br />
            <span>Mobile: {invoice.customerPhone}</span><br />
            <span>Vehicle / Fleet No: <strong>{invoice.vehicleNo || 'Direct Counter Sale'}</strong></span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748B', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '10px' }}>Billing Operator</span>
            <strong style={{ fontSize: '13px', color: '#0F172A' }}>{invoice.operatorName}</strong><br />
            <span>Payment Mode: <strong>{invoice.paymentMethod}</strong></span><br />
            <span style={{ color: '#16A34A', fontWeight: 700 }}>Status: PAID (Verified)</span>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#06142F', color: '#FFFFFF' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Batch No</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px 10px' }}>{index + 1}</td>
                <td style={{ padding: '10px 10px' }}>
                  <strong>{item.name}</strong><br />
                  <span style={{ fontSize: '10px', color: '#64748B' }}>HSN: 3102 10 00 • ISO 22241-1 Grade</span>
                </td>
                <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontWeight: 600 }}>{item.batchNo || '-'}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700 }}>{item.qty}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right' }}>₹ {item.unitPrice.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700 }}>₹ {item.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation & Tax Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ flex: 1, fontSize: '11px', color: '#64748B', lineHeight: 1.4, border: '1px dashed #CBD5E1', padding: '10px 12px', borderRadius: '4px' }}>
            <strong>Declaration & Terms:</strong><br />
            1. Goods once sold will not be taken back.<br />
            2. UltraBlue+ DEF is guaranteed 100% conforming to ISO 22241 specifications.<br />
            3. Store in shade below 30°C to preserve shelf life.<br />
            <em>This is a computer-generated invoice authenticated by UltraBlue+ Cloud.</em>
          </div>

          <div style={{ width: '260px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Subtotal:</span>
              <span>₹ {invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16A34A' }}>
                <span>Counter Discount:</span>
                <span>- ₹ {invoice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>CGST (9%):</span>
              <span>₹ {invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>SGST (9%):</span>
              <span>₹ {invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0', 
                borderTop: '2px solid #06142F',
                borderBottom: '2px solid #06142F',
                marginTop: '6px',
                fontWeight: 800,
                fontSize: '15px',
                color: '#06142F'
              }}
            >
              <span>Grand Total:</span>
              <span>₹ {invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
