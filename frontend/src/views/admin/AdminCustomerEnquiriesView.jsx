import React, { useMemo, useState } from 'react';
import {
  MessageSquare,
  Download,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Mail,
  Smartphone,
  Copy,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InquiryAPI } from '../../services/api';

const DEFAULT_VALID_UNTIL = (() => {
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  if (now <= yearEnd) {
    return `${now.getFullYear()}-12-31`;
  }
  const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return plus30.toISOString().slice(0, 10);
})();

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatPriceDisplay(rawPrice) {
  const num = Number(rawPrice);
  if (!Number.isFinite(num) || num <= 0) return '0';
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatQuoteDates(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return { shortDate: '31-12-2026', longDate: '31 December 2026' };
  }
  const [y, m, d] = isoDate.split('-').map(Number);
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return {
    shortDate: `${dd}-${mm}-${y}`,
    longDate: `${d} ${MONTHS[m - 1]} ${y}`
  };
}

function buildPreviewMessages({ customerName, productName, price, validUntil, senderName, companyName }) {
  const cleanProduct = (productName || 'Ultrablue Plus').trim() || 'Ultrablue Plus';
  const cleanCustomer = (customerName || 'Customer').trim() || 'Customer';
  const cleanSender = (senderName || 'Sales Desk').trim() || 'Sales Desk';
  const cleanCompany = (companyName || 'Ayush Green Energy').trim() || 'Ayush Green Energy';
  const priceDisplay = formatPriceDisplay(price);
  const { shortDate, longDate } = formatQuoteDates(validUntil);

  return {
    shortMessage: `The price for ${cleanProduct} is ${priceDisplay} and is valid until ${shortDate}.\nRegards UltraBluePlus`,
    emailSubject: `Quotation for ${cleanProduct}`,
    emailBody:
      `Dear ${cleanCustomer},\n\n` +
      `Thank you for your inquiry regarding ${cleanProduct}. We are pleased to offer it at ₹${priceDisplay}. This quotation is valid through ${longDate}.\n\n` +
      `Please let us know if you would like to proceed or require any additional information. We look forward to assisting you.\n\n` +
      `Kind regards,\n${cleanSender}\n${cleanCompany}`
  };
}

