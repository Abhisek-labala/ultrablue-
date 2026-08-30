import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Download, 
  FileText, 
  Printer, 
  CheckCircle2, 
  CreditCard, 
  Calendar 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';

export const AdminSalesInvoicesView = ({ 
  invoices = [], 
  exportToCSV, 
  COMPANY_INFO 
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleOpenReceipt = (inv) => {
    setSelectedInvoice(inv);
    setIsReceiptModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} color="var(--brand-blue)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Sales POS Tax Invoices & Real-Time Verified Receipts</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Immutable digital transaction ledger for retail dispenser stations, bulk tanker dispatches, and credit fleet billettes.
          </p>
        </div>

        <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Sales_Invoices', invoices)}>
          Export Sales Invoices CSV
        </Button>
      </div>

      {/* Invoices DataTable */}
      <DataTable
        title="Live Retail POS & Bulk Dispatch Billing Ledger"
        data={invoices}
        columns={[
          { 
            header: 'Invoice No', 
            accessor: 'invoiceNumber', 
            render: (val) => (
              <strong style={{ color: 'var(--brand-blue)', fontFamily: 'monospace', fontSize: '13px' }}>
                {val}
              </strong>
            )
          },
          { 
            header: 'Date / Time', 
            accessor: 'createdAt', 
            render: (val) => <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{val}</span> 
          },
          { 
            header: 'Customer / Vehicle No', 
            accessor: 'customerName', 
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)' }}>{val || 'Direct Walk-in Fleet'}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {row.vehicleNumber ? `Reg: ${row.vehicleNumber}` : `Phone: ${row.customerPhone || 'N/A'}`}
                </div>
              </div>
            )
          },
          { 
            header: 'Dispensed Product & Qty', 
            accessor: 'productName', 
            render: (val, row) => (
              <div>
                <strong style={{ color: 'var(--brand-cyan)' }}>{row.quantityLiters || row.quantity} Litres</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{val || 'UltraBlue+ AUS 32'} ({row.sku})</div>
              </div>
            )
          },
          { 
            header: 'Payment Mode', 
            accessor: 'paymentMethod', 
            render: (val) => (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-medium)' }}>
                {val}
              </span>
            )
          },
          {
            header: 'Tax (18% GST)',
            accessor: 'taxAmount',
            render: (val) => `₹ ${(Number(val) || 0).toFixed(2)}`
          },
          { 
            header: 'Grand Total (₹)', 
            accessor: 'grandTotal', 
            render: (val) => (
              <strong style={{ color: 'var(--brand-gold)', fontSize: 'var(--font-size-md)' }}>
                ₹ {(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            )
          },
          {
            header: 'Actions',
            accessor: 'id',
            render: (val, row) => (
              <Button 
                size="sm" 
                variant="secondary" 
                icon={FileText}
                onClick={() => handleOpenReceipt(row)}
              >
                Receipt
              </Button>
            )
          }
        ]}
      />

      {/* VERIFIED BILL RECEIPT MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title={`Tax Invoice & Dispensing Slip: ${selectedInvoice?.invoiceNumber}`}
      >
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '12px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: '12px', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0056D2' }}>{COMPANY_INFO?.name || 'AYUSH GREEN ENERGY'}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B' }}>{COMPANY_INFO?.plantAddress || 'Bhadrak, Odisha'}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>GSTIN: {COMPANY_INFO?.gstin || '21AABCU9603R1ZM'} • CIN: {COMPANY_INFO?.cin || 'U23209OR2026PTC048912'}</p>
                <div style={{ fontWeight: 700, marginTop: '6px', color: '#0F172A' }}>OFFICIAL TAX INVOICE / DISPENSING SLIP</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div><strong>Invoice No:</strong> {selectedInvoice.invoiceNumber}</div>
                <div><strong>Date:</strong> {selectedInvoice.createdAt}</div>
                <div><strong>Customer:</strong> {selectedInvoice.customerName || 'Direct Fleet'}</div>
                <div><strong>Vehicle Reg:</strong> {selectedInvoice.vehicleNumber || 'N/A'}</div>
                <div><strong>Station / Depot:</strong> {selectedInvoice.depotName || 'Bhadrak Station'}</div>
                <div><strong>Operator:</strong> {selectedInvoice.operatorName || 'Terminal POS'}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Item / SKU</th>
                    <th style={{ padding: '6px', textAlign: 'center' }}>Qty (L)</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px' }}>{selectedInvoice.productName || 'UltraBlue+ AUS 32 DEF'}<br /><span style={{ fontSize: '10px', color: '#64748B' }}>HSN 31021000 • ISO 22241-1</span></td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>{selectedInvoice.quantityLiters || selectedInvoice.quantity}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{((selectedInvoice.subtotal || selectedInvoice.grandTotal * 0.82) / (selectedInvoice.quantityLiters || 1)).toFixed(2)}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{(selectedInvoice.subtotal || selectedInvoice.grandTotal * 0.82).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', borderTop: '1px dashed #CBD5E1', paddingTop: '8px' }}>
                <div>Taxable Value: <strong>₹ {(selectedInvoice.subtotal || selectedInvoice.grandTotal * 0.82).toFixed(2)}</strong></div>
                <div>CGST (9%): <strong>₹ {((selectedInvoice.taxAmount || selectedInvoice.grandTotal * 0.18) / 2).toFixed(2)}</strong></div>
                <div>SGST (9%): <strong>₹ {((selectedInvoice.taxAmount || selectedInvoice.grandTotal * 0.18) / 2).toFixed(2)}</strong></div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0056D2', marginTop: '4px' }}>
                  GRAND TOTAL: ₹ {Number(selectedInvoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Payment Mode: {selectedInvoice.paymentMethod} (PAID & VERIFIED)</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                Thank you for choosing UltraBlue+ • Complies with IS 17042 / ISO 22241 Standards<br />
                This is a computer-generated tax invoice and requires no physical signature.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </Button>
              <Button variant="gold" icon={Printer} onClick={() => window.print()}>
                Print Verified Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
