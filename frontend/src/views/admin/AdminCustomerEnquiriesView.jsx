import React, { useState } from 'react';
import { 
  MessageSquare, 
  Download, 
  Eye, 
  Send, 
  CheckCircle2, 
  Clock, 
  Building2, 
  MapPin,
  MessageCircle
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
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenInquiryDetails = (inq) => {
    setSelectedInquiry(inq);
    setIsInquiryModalOpen(true);
  };

  const handleUpdateInquiryStatus = async (inqId, newStatus) => {
    setIsUpdating(true);
    try {
      await InquiryAPI.updateStatus(inqId, newStatus);
      const friendlyStatus = newStatus === 'RESOLVED' ? 'Quote Dispatched' : newStatus === 'IN_REVIEW' ? 'Under Review' : newStatus;
      if (onShowToast) onShowToast(`Enquiry status updated to ${friendlyStatus}`);
      setIsInquiryModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating enquiry status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendWhatsAppQuote = (inq) => {
    if (!inq?.phone) {
      if (onShowToast) onShowToast('No customer phone number available.');
      return;
    }
    const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const clientName = inq.customerName || inq.name || 'Customer';
    const prodName = inq.productInterest || inq.packagingNeeded || 'UltraBlue+ DEF';
    const qty = inq.estimatedVolume || inq.estimatedQuantity || 'Required Volume';
    const inqCode = inq.inquiryCode || inq.inquiryNumber || inq.id;
    
    const message = `Hello ${clientName}, greetings from UltraBlue+ (Ayush Green Energy Mother Plant, Bhadrak).\n\nRegarding your quotation inquiry #${inqCode} for ${prodName} (${qty}):\nOur commercial sales desk has processed your requirement. Attached is your formal factory quote schedule with direct freight and GST breakdown.\n\nPlease let us know if you need any adjustments or immediate highway tanker dispatch.`;
    
    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    // Automatically mark status as RESOLVED / Quote Dispatched
    handleUpdateInquiryStatus(inq.id || inq.rawId, 'RESOLVED');
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
            render: (val, row) => {
              const codeDisplay = val || row.inquiryCode || (row.id ? `INQ-${String(row.id).slice(0, 6)}` : 'INQ-NEW');
              return (
                <div>
                  <strong style={{ color: 'var(--brand-blue)', fontFamily: 'monospace' }}>{codeDisplay}</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{row.createdAt || row.date || 'Recent'}</div>
                </div>
              );
            }
          },
          {
            header: 'Contact & Company',
            accessor: 'customerName',
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)' }}>{val || row.name || 'Anonymous Customer'}</strong>
                <div style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 600 }}>{row.companyName || row.company || 'Enterprise Fleet'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {row.phone}{row.email && row.email !== 'N/A' ? ` • ${row.email}` : ''}
                </div>
              </div>
            )
          },
          {
            header: 'Destination Hub / City',
            accessor: 'city',
            render: (val, row) => (
              <div>
                <strong>{val || row.location || 'Direct Dispatch'}</strong>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Odisha Corridor</div>
              </div>
            )
          },
          {
            header: 'Product Requested',
            accessor: 'productInterest',
            render: (val, row) => (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}>
                {val || row.packagingNeeded || 'UltraBlue+ DEF'}
              </span>
            )
          },
          {
            header: 'Estimated Volume',
            accessor: 'estimatedVolume',
            render: (val, row) => (
              <div>
                <strong style={{ color: 'var(--brand-gold)' }}>{val || row.estimatedQuantity || 'On Request'}</strong>
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
                {row.status !== 'RESOLVED' && row.status !== 'QUOTE_DISPATCHED' && (
                  <Button
                    size="sm"
                    variant="gold"
                    icon={Send}
                    onClick={() => handleUpdateInquiryStatus(row.id || row.rawId || row.inquiryCode, 'RESOLVED')}
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
        title={`Commercial Lead: ${selectedInquiry?.companyName || selectedInquiry?.company || selectedInquiry?.customerName || selectedInquiry?.name || 'Inquiry Details'}`}
      >
        {selectedInquiry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Contact Person:</span> <strong>{selectedInquiry.customerName || selectedInquiry.name || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Fleet / Enterprise:</span> <strong>{selectedInquiry.companyName || selectedInquiry.company || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Mobile Number:</span> <strong style={{ color: 'var(--brand-cyan)' }}>{selectedInquiry.phone || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email Address:</span> <strong>{selectedInquiry.email && selectedInquiry.email !== 'N/A' ? selectedInquiry.email : 'Not Provided'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Destination / City:</span> <strong>{selectedInquiry.city || selectedInquiry.location || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Product Requested:</span> <strong style={{ color: 'var(--text-primary)' }}>{selectedInquiry.productInterest || selectedInquiry.packagingNeeded || 'UltraBlue+ DEF'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Estimated Volume:</span> <strong style={{ color: 'var(--brand-gold)' }}>{selectedInquiry.estimatedVolume || selectedInquiry.estimatedQuantity || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Enquiry Code:</span> <code style={{ color: 'var(--brand-blue)' }}>{selectedInquiry.inquiryCode || selectedInquiry.inquiryNumber || selectedInquiry.id}</code></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lead Status:</span> <StatusBadge status={selectedInquiry.status} />
                </div>
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

            <div style={{ borderTop: '1px solid var(--border-medium)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isUpdating}
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id || selectedInquiry.rawId, 'IN_REVIEW')}
                >
                  Mark Under Review
                </Button>
                <Button
                  size="sm"
                  variant="gold"
                  icon={CheckCircle2}
                  disabled={isUpdating}
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id || selectedInquiry.rawId, 'RESOLVED')}
                >
                  Dispatch Formal Quote
                </Button>
                {selectedInquiry.phone && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={MessageCircle}
                    onClick={() => handleSendWhatsAppQuote(selectedInquiry)}
                    style={{ backgroundColor: '#10B981', borderColor: '#059669' }}
                  >
                    WhatsApp Quote
                  </Button>
                )}
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
