import React, { useState } from 'react';
import {
  ShoppingCart,
  Download,
  FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { InvoiceModal } from '../../components/ui/InvoiceModal';

export const AdminSalesInvoicesView = ({
  invoices = [],
  exportToCSV,
  COMPANY_INFO = {}
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
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Central database ledger of all counter sales, depot dispatches, and QR/UPI settlements.
          </p>
        </div>
        <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Sales_Invoices', invoices)}>
          Export Sales Invoices CSV
        </Button>
      </div>

      {/* Invoices DataTable */}
      <DataTable
        data={invoices}
        columns={[
          {
            header: 'Invoice No',
            accessor: 'invoiceNumber',
            render: (val, row) => (
              <div>
                <strong style={{ color: 'var(--brand-blue)', fontFamily: 'monospace', fontSize: '13px' }}>
                  {val || row.id}
                </strong>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  {row.createdAt || row.date}
                </div>
              </div>
            )
          },
          {
            header: 'Customer / Fleet',
            accessor: 'customerName',
            render: (val, row) => (
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>{val || '-'}</strong>
                {row.customerPhone && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {row.customerPhone}
                  </div>
                )}
              </div>
            )
          },
          {
            header: 'Vehicle Reg',
            accessor: 'vehicleNo',
            render: (val, row) => (
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-navy-primary)' }}>
                {val || row.vehicleNumber || '-'}
              </span>
            )
          },
          {
            header: 'Depot / Hub',
            accessor: 'location',
            render: (val, row) => (
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>{val || row.depotName || '-'}</div>
                {row.operatorName && (
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Op: {row.operatorName}</div>
                )}
              </div>
            )
          },
          {
            header: 'Taxable Amount',
            accessor: 'taxable',
            align: 'right',
            render: (val, row) => (
              <span>₹ {(Number(val || row.subtotal || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            )
          },
          {
            header: 'GST (18%)',
            accessor: 'taxAmount',
            align: 'right',
            render: (val, row) => (
              <span>₹ {(Number(val || ((row.cgst || 0) + (row.sgst || 0)))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            )
          },
          {
            header: 'Grand Total',
            accessor: 'grandTotal',
            align: 'right',
            render: (val) => (
              <strong style={{ color: 'var(--brand-blue)', fontSize: '13.5px' }}>
                ₹ {(Number(val || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            )
          },
          {
            header: 'Payment Mode',
            accessor: 'paymentMethod',
            render: (val) => (
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {val || '-'}
              </span>
            )
          },
          {
            header: 'Actions',
            accessor: 'id',
            align: 'center',
            render: (_, row) => (
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                <Button
                  size="xs"
                  variant="secondary"
                  icon={FileText}
                  onClick={() => handleOpenReceipt(row)}
                  title="View Tax Invoice"
                >
                  View Invoice
                </Button>
              </div>
            )
          }
        ]}
      />

      {/* VERIFIED TAX INVOICE MODAL (Unified Across POS & Admin) */}
      <InvoiceModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