function formatCompanySignatureName(name) {
  if (!name) return 'Ayush Green Energy';
  if (name === name.toUpperCase()) {
    return name
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
}

function getInquiryIdentifier(inq) {
  return inq?.id || inq?.rawId || inq?.inquiryCode || inq?.inquiryNumber;
}

const REJECTION_PRESETS = [
  'Outside delivery territory',
  'Below minimum order volume',
  'Duplicate inquiry',
  'Invalid contact details'
];

export const AdminCustomerEnquiriesView = ({
  inquiries = [],
  products = [],
  authUser = null,
  COMPANY_INFO = null,
  onRefresh,
  onShowToast,
  exportToCSV
}) => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState('quote'); // 'quote' | 'reject'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [dispatchResult, setDispatchResult] = useState(null);

  // Quote Form State
  const [productName, setProductName] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [validUntil, setValidUntil] = useState(DEFAULT_VALID_UNTIL);
  const [senderName, setSenderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [channels, setChannels] = useState({ whatsapp: true, sms: false, email: false });
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  // Reject Form State
  const [rejectionReason, setRejectionReason] = useState('');

  const productSuggestions = useMemo(() => {
    const names = new Set(['Ultrablue Plus']);
    products.forEach((p) => {
      if (p?.name) names.add(p.name);
      if (Array.isArray(p?.packOptions)) {
        p.packOptions.forEach((v) => {
          if (v?.size && p?.name) names.add(`${p.name} - ${v.size}`);
        });
      }
    });
    return Array.from(names);
  }, [products]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: inquiries.length, NEW_INQUIRY: 0, IN_REVIEW: 0, RESOLVED: 0, REJECTED: 0 };
    inquiries.forEach((inq) => {
      const s = inq.status || 'NEW_INQUIRY';
      if (s === 'QUOTED' || s === 'RESOLVED' || s === 'QUOTE_DISPATCHED') counts.RESOLVED += 1;
      else if (s === 'REJECTED') counts.REJECTED += 1;
      else if (s === 'IN_REVIEW') counts.IN_REVIEW += 1;
      else counts.NEW_INQUIRY += 1;
    });
    return counts;
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    if (statusFilter === 'ALL') return inquiries;
    return inquiries.filter((inq) => {
      const s = inq.status || 'NEW_INQUIRY';
      if (statusFilter === 'RESOLVED') return s === 'RESOLVED' || s === 'QUOTED' || s === 'QUOTE_DISPATCHED';
      return s === statusFilter;
    });
  }, [inquiries, statusFilter]);

  const handleOpenReviewModal = (inq, initialMode = 'quote') => {
    const prod = inq.quotedProduct || inq.productInterest || inq.packagingNeeded || 'Ultrablue Plus';
    const matchedProduct = products.find((p) =>
      p.name?.toLowerCase() === prod.toLowerCase() ||
      prod.toLowerCase().includes(p.name?.toLowerCase() || '__none__')
    );

    setSelectedInquiry(inq);
    setActionMode(initialMode);
    setFormError('');
    setDispatchResult(null);

    setProductName(prod);
    setQuotedPrice(
      inq.quotedPrice
        ? String(inq.quotedPrice)
        : matchedProduct?.distributorPrice
          ? String(matchedProduct.distributorPrice)
          : ''
    );
    setValidUntil(inq.validUntil || DEFAULT_VALID_UNTIL);
    setSenderName(authUser?.name || 'Sales Desk');
    setCompanyName(formatCompanySignatureName(COMPANY_INFO?.name));

    const hasPhone = Boolean((inq.phone || '').replace(/\D/g, '').length >= 10);
    const hasEmail = Boolean(inq.email && inq.email.includes('@'));
    setChannels({
      whatsapp: hasPhone,
      sms: false,
      email: hasEmail
    });
    setWhatsappNumber(inq.phone || '');
    setSmsPhone(inq.phone || '');
    setEmailAddress(inq.email || '');
    setRejectionReason(inq.rejectionReason || '');
    setIsInquiryModalOpen(true);
  };

  const toggleChannel = (channelKey) => {
    setFormError('');
    setChannels((prev) => ({ ...prev, [channelKey]: !prev[channelKey] }));
  };

  const handleUpdateInquiryStatus = async (inqId, newStatus) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await InquiryAPI.updateStatus(inqId, newStatus);
      if (onShowToast) onShowToast(`Enquiry marked as ${newStatus === 'IN_REVIEW' ? 'Under Review' : newStatus}.`);
      setIsInquiryModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message || 'Error updating enquiry status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setFormError('');

    const chosenChannels = Object.entries(channels)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    if (!productName.trim()) {
      setFormError('Please enter the product name for the quotation.');
      return;
    }
    const numericPrice = Number(quotedPrice);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError('Please enter a valid price greater than 0.');
      return;
    }
    if (!validUntil) {
      setFormError('Please select a quotation validity date.');
      return;
    }
    if (chosenChannels.length === 0) {
      setFormError('Select at least one delivery channel (WhatsApp, Text Message, or Email).');
      return;
    }
    if (channels.whatsapp && whatsappNumber.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }
    if (channels.sms && smsPhone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number for text message.');
      return;
    }
    if (channels.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress.trim())) {
      setFormError('Please enter a valid customer email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await InquiryAPI.submitQuote(getInquiryIdentifier(selectedInquiry), {
        product_name: productName.trim(),
        price: numericPrice,
        valid_until: validUntil,
        channels: chosenChannels,
        whatsapp_number: channels.whatsapp ? whatsappNumber.trim() : null,
        phone: channels.sms ? smsPhone.trim() : (whatsappNumber.trim() || selectedInquiry.phone || null),
        email: channels.email ? emailAddress.trim() : null,
        sender_name: senderName.trim() || 'Sales Desk',
        company_name: companyName.trim() || 'Ayush Green Energy',
        reviewed_by: authUser?.name || senderName.trim() || 'Admin'
      });

      setDispatchResult(res);
      if (res.whatsapp_url) {
        window.open(res.whatsapp_url, '_blank', 'noopener,noreferrer');
      } else if (res.sms_url) {
        window.location.href = res.sms_url;
      }

      if (onShowToast) {
        const emailNote = res.email_status === 'sent'
          ? 'Email dispatched.'
          : res.email_status === 'logged'
            ? 'Email logged locally (configure SMTP for live inbox delivery).'
            : '';
        onShowToast(`${res.message} ${emailNote}`.trim());
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to submit quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectInquiry = async () => {
    if (!selectedInquiry) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await InquiryAPI.reject(getInquiryIdentifier(selectedInquiry), {
        reason: rejectionReason.trim() || null,
        reviewed_by: authUser?.name || 'Admin'
      });
      if (onShowToast) onShowToast(res.message || 'Enquiry rejected.');
      setIsInquiryModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to reject enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTextToClipboard = async (text, label = 'Message') => {
    try {
      await navigator.clipboard.writeText(text);
      if (onShowToast) onShowToast(`${label} copied to clipboard.`);
    } catch {
      if (onShowToast) onShowToast('Copy failed — please select and copy manually.');
    }
  };

  const livePreview = buildPreviewMessages({
    customerName: selectedInquiry?.customerName || selectedInquiry?.name,
    productName,
    price: quotedPrice,
    validUntil,
    senderName,
    companyName
  });

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border-medium)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none'
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
            Review incoming leads, reject invalid requests, or submit price quotations via WhatsApp, SMS, or Email.
          </p>
        </div>

        <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Customer_Inquiries', inquiries)}>
          Export Enquiries CSV
        </Button>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: `All (${statusCounts.ALL})` },
          { id: 'NEW_INQUIRY', label: `New Inquiry (${statusCounts.NEW_INQUIRY})` },
          { id: 'IN_REVIEW', label: `Under Review (${statusCounts.IN_REVIEW})` },
          { id: 'RESOLVED', label: `Quoted (${statusCounts.RESOLVED})` },
          { id: 'REJECTED', label: `Rejected (${statusCounts.REJECTED})` }
        ].map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '12px',
                fontWeight: active ? 800 : 600,
                cursor: 'pointer',
                border: active ? '1px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                backgroundColor: active ? 'var(--brand-blue)' : 'var(--bg-card)',
                color: active ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inquiries DataTable */}
      <DataTable
        title="High-Volume Commercial Leads & Plant Dispatch Requests"
        data={filteredInquiries}
        columns={[
          {
            header: 'Enquiry Code',
            accessor: 'inquiryNumber',
            render: (val, row) => {
              const codeDisplay = val || row.inquiryCode || row.id || '';
              return (
                <div>
                  <strong style={{ color: 'var(--brand-blue)', fontFamily: 'monospace' }}>{codeDisplay}</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{row.createdAt || row.date || ''}</div>
                </div>
              );
            }
          },
          {
            header: 'Contact & Company',
            accessor: 'customerName',
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)' }}>{val || row.name || '-'}</strong>
                <div style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 600 }}>{row.companyName || row.company || '-'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {row.phone}{row.email ? ` • ${row.email}` : ''}
                </div>
              </div>
            )
          },
          {
            header: 'Destination Hub / City',
            accessor: 'city',
            render: (val, row) => (
              <div>
                <strong>{val || row.location || '-'}</strong>
              </div>
            )
          },
          {
            header: 'Product Requested',
            accessor: 'productInterest',
            render: (val, row) => (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}>
                {val || row.packagingNeeded || '-'}
              </span>
            )
          },
          {
            header: 'Estimated Volume',
            accessor: 'estimatedVolume',
            render: (val, row) => (
              <div>
                <strong style={{ color: 'var(--brand-gold)' }}>{val || row.estimatedQuantity || '-'}</strong>
              </div>
            )
          },
          {
            header: 'Status',
            accessor: 'status',
            render: (val, row) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                <StatusBadge status={val} />
                {row.quotedPrice ? (
                  <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 700 }}>
                    ₹{formatPriceDisplay(row.quotedPrice)}
                  </span>
                ) : null}
              </div>
            )
          },
          {
            header: 'Action',
            accessor: 'id',
            render: (val, row) => {
              const isFinalized = row.status === 'RESOLVED' || row.status === 'QUOTED' || row.status === 'QUOTE_DISPATCHED' || row.status === 'REJECTED';
              return (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Eye}
                    onClick={() => handleOpenReviewModal(row, 'quote')}
                  >
                    Review
                  </Button>
                  {!isFinalized && (
                    <>
                      <Button
                        size="sm"
                        variant="gold"
                        icon={Send}
                        onClick={() => handleOpenReviewModal(row, 'quote')}
                      >
                        Quote
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={XCircle}
                        onClick={() => handleOpenReviewModal(row, 'reject')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              );
            }
          }
        ]}
      />

      {/* INQUIRY REVIEW, QUOTATION & REJECTION MODAL */}
      <Modal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        maxWidth="700px"
        icon={MessageSquare}
        title={`Review Inquiry: ${selectedInquiry?.inquiryCode || selectedInquiry?.inquiryNumber || ''}`}
        subtitle={`${selectedInquiry?.companyName || selectedInquiry?.company || ''} • ${selectedInquiry?.customerName || selectedInquiry?.name || ''}`}
      >
        {selectedInquiry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Lead Summary Box */}
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Customer Name:</span> <strong>{selectedInquiry.customerName || selectedInquiry.name || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Company:</span> <strong>{selectedInquiry.companyName || selectedInquiry.company || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Mobile:</span> <strong style={{ color: 'var(--brand-cyan)' }}>{selectedInquiry.phone || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{selectedInquiry.email || 'Not provided'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Location:</span> <strong>{selectedInquiry.city || selectedInquiry.location || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Requested:</span> <strong>{selectedInquiry.productInterest || selectedInquiry.packagingNeeded || '-'} ({selectedInquiry.estimatedVolume || selectedInquiry.estimatedQuantity || '-'})</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <StatusBadge status={selectedInquiry.status} />
                </div>
              </div>

              {selectedInquiry.message && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Notes: </span>
                  {selectedInquiry.message}
                </div>
              )}

              {selectedInquiry.quotedPrice && (
                <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', fontSize: '12px', fontWeight: 600 }}>
                  Last Quote: ₹{formatPriceDisplay(selectedInquiry.quotedPrice)} for {selectedInquiry.quotedProduct || selectedInquiry.productInterest}
                  {selectedInquiry.validUntil ? ` (valid until ${formatQuoteDates(selectedInquiry.validUntil).shortDate})` : ''}
                  {selectedInquiry.quoteRecipient ? ` • Sent via ${selectedInquiry.quoteRecipient}` : ''}
                </div>
              )}

              {selectedInquiry.status === 'REJECTED' && selectedInquiry.rejectionReason && (
                <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', fontSize: '12px', fontWeight: 600 }}>
                  Rejection Reason: {selectedInquiry.rejectionReason}
                </div>
              )}
            </div>

            {/* Action Tabs: Submit Quote vs Reject Inquiry */}
            {!dispatchResult && (
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '10px' }}>
                <Button
                  size="sm"
                  variant={actionMode === 'quote' ? 'primary' : 'secondary'}
                  icon={Send}
                  onClick={() => { setActionMode('quote'); setFormError(''); }}
                >
                  Approve & Submit Quote
                </Button>
                <Button
                  size="sm"
                  variant={actionMode === 'reject' ? 'danger' : 'secondary'}
                  icon={XCircle}
                  onClick={() => { setActionMode('reject'); setFormError(''); }}
                >
                  Reject Inquiry
                </Button>
                {selectedInquiry.status === 'NEW_INQUIRY' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Clock}
                    disabled={isSubmitting}
                    onClick={() => handleUpdateInquiryStatus(getInquiryIdentifier(selectedInquiry), 'IN_REVIEW')}
                    style={{ marginLeft: 'auto' }}
                  >
                    Mark Under Review
                  </Button>
                )}
              </div>
            )}

            {formError && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#EF4444', fontSize: '12px', fontWeight: 600 }}>
                {formError}
              </div>
            )}

            {/* POST-SUBMIT CONFIRMATION & LAUNCH PANEL */}
            {dispatchResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '14px 16px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px', color: '#10B981' }}>
                    <CheckCircle2 size={18} />
                    <span>{dispatchResult.message}</span>
                  </div>
                  {dispatchResult.email_status === 'sent' && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Professional quotation email sent to <strong>{emailAddress}</strong>.
                    </p>
                  )}
                  {dispatchResult.email_status === 'logged' && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--brand-gold)' }}>
                      Email queued to Laravel mail log (<code>MAIL_MAILER={dispatchResult.mail_driver}</code>). Configure SMTP in <code>backend/.env</code> for live inbox delivery, or click <strong>Open Email Client</strong> below.
                    </p>
                  )}
                  {dispatchResult.email_status === 'failed' && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#EF4444' }}>
                      Email failed to send automatically ({dispatchResult.email_error}). You can send via your mail app below.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {dispatchResult.whatsapp_url && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={MessageCircle}
                      onClick={() => window.open(dispatchResult.whatsapp_url, '_blank', 'noopener,noreferrer')}
                      style={{ backgroundColor: '#10B981', borderColor: '#059669' }}
                    >
                      Open WhatsApp
                    </Button>
                  )}
                  {dispatchResult.sms_url && (
                    <a
                      href={dispatchResult.sms_url}
                      className="ub-btn ub-btn-sm ub-btn-primary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Smartphone size={14} />
                      <span>Open Text / SMS App</span>
                    </a>
                  )}
                  {dispatchResult.mailto_url && (
                    <a
                      href={dispatchResult.mailto_url}
                      className="ub-btn ub-btn-sm ub-btn-secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} />
                      <span>Open Email Client</span>
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Copy}
                    onClick={() => copyTextToClipboard(dispatchResult.short_message, 'WhatsApp / SMS quote')}
                  >
                    Copy SMS / WhatsApp Text
                  </Button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-medium)', paddingTop: '12px' }}>
                  <Button variant="primary" onClick={() => setIsInquiryModalOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : actionMode === 'quote' ? (
              <form onSubmit={handleSubmitQuote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Quote Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      list="ub-quote-products"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Ultrablue Plus"
                      required
                      style={inputStyle}
                    />
                    <datalist id="ub-quote-products">
                      {productSuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Offered Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      placeholder="e.g. 991"
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Valid Until *
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Email Signature Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Your Name (for Email)
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Dr. Alok Mohapatra"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Company Name (for Email)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Ayush Green Energy"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Delivery Channels Selector */}
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-medium)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Choose where to send this quotation:
                  </div>

                  {[
                    {
                      key: 'whatsapp',
                      label: 'WhatsApp',
                      icon: MessageCircle,
                      iconColor: '#10B981',
                      type: 'tel',
                      value: whatsappNumber,
                      onChange: setWhatsappNumber,
                      placeholder: 'Customer WhatsApp number'
                    },
                    {
                      key: 'sms',
                      label: 'Text Message (SMS)',
                      icon: Smartphone,
                      iconColor: 'var(--brand-cyan)',
                      type: 'tel',
                      value: smsPhone,
                      onChange: setSmsPhone,
                      placeholder: 'Customer mobile number'
                    },
                    {
                      key: 'email',
                      label: 'Email Address',
                      icon: Mail,
                      iconColor: 'var(--brand-blue)',
                      type: 'email',
                      value: emailAddress,
                      onChange: setEmailAddress,
                      placeholder: 'customer@company.com'
                    }
                  ].map((ch) => {
                    const ChannelIcon = ch.icon;
                    const enabled = channels[ch.key];
                    return (
                      <div key={ch.key} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', minWidth: '170px' }}>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleChannel(ch.key)}
                          />
                          <ChannelIcon size={15} color={ch.iconColor} />
                          <span>{ch.label}</span>
                        </label>
                        <input
                          type={ch.type}
                          value={ch.value}
                          onChange={(e) => ch.onChange(e.target.value)}
                          disabled={!enabled}
                          placeholder={ch.placeholder}
                          style={{ ...inputStyle, flex: '1 1 220px', opacity: enabled ? 1 : 0.5 }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Live Message Previews */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(channels.whatsapp || channels.sms) && (
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', marginBottom: '4px', textTransform: 'uppercase' }}>
                        WhatsApp / Text Message Preview
                      </div>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '12px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                        {livePreview.shortMessage}
                      </pre>
                    </div>
                  )}

                  {channels.email && (
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-blue)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Professional Email Preview — Subject: {livePreview.emailSubject}
                      </div>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '12px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                        {livePreview.emailBody}
                      </pre>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-medium)', paddingTop: '12px' }}>
                  <Button variant="secondary" onClick={() => setIsInquiryModalOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" icon={Send} loading={isSubmitting}>
                    Submit & Send Quote
                  </Button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Rejection Reason (Internal Note — Optional)
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {REJECTION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectionReason(preset)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '50px',
                          fontSize: '11px',
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejecting this inquiry..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-medium)', paddingTop: '12px' }}>
                  <Button variant="secondary" onClick={() => setIsInquiryModalOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="danger" icon={XCircle} loading={isSubmitting} onClick={handleRejectInquiry}>
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
