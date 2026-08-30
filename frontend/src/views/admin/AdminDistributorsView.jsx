import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  MapPin, 
  CreditCard 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DistributorAPI } from '../../services/api';

export const AdminDistributorsView = ({ 
  distributors = [], 
  onRefresh, 
  onShowToast, 
  exportToCSV 
}) => {
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isCreateDistributorModalOpen, setIsCreateDistributorModalOpen] = useState(false);

  const [newDistForm, setNewDistForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    city: '',
    creditLimit: 250000,
    tier: 'Gold Tier (15% Disc)'
  });

  const handleOpenKycReview = (dist) => {
    setSelectedDistributor(dist);
    setIsKycModalOpen(true);
  };

  const handleApproveKyc = async (id, tier = 'Gold Tier (15% Disc)') => {
    try {
      await DistributorAPI.updateStatus(id, 'APPROVED', tier);
      if (onShowToast) onShowToast(`Distributor KYC Approved with ${tier}!`);
      setIsKycModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating KYC status.');
    }
  };

  const handleRejectKyc = async (id) => {
    try {
      await DistributorAPI.updateStatus(id, 'REJECTED');
      if (onShowToast) onShowToast('Distributor application rejected.');
      setIsKycModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating KYC status.');
    }
  };

  const handleCreateDistributorSubmit = async (e) => {
    e.preventDefault();
    try {
      await DistributorAPI.register({
        company_name: newDistForm.companyName,
        contact_person: newDistForm.contactPerson,
        email: newDistForm.email,
        phone: newDistForm.phone,
        gstin: newDistForm.gstin,
        city: newDistForm.city,
        credit_limit: parseFloat(newDistForm.creditLimit),
        discount_tier: newDistForm.tier,
        status: 'ACTIVE'
      });

      if (onShowToast) onShowToast(`Distributor account "${newDistForm.companyName}" created and authorized!`);
      setIsCreateDistributorModalOpen(false);
      setNewDistForm({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        gstin: '',
        city: '',
        creditLimit: 250000,
        tier: 'Gold Tier (15% Disc)'
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error creating distributor account.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--brand-gold)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Authorized B2B Partner Directory & KYC Status</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Manage authorized distributor credit lines, price tiers, wholesale GST compliance, and new partner onboarding.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Distributors', distributors)}>
            Export Partners CSV
          </Button>
          <Button size="sm" variant="gold" icon={Plus} onClick={() => setIsCreateDistributorModalOpen(true)}>
            Create Distributor
          </Button>
        </div>
      </div>

      {/* Distributors DataTable */}
      <DataTable
        title="B2B Network & Wholesale Partners"
        data={distributors}
        columns={[
          { 
            header: 'Company & Contact', 
            accessor: 'companyName', 
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)' }}>{val}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {row.contactPerson} • {row.phone}
                </div>
              </div>
            )
          },
          { 
            header: 'GSTIN / Territory', 
            accessor: 'gstin', 
            render: (val, row) => (
              <div>
                <code style={{ fontSize: '11px', fontWeight: 600 }}>{val}</code>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.city || row.state || 'Odisha'}</div>
              </div>
            )
          },
          { 
            header: 'Assigned Tier', 
            accessor: 'tier', 
            render: (val) => (
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '3px 8px', 
                borderRadius: '4px',
                backgroundColor: val?.includes('Platinum') ? 'rgba(0, 86, 210, 0.12)' : 'rgba(255, 180, 0, 0.15)',
                color: val?.includes('Platinum') ? 'var(--brand-blue)' : 'var(--brand-gold)'
              }}>
                {val || 'Standard Tier'}
              </span>
            )
          },
          { 
            header: 'Revolving Credit Limit', 
            accessor: 'creditLimit', 
            render: (val) => `₹ ${(val || 0).toLocaleString('en-IN')}` 
          },
          { 
            header: 'Available Balance', 
            accessor: 'availableCredit', 
            render: (val, row) => (
              <strong style={{ color: (val || 0) < 50000 ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                ₹ {(val || 0).toLocaleString('en-IN')}
              </strong>
            )
          },
          { 
            header: 'KYC Status', 
            accessor: 'accountStatus', 
            render: (val, row) => <StatusBadge status={val || row.status} /> 
          },
          {
            header: 'Actions',
            accessor: 'id',
            render: (val, row) => (
              <Button 
                size="sm" 
                variant={(row.accountStatus === 'PENDING_REVIEW' || row.status === 'PENDING_REVIEW') ? 'gold' : 'secondary'}
                onClick={() => handleOpenKycReview(row)}
              >
                {(row.accountStatus === 'PENDING_REVIEW' || row.status === 'PENDING_REVIEW') ? 'Review KYC' : 'Edit Partner'}
              </Button>
            )
          }
        ]}
      />

      {/* KYC REVIEW MODAL */}
      <Modal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        title={`KYC & Account Review: ${selectedDistributor?.companyName}`}
      >
        {selectedDistributor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Contact:</span> <strong>{selectedDistributor.contactPerson}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Mobile:</span> <strong>{selectedDistributor.phone}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{selectedDistributor.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>GSTIN:</span> <strong>{selectedDistributor.gstin}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Territory:</span> <strong>{selectedDistributor.city}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Requested Tier:</span> <strong>{selectedDistributor.tier}</strong></div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-medium)', paddingTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Assign Authorized Wholesale Discount Tier:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => handleApproveKyc(selectedDistributor.id, 'Silver Tier (10% Disc)')}
                >
                  Silver (10%)
                </Button>
                <Button 
                  size="sm" 
                  variant="gold" 
                  onClick={() => handleApproveKyc(selectedDistributor.id, 'Gold Tier (15% Disc)')}
                >
                  Gold (15%)
                </Button>
                <Button 
                  size="sm" 
                  variant="primary" 
                  onClick={() => handleApproveKyc(selectedDistributor.id, 'Platinum Tier (20% Disc)')}
                >
                  Platinum (20%)
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <Button 
                variant="ghost" 
                style={{ color: 'var(--status-danger)' }}
                icon={XCircle}
                onClick={() => handleRejectKyc(selectedDistributor.id)}
              >
                Reject Application
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setIsKycModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE DISTRIBUTOR ACCOUNT MODAL */}
      <Modal
        isOpen={isCreateDistributorModalOpen}
        onClose={() => setIsCreateDistributorModalOpen(false)}
        title="Directly Create & Onboard Distributor Account"
      >
        <form onSubmit={handleCreateDistributorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Company / Enterprise Name</label>
            <Input value={newDistForm.companyName} onChange={e => setNewDistForm({ ...newDistForm, companyName: e.target.value })} placeholder="e.g. Kalinga Express Heavy Haulers" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Contact Person</label>
              <Input value={newDistForm.contactPerson} onChange={e => setNewDistForm({ ...newDistForm, contactPerson: e.target.value })} placeholder="e.g. Subrat Das" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Mobile Number</label>
              <Input value={newDistForm.phone} onChange={e => setNewDistForm({ ...newDistForm, phone: e.target.value })} placeholder="+91 9853675971" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Email Address (Login ID)</label>
              <Input type="email" value={newDistForm.email} onChange={e => setNewDistForm({ ...newDistForm, email: e.target.value })} placeholder="distributor@domain.com" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>GSTIN Number</label>
              <Input value={newDistForm.gstin} onChange={e => setNewDistForm({ ...newDistForm, gstin: e.target.value.toUpperCase() })} placeholder="21AABCU9603R1ZM" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Discount Tier</label>
              <Select
                value={newDistForm.tier}
                onChange={e => setNewDistForm({ ...newDistForm, tier: e.target.value })}
                options={[
                  { label: 'Gold Tier (15% Discount)', value: 'Gold Tier (15% Disc)' },
                  { label: 'Platinum Tier (20% Discount)', value: 'Platinum Tier (20% Disc)' },
                  { label: 'Silver Tier (10% Discount)', value: 'Silver Tier (10% Disc)' }
                ]}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Revolving Credit Limit (₹)</label>
              <Input type="number" value={newDistForm.creditLimit} onChange={e => setNewDistForm({ ...newDistForm, creditLimit: e.target.value })} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Assigned City / Territory</label>
            <Input value={newDistForm.city} onChange={e => setNewDistForm({ ...newDistForm, city: e.target.value })} placeholder="Bhadrak, Keonjhar, Cuttack..." required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateDistributorModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>Create & Authorize Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
