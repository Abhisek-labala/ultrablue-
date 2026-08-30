import React, { useState } from 'react';
import { 
  MessageSquare, 
  Download, 
  Eye, 
  Send, 
  CheckCircle2, 
  Clock, 
  Building2, 
  MapPin 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InquiryAPI } from '../../services/api';

export const AdminCustomerEnquiriesView = ({ 
  inquiries = [], 
  onRefresh, 
  onShowToast, 
  exportToCSV 
}) => {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const handleOpenInquiryDetails = (inq) => {
    setSelectedInquiry(inq);
    setIsInquiryModalOpen(true);
  };

  const handleUpdateInquiryStatus = async (inqId, newStatus) => {
    try {
      await InquiryAPI.updateStatus(inqId, newStatus);
      if (onShowToast) onShowToast(`Enquiry status updated to ${newStatus}`);
      setIsInquiryModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating enquiry status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--brand-cyan)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Customer Wholesale Enquiries & High-Volume Fleet Leads</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time quotes and logistics queries from mining corporations, logistics fleets, transport unions, and highway pump operators.
          </p>
        </div>

        <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Customer_Inquiries', inquiries)}>
          Export Enquiries CSV
        </Button>
      </div>

      {/* Inquiries DataTable */}
      <DataTable
        title="High-Volume Commercial Leads & Plant Dispatch Requests"
        data={inquiries}
        columns={[
          {
            header: 'Enquiry Code',
            accessor: 'inquiryNumber',
            render: (val, row) => (
              <div>
                <strong style={{ color: 'var(--brand-blue)', fontFamily: 'monospace' }}>{val || `INQ-${row.id?.slice(0, 6)}`}</strong>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{row.createdAt || 'Recent'}</div>
              </div>
            )
          },
          {
            header: 'Contact & Company',
            accessor: 'customerName',
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)' }}>{val}</strong>
                <div style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 600 }}>{row.companyName || 'Fleet Operator'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.email} • {row.phone}</div>
              </div>
            )
          },
          {
            header: 'Destination Hub / City',
            accessor: 'city',
            render: (val, row) => (
              <div>
                <strong>{val || 'Odisha Central'}</strong>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{row.state || 'Highway Corridor'}</div>
              </div>
            )
          },
          {
            header: 'Product Requested',
            accessor: 'productInterest',
            render: (val) => (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-medium)' }}>
                {val || 'UltraBlue+ Fleet AUS 32 DEF'}
              </span>
            )
          },
          {
            header: 'Estimated Volume',
            accessor: 'estimatedVolume',
            render: (val) => (
              <div>
                <strong style={{ color: 'var(--brand-gold)' }}>{val || '5,000 Litres / Mo'}</strong>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Fleet Requirement</div>
              </div>
            )
          },
          {
            header: 'Status',
            accessor: 'status',
            render: (val) => <StatusBadge status={val} />
          },
          {
            header: 'Action',
            accessor: 'id',
            render: (val, row) => (
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => handleOpenInquiryDetails(row)}
                >
                  View
                </Button>
                {row.status !== 'RESOLVED' && (
                  <Button
                    size="sm"
                    variant="gold"
                    icon={Send}
                    onClick={() => handleUpdateInquiryStatus(row.id, 'RESOLVED')}
                  >
                    Quote
                  </Button>
                )}
              </div>
            )
          }
        ]}
      />

      {/* INQUIRY MESSAGE & SPECS MODAL */}
      <Modal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        title={`Commercial Lead Details: ${selectedInquiry?.companyName || selectedInquiry?.customerName}`}
      >
        {selectedInquiry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Contact Person:</span> <strong>{selectedInquiry.customerName}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Enterprise:</span> <strong>{selectedInquiry.companyName || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Mobile Number:</span> <strong>{selectedInquiry.phone}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email Address:</span> <strong>{selectedInquiry.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>City / Territory:</span> <strong>{selectedInquiry.city}, {selectedInquiry.state}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Product Interest:</span> <strong>{selectedInquiry.productInterest}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Required Volume:</span> <strong style={{ color: 'var(--brand-gold)' }}>{selectedInquiry.estimatedVolume}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Lead Status:</span> <StatusBadge status={selectedInquiry.status} /></div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Customer Requirements & Message:
              </label>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {selectedInquiry.message || 'No additional message provided. Customer requested factory wholesale price schedule.'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-medium)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'IN_REVIEW')}
                >
                  Mark Under Review
                </Button>
                <Button
                  size="sm"
                  variant="gold"
                  icon={CheckCircle2}
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'RESOLVED')}
                >
                  Dispatch Formal Quote
                </Button>
              </div>
              <Button variant="secondary" onClick={() => setIsInquiryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
