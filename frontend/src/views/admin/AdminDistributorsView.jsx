import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  CreditCard,
  MapPinned,
  ShoppingCart,
  Clock,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DistributorAPI, TerritoryAPI, DistributorOrderAPI } from '../../services/api';

// Validation helper utilities
const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email address is required.';
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email.trim())) return 'Please enter a valid email address (e.g. name@domain.com).';
  return '';
};

const validatePhone = (phone) => {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean) return 'Mobile number is required.';
  if (clean.length !== 10) return `Mobile number must be 10 digits (currently ${clean.length}).`;
  if (!/^[6-9]/.test(clean)) return 'Mobile number must start with 6, 7, 8, or 9.';
  return '';
};

const validateGSTIN = (gstin) => {
  const clean = String(gstin || '').trim().toUpperCase();
  if (!clean) return 'GSTIN number is required.';
  if (clean.length !== 15) return `GSTIN must be 15 characters (currently ${clean.length}/15).`;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(clean)) return 'Invalid GSTIN format (e.g. 21AABCU9603R1ZM).';
  return '';
};

const validateCreditLimit = (limit) => {
  if (limit === '' || limit === null || limit === undefined) return 'Credit limit is required.';
  const num = parseFloat(limit);
  if (isNaN(num) || num < 0) return 'Credit limit must be a positive number.';
  return '';
};

const validateEnterprise = (name) => {
  if (!name || !name.trim()) return 'Enterprise name is required.';
  if (name.trim().length < 2) return 'Enterprise name must be at least 2 characters.';
  return '';
};

const validateContact = (name) => {
  if (!name || !name.trim()) return 'Contact person name is required.';
  if (name.trim().length < 2) return 'Contact person name must be at least 2 characters.';
  return '';
};

export const AdminDistributorsView = ({ 
  authUser,
  distributors = [], 
  onRefresh, 
  onShowToast, 
  exportToCSV 
}) => {
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isCreateDistributorModalOpen, setIsCreateDistributorModalOpen] = useState(false);
  const [isAddTerritoryModalOpen, setIsAddTerritoryModalOpen] = useState(false);

  // Sub-tabs: 'orders' (B2B Purchase Orders) vs 'accounts' (Distributor Directory)
  const [activeSubTab, setActiveSubTab] = useState('orders');
  const [distributorOrders, setDistributorOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Credit Ledger & Settlement Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementDistributor, setSettlementDistributor] = useState(null);
  const [settlementLedger, setSettlementLedger] = useState([]);
  const [settlementForm, setSettlementForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    referenceNo: '',
    notes: ''
  });
  const [settlementError, setSettlementError] = useState('');

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const ords = await DistributorOrderAPI.getAll();
      setDistributorOrders(ords || []);
    } catch (e) {
      console.warn('Error fetching distributor orders in admin:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApproveOrder = async (orderId) => {
    try {
      await DistributorOrderAPI.approve(orderId, {
        admin_name: authUser?.name || 'Admin'
      });
      if (onShowToast) onShowToast('Distributor order approved! Routed to Sales Operator POS for billing.');
      await fetchOrders();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error approving order.');
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('Specify rejection reason for the distributor:');
    if (!reason) return;
    try {
      await DistributorOrderAPI.reject(orderId, reason);
      if (onShowToast) onShowToast('Distributor order rejected.');
      await fetchOrders();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error rejecting order.');
    }
  };

  const handleOpenSettlement = async (dist) => {
    setSettlementDistributor(dist);
    setSettlementForm({ amount: '', paymentMethod: 'UPI', referenceNo: '', notes: '' });
    setSettlementError('');
    setIsSettlementModalOpen(true);
    try {
      const res = await DistributorOrderAPI.getCreditLedger(dist.id);
      if (res && res.transactions) {
        setSettlementLedger(res.transactions);
      }
    } catch (e) {
      console.warn('Error loading ledger:', e);
    }
  };

  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    if (!settlementDistributor) return;
    const amt = parseFloat(settlementForm.amount);
    const maxOutstanding = settlementDistributor.rawOutstandingCredit || 0;
    if (isNaN(amt) || amt <= 0) {
      setSettlementError('Please enter a valid positive payment amount.');
      return;
    }
    if (amt > maxOutstanding) {
      setSettlementError(`Payment amount (₹${amt.toLocaleString('en-IN')}) cannot exceed total outstanding debt (₹${maxOutstanding.toLocaleString('en-IN')}).`);
      return;
    }
    if (!settlementForm.referenceNo.trim()) {
      setSettlementError('Payment reference / UTR / Cheque number is required.');
      return;
    }

    try {
      await DistributorOrderAPI.settleCredit({
        distributorId: settlementDistributor.id,
        amount: amt,
        paymentMethod: settlementForm.paymentMethod,
        referenceNo: settlementForm.referenceNo.trim(),
        notes: settlementForm.notes.trim(),
        recordedBy: authUser?.name || 'Admin Accounts'
      });
      if (onShowToast) onShowToast(`Settlement of ₹${amt.toLocaleString('en-IN')} recorded successfully!`);
      setIsSettlementModalOpen(false);
      if (onRefresh) onRefresh();
      await fetchOrders();
    } catch (err) {
      setSettlementError(err.message || 'Error recording settlement payment.');
    }
  };

  // Validation errors
  const [newDistErrors, setNewDistErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Dynamic database-driven territories
  const [databaseTerritories, setDatabaseTerritories] = useState({});
  const [territoryForm, setTerritoryForm] = useState({ state: '', city: '', customState: '' });

  const [editForm, setEditForm] = useState({
    id: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    city: '',
    state: '',
    customState: '',
    customCity: '',
    creditLimit: '',
    accountStatus: 'APPROVED'
  });

  const [newDistForm, setNewDistForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    city: '',
    state: '',
    customState: '',
    customCity: '',
    creditLimit: '',
    password: ''
  });

  const loadTerritories = async () => {
    try {
      const data = await TerritoryAPI.getAll();
      setDatabaseTerritories(data || {});
    } catch (err) {
      console.error('Error fetching territories from database:', err);
    }
  };

  useEffect(() => {
    loadTerritories();
  }, []);

  const stateOptions = [
    { value: '', label: '-- Select State / Region (from DB) --' },
    ...Object.keys(databaseTerritories).sort().map(s => ({ value: s, label: s })),
    { value: 'Other', label: '+ Add New State to DB' }
  ];

  const getCityOptions = (stateName, currentCity) => {
    if (!stateName || stateName === 'Other') return [{ value: '', label: '-- Select State First --' }];
    const cityList = (databaseTerritories[stateName] || []).map(item => (typeof item === 'string' ? item : item.city));
    const list = [{ value: '', label: '-- Select City / Territory (from DB) --' }];
    cityList.forEach(c => {
      list.push({ value: c, label: c });
    });
    if (currentCity && !cityList.includes(currentCity) && currentCity !== 'Other') {
      list.push({ value: currentCity, label: `${currentCity}` });
    }
    list.push({ value: 'Other', label: '+ Add New City to DB' });
    return list;
  };

  const handleAddNewTerritorySubmit = async (e) => {
    e.preventDefault();
    const finalState = territoryForm.state === 'Other' ? territoryForm.customState : territoryForm.state;
    const finalCity = territoryForm.city;
    if (!finalState || !finalCity) {
      if (onShowToast) onShowToast('Please specify both State and City.');
      return;
    }
    try {
      await TerritoryAPI.create({ state: finalState, city: finalCity });
      if (onShowToast) onShowToast(`Territory "${finalCity}, ${finalState}" saved to database!`);
      setIsAddTerritoryModalOpen(false);
      setTerritoryForm({ state: '', city: '', customState: '' });
      await loadTerritories();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error saving territory to database.');
    }
  };

  const handleOpenKycReview = (dist) => {
    setSelectedDistributor(dist);
    const existingLimit = dist.rawCreditLimit !== undefined 
      ? dist.rawCreditLimit 
      : (typeof dist.creditLimit === 'number' ? dist.creditLimit : (parseFloat(String(dist.creditLimit || '').replace(/[^0-9.]/g, '')) || ''));
    
    const distState = dist.state || dist.territory_state || '';
    const distCity = dist.city || dist.territory_city || '';

    setEditForm({
      id: dist.id,
      companyName: dist.companyName || dist.name || '',
      contactPerson: dist.contactPerson || '',
      phone: dist.phone || '',
      email: dist.email || '',
      gstin: dist.gstin || '',
      state: distState,
      city: distCity,
      customState: '',
      customCity: '',
      creditLimit: existingLimit,
      accountStatus: dist.accountStatus || dist.status || 'APPROVED'
    });
    setEditErrors({});
    setIsKycModalOpen(true);
  };

  const handleSaveDistributorEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editForm.id) return;
    const errors = {};
    const finalState = editForm.state === 'Other' ? editForm.customState.trim() : editForm.state.trim();
    const finalCity = editForm.city === 'Other' ? editForm.customCity.trim() : editForm.city.trim();

    const errCompany = validateEnterprise(editForm.companyName);
    if (errCompany) errors.companyName = errCompany;

    const errContact = validateContact(editForm.contactPerson);
    if (errContact) errors.contactPerson = errContact;

    const errPhone = validatePhone(editForm.phone);
    if (errPhone) errors.phone = errPhone;

    const errEmail = validateEmail(editForm.email);
    if (errEmail) errors.email = errEmail;

    const errGSTIN = validateGSTIN(editForm.gstin);
    if (errGSTIN) errors.gstin = errGSTIN;

    if (!finalState) errors.state = 'Please select a State.';
    if (!finalCity) errors.city = 'Please select a City / Territory.';

    const errCredit = validateCreditLimit(editForm.creditLimit);
    if (errCredit) errors.creditLimit = errCredit;

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      const firstMsg = Object.values(errors)[0];
      if (onShowToast) onShowToast(firstMsg);
      return;
    }
    setEditErrors({});

    try {
      if (editForm.state === 'Other' || editForm.city === 'Other') {
        try {
          await TerritoryAPI.create({ state: finalState, city: finalCity });
          loadTerritories();
        } catch {
          // ignore duplicate
        }
      }

      await DistributorAPI.update(editForm.id, {
        companyName: editForm.companyName.trim(),
        contactPerson: editForm.contactPerson.trim(),
        phone: editForm.phone.trim().replace(/\D/g, ''),
        email: editForm.email.trim().toLowerCase(),
        gstin: editForm.gstin.trim().toUpperCase(),
        city: finalCity,
        state: finalState,
        creditLimit: parseFloat(editForm.creditLimit) || 0,
        accountStatus: editForm.accountStatus
      });
      if (onShowToast) onShowToast(`Distributor "${editForm.companyName}" details saved successfully!`);
      setIsKycModalOpen(false);
      setEditErrors({});
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating distributor.');
    }
  };

  const handleRejectDistributor = async () => {
    if (!editForm.id) return;
    try {
      await DistributorAPI.update(editForm.id, {
        ...editForm,
        accountStatus: 'REJECTED'
      });
      if (onShowToast) onShowToast(`Distributor application marked as Rejected.`);
      setIsKycModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating status.');
    }
  };

  const handleCreateDistributorSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const finalState = newDistForm.state === 'Other' ? newDistForm.customState.trim() : newDistForm.state.trim();
    const finalCity = newDistForm.city === 'Other' ? newDistForm.customCity.trim() : newDistForm.city.trim();

    const errCompany = validateEnterprise(newDistForm.companyName);
    if (errCompany) errors.companyName = errCompany;

    const errContact = validateContact(newDistForm.contactPerson);
    if (errContact) errors.contactPerson = errContact;

    const errPhone = validatePhone(newDistForm.phone);
    if (errPhone) errors.phone = errPhone;

    const errEmail = validateEmail(newDistForm.email);
    if (errEmail) errors.email = errEmail;

    const errGSTIN = validateGSTIN(newDistForm.gstin);
    if (errGSTIN) errors.gstin = errGSTIN;

    if (!finalState) errors.state = 'Please select a State.';
    if (!finalCity) errors.city = 'Please select a City / Territory.';

    const errCredit = validateCreditLimit(newDistForm.creditLimit);
    if (errCredit) errors.creditLimit = errCredit;

    if (Object.keys(errors).length > 0) {
      setNewDistErrors(errors);
      const firstMsg = Object.values(errors)[0];
      if (onShowToast) onShowToast(firstMsg);
      return;
    }
    setNewDistErrors({});

    try {
      // If new state or city entered, persist to territories table in database
      if (newDistForm.state === 'Other' || newDistForm.city === 'Other') {
        try {
          await TerritoryAPI.create({ state: finalState, city: finalCity });
          loadTerritories();
        } catch {
          // ignore duplicate
        }
      }

      await DistributorAPI.create({
        companyName: newDistForm.companyName.trim(),
        contactPerson: newDistForm.contactPerson.trim(),
        email: newDistForm.email.trim().toLowerCase(),
        phone: newDistForm.phone.trim().replace(/\D/g, ''),
        gstin: newDistForm.gstin.trim().toUpperCase(),
        city: finalCity,
        state: finalState,
        creditLimit: parseFloat(newDistForm.creditLimit),
        password: newDistForm.password
      });

      if (onShowToast) onShowToast(`Distributor account "${newDistForm.companyName}" created and saved to database!`);
      setIsCreateDistributorModalOpen(false);
      setNewDistForm({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        gstin: '',
        city: '',
        state: '',
        customState: '',
        customCity: '',
        creditLimit: '',
        password: ''
      });
      setNewDistErrors({});
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error creating distributor account.');
    }
  };

  const pendingCount = distributorOrders.filter(o => o.status === 'PENDING_ADMIN_APPROVAL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Navigation Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <Button
          size="sm"
          variant={activeSubTab === 'orders' ? 'primary' : 'secondary'}
          icon={ShoppingCart}
          onClick={() => setActiveSubTab('orders')}
        >
          B2B Purchase Orders & Requisitions {pendingCount > 0 && (
            <span style={{ 
              marginLeft: '6px', 
              padding: '2px 7px', 
              borderRadius: '10px', 
              backgroundColor: '#EF4444', 
              color: '#FFFFFF', 
              fontSize: '10.5px', 
              fontWeight: 800 
            }}>
              {pendingCount} Pending
            </span>
          )}
        </Button>
        <Button
          size="sm"
          variant={activeSubTab === 'accounts' ? 'primary' : 'secondary'}
          icon={Users}
          onClick={() => setActiveSubTab('accounts')}
        >
          Distributor Directory & Credit Accounts ({distributors.length})
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* Sub-tab 1: B2B Purchase Orders & Admin Approvals */}
      {/* ========================================================================= */}
      {activeSubTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="var(--brand-blue)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Distributor B2B Purchase Orders & Requisitions</h3>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Review wholesale supply requisitions placed by distributors. Approved orders are routed to Sales Operator POS terminals for billing & stock deduction.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchOrders}>
                Refresh Orders
              </Button>
              <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_B2B_Orders', distributorOrders)}>
                Export Orders CSV
              </Button>
            </div>
          </div>

          <DataTable
            title="Incoming B2B Purchase Orders & Dispatch Queue"
            data={distributorOrders}
            emptyMessage="No distributor orders found yet. When distributors place orders in their portal, they will appear here."
            columns={[
              {
                header: 'Order Number',
                accessor: 'orderNumber',
                render: (val, row) => (
                  <div>
                    <strong style={{ color: 'var(--brand-blue)', fontFamily: 'monospace' }}>{val || row.id}</strong>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{row.date || row.createdAt}</div>
                  </div>
                )
              },
              {
                header: 'Distributor & Firm',
                accessor: 'distributorCompany',
                render: (val, row) => (
                  <div>
                    <strong style={{ fontSize: 'var(--font-size-md)' }}>{val}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {row.distributorName} • {row.distributorPhone}
                    </div>
                    {row.deliveryCity && (
                      <div style={{ fontSize: '10.5px', color: 'var(--brand-cyan)' }}>
                        Hub: {row.deliveryCity}, {row.deliveryState}
                      </div>
                    )}
                  </div>
                )
              },
              {
                header: 'Ordered Items & Packaging',
                accessor: 'items',
                render: (_, row) => (
                  <div>
                    {(row.items || []).map((it, idx) => (
                      <div key={idx} style={{ fontSize: '12px', fontWeight: 600 }}>
                        {it.productName} ({it.packSize}) <span style={{ color: 'var(--brand-blue)' }}>x {it.quantity}</span>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                header: 'Estimated Value',
                accessor: 'totalEstimatedValue',
                render: (val) => (
                  <strong style={{ color: 'var(--brand-blue)', fontSize: '13px' }}>
                    ₹ {(Number(val || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                )
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (val, row) => {
                  if (val === 'PENDING_ADMIN_APPROVAL') {
                    return (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                        PENDING APPROVAL
                      </span>
                    );
                  } else if (val === 'APPROVED') {
                    return (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                        APPROVED FOR POS BILLING
                      </span>
                    );
                  } else if (val === 'CONVERTED_TO_INVOICE') {
                    return (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        BILLED: {row.invoiceNumber || 'Completed'}
                      </span>
                    );
                  } else if (val === 'REJECTED') {
                    return (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        REJECTED
                      </span>
                    );
                  }
                  return <StatusBadge status={val} />;
                }
              },
              {
                header: 'Admin Actions',
                accessor: 'id',
                render: (val, row) => {
                  if (row.status === 'PENDING_ADMIN_APPROVAL') {
                    return (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          size="xs"
                          variant="gold"
                          icon={CheckCircle2}
                          onClick={() => handleApproveOrder(row.id)}
                          title="Approve Order for Sales Operator Billing"
                        >
                          Approve for Billing
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          icon={XCircle}
                          onClick={() => handleRejectOrder(row.id)}
                          title="Reject Order"
                        >
                          Reject
                        </Button>
                      </div>
                    );
                  } else if (row.status === 'APPROVED') {
                    return (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Ready for Operator POS
                      </span>
                    );
                  } else if (row.status === 'CONVERTED_TO_INVOICE') {
                    return (
                      <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 600 }}>
                        Dispatched
                      </span>
                    );
                  }
                  return <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>;
                }
              }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* Sub-tab 2: Distributor Directory & KYC */}
      {/* ========================================================================= */}
      {activeSubTab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--brand-gold)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Authorized B2B Partner Directory & KYC Status</h3>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Manage authorized distributor credit lines, wholesale pricing, GST compliance, and new partner onboarding.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button size="sm" variant="secondary" icon={MapPinned} onClick={() => setIsAddTerritoryModalOpen(true)}>
                Manage Territories in DB
              </Button>
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
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {[row.city, row.state].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                )
              },
              {
                header: 'Credit Limit',
                accessor: 'creditLimit',
                render: (val, row) => {
                  const limit = typeof row.rawCreditLimit === 'number' && !isNaN(row.rawCreditLimit)
                    ? row.rawCreditLimit
                    : (typeof val === 'number' && !isNaN(val)
                      ? val
                      : (parseFloat(String(val || '').replace(/[^0-9.-]+/g, '')) || 0));
                  return `₹ ${limit.toLocaleString('en-IN')}`;
                }
              },
              {
                header: 'Outstanding Debt',
                accessor: 'outstandingCredit',
                render: (val, row) => {
                  const debt = typeof row.rawOutstandingCredit === 'number' && !isNaN(row.rawOutstandingCredit)
                    ? row.rawOutstandingCredit
                    : (typeof val === 'number' && !isNaN(val)
                      ? val
                      : (parseFloat(String(val || '').replace(/[^0-9.-]+/g, '')) || 0));
                  return (
                    <strong style={{ color: debt > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                      ₹ {debt.toLocaleString('en-IN')}
                    </strong>
                  );
                }
              },
              {
                header: 'Available Limit',
                accessor: 'availableCredit',
                render: (val, row) => {
                  const limit = typeof row.rawCreditLimit === 'number' && !isNaN(row.rawCreditLimit)
                    ? row.rawCreditLimit
                    : (typeof row.creditLimit === 'number' && !isNaN(row.creditLimit)
                      ? row.creditLimit
                      : (parseFloat(String(row.creditLimit || '').replace(/[^0-9.-]+/g, '')) || 0));
                  const debt = typeof row.rawOutstandingCredit === 'number' && !isNaN(row.rawOutstandingCredit)
                    ? row.rawOutstandingCredit
                    : (typeof row.outstandingCredit === 'number' && !isNaN(row.outstandingCredit)
                      ? row.outstandingCredit
                      : (parseFloat(String(row.outstandingCredit || '').replace(/[^0-9.-]+/g, '')) || 0));
                  const avail = Math.max(0, limit - debt);
                  return (
                    <strong style={{ color: avail < 50000 ? 'var(--status-danger)' : 'var(--brand-blue)' }}>
                      ₹ {avail.toLocaleString('en-IN')}
                    </strong>
                  );
                }
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      size="xs"
                      variant={(row.accountStatus === 'PENDING_REVIEW' || row.status === 'PENDING_REVIEW') ? 'gold' : 'secondary'}
                      onClick={() => handleOpenKycReview(row)}
                    >
                      {(row.accountStatus === 'PENDING_REVIEW' || row.status === 'PENDING_REVIEW') ? 'Review KYC' : 'Edit'}
                    </Button>
                    <Button
                      size="xs"
                      variant="primary"
                      icon={CreditCard}
                      onClick={() => handleOpenSettlement(row)}
                      title="View credit statement and record payment settlement"
                    >
                      Settle Debt
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {/* RECORD CREDIT SETTLEMENT & STATEMENT MODAL */}
      <Modal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        title={`Credit Ledger & Debt Settlement: ${settlementDistributor?.companyName || 'Distributor'}`}
        subtitle={`Available Credit: ₹${(settlementDistributor?.rawAvailableCredit ?? 0).toLocaleString('en-IN')} • Current Debt: ₹${(settlementDistributor?.rawOutstandingCredit ?? 0).toLocaleString('en-IN')}`}
        icon={CreditCard}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Balance Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approved Limit</span>
              <div style={{ fontWeight: 700 }}>₹{(settlementDistributor?.rawCreditLimit ?? 0).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Outstanding</span>
              <div style={{ fontWeight: 800, color: (settlementDistributor?.rawOutstandingCredit || 0) > 0 ? '#EF4444' : '#22C55E' }}>
                ₹{(settlementDistributor?.rawOutstandingCredit || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining Limit</span>
              <div style={{ fontWeight: 700, color: 'var(--brand-cyan)' }}>
                ₹{(settlementDistributor?.rawAvailableCredit ?? 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Record Settlement Form */}
          <form onSubmit={handleSettlementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-medium)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px' }}>Record Payment Settlement (Pay Off Debt)</strong>
              {(settlementDistributor?.rawOutstandingCredit || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setSettlementForm(prev => ({ ...prev, amount: settlementDistributor.rawOutstandingCredit }))}
                  style={{ fontSize: '11px', color: 'var(--brand-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Pay Full Debt (₹{settlementDistributor.rawOutstandingCredit.toLocaleString('en-IN')})
                </button>
              )}
            </div>

            {settlementError && (
              <div style={{ color: '#EF4444', fontSize: '11.5px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 10px', borderRadius: '6px' }}>
                {settlementError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input
                label="Payment Amount (₹) *"
                type="number"
                min="1"
                step="any"
                value={settlementForm.amount}
                onChange={e => setSettlementForm({ ...settlementForm, amount: e.target.value })}
                placeholder="e.g. 25000"
                required
              />
              <Select
                label="Payment Mode *"
                value={settlementForm.paymentMethod}
                onChange={e => setSettlementForm({ ...settlementForm, paymentMethod: e.target.value })}
                options={[
                  { value: 'UPI', label: 'UPI / QR Transfer' },
                  { value: 'NEFT', label: 'NEFT / RTGS Bank Transfer' },
                  { value: 'Cheque', label: 'Bank Cheque' },
                  { value: 'Cash', label: 'Direct Cash' }
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input
                label="Payment Reference / UTR / Cheque # *"
                value={settlementForm.referenceNo}
                onChange={e => setSettlementForm({ ...settlementForm, referenceNo: e.target.value })}
                placeholder="e.g. UTR-99882244"
                required
              />
              <Input
                label="Notes / Remarks"
                value={settlementForm.notes}
                onChange={e => setSettlementForm({ ...settlementForm, notes: e.target.value })}
                placeholder="e.g. Part payment against invoice"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <Button type="submit" variant="primary" icon={CheckCircle2} size="sm">
                Record Payment & Settle Balance
              </Button>
            </div>
          </form>

          {/* Credit Statement History */}
          <div>
            <strong style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>
              Recent Credit Ledger Transactions ({settlementLedger.length})
            </strong>
            {settlementLedger.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No credit transactions on record. When invoices are billed on credit, they will appear here.
              </p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-medium)', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-app)', textAlign: 'left', borderBottom: '1px solid var(--border-medium)' }}>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Type</th>
                      <th style={{ padding: '8px' }}>Amount</th>
                      <th style={{ padding: '8px' }}>Balance After</th>
                      <th style={{ padding: '8px' }}>Ref #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementLedger.map((tx, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px' }}>{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '8px', fontWeight: 600, color: tx.type === 'DEBIT_INVOICE' ? '#EF4444' : '#22C55E' }}>
                          {tx.type === 'DEBIT_INVOICE' ? 'Debit (Credit Sale)' : 'Credit (Settlement)'}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>₹{parseFloat(tx.amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px' }}>₹{parseFloat(tx.balance_after).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{tx.reference_no || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* KYC REVIEW & EDIT PARTNER MODAL */}
      <Modal
        isOpen={isKycModalOpen}
        onClose={() => {
          setIsKycModalOpen(false);
          setEditErrors({});
        }}
        title={`Edit Partner Details: ${editForm.companyName || 'Distributor'}`}
      >
        <form noValidate onSubmit={handleSaveDistributorEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enterprise Name *</label>
            <Input
              value={editForm.companyName}
              onChange={e => {
                setEditForm({ ...editForm, companyName: e.target.value });
                if (editErrors.companyName) setEditErrors(prev => ({ ...prev, companyName: null }));
              }}
              onBlur={() => setEditErrors(prev => ({ ...prev, companyName: validateEnterprise(editForm.companyName) }))}
              placeholder="e.g. Kalinga Express Heavy Haulers"
              error={editErrors.companyName}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Contact Person Name *</label>
              <Input
                value={editForm.contactPerson}
                onChange={e => {
                  setEditForm({ ...editForm, contactPerson: e.target.value });
                  if (editErrors.contactPerson) setEditErrors(prev => ({ ...prev, contactPerson: null }));
                }}
                onBlur={() => setEditErrors(prev => ({ ...prev, contactPerson: validateContact(editForm.contactPerson) }))}
                placeholder="e.g. Subrat Das"
                error={editErrors.contactPerson}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Mobile Phone Number *</label>
              <Input
                value={editForm.phone}
                maxLength={10}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setEditForm({ ...editForm, phone: val });
                  if (editErrors.phone) setEditErrors(prev => ({ ...prev, phone: null }));
                }}
                onBlur={() => setEditErrors(prev => ({ ...prev, phone: validatePhone(editForm.phone) }))}
                placeholder="10-digit mobile number"
                error={editErrors.phone}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Email Address (Login ID) *</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={e => {
                  setEditForm({ ...editForm, email: e.target.value });
                  if (editErrors.email) setEditErrors(prev => ({ ...prev, email: null }));
                }}
                onBlur={() => setEditErrors(prev => ({ ...prev, email: validateEmail(editForm.email) }))}
                placeholder="distributor@domain.com"
                error={editErrors.email}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>GSTIN Number *</label>
              <Input
                value={editForm.gstin}
                maxLength={15}
                onChange={e => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                  setEditForm({ ...editForm, gstin: val });
                  if (editErrors.gstin) setEditErrors(prev => ({ ...prev, gstin: null }));
                }}
                onBlur={() => setEditErrors(prev => ({ ...prev, gstin: validateGSTIN(editForm.gstin) }))}
                placeholder="15-character GSTIN (e.g. 21AABCU9603R1ZM)"
                error={editErrors.gstin}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>State *</label>
              <Select
                value={editForm.state}
                onChange={e => {
                  const newState = e.target.value;
                  const firstCity = (databaseTerritories[newState] || [])[0];
                  const defaultCity = typeof firstCity === 'string' ? firstCity : (firstCity?.city || '');
                  setEditForm({ ...editForm, state: newState, city: defaultCity, customState: '', customCity: '' });
                  if (editErrors.state) setEditErrors(prev => ({ ...prev, state: null }));
                }}
                options={stateOptions}
                error={editErrors.state}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>City / Territory *</label>
              <Select
                value={editForm.city}
                onChange={e => {
                  setEditForm({ ...editForm, city: e.target.value });
                  if (editErrors.city) setEditErrors(prev => ({ ...prev, city: null }));
                }}
                options={getCityOptions(editForm.state, editForm.city)}
                disabled={!editForm.state || editForm.state === 'Other'}
                error={editErrors.city}
              />
            </div>
          </div>

          {editForm.state === 'Other' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New State Name *</label>
                <Input
                  value={editForm.customState}
                  onChange={e => setEditForm({ ...editForm, customState: e.target.value })}
                  placeholder="e.g. Telangana, Maharashtra"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter City Name for this State *</label>
                <Input
                  value={editForm.customCity}
                  onChange={e => setEditForm({ ...editForm, customCity: e.target.value })}
                  placeholder="e.g. Hyderabad, Mumbai"
                />
              </div>
            </div>
          )}

          {editForm.state !== 'Other' && editForm.city === 'Other' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New City to Add to {editForm.state} *</label>
              <Input
                value={editForm.customCity}
                onChange={e => setEditForm({ ...editForm, customCity: e.target.value })}
                placeholder={`Enter new city in ${editForm.state}`}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Credit Limit (₹) *</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[250000, 500000, 750000, 1000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setEditForm(prev => ({ ...prev, creditLimit: amt }));
                        if (editErrors.creditLimit) setEditErrors(prev => ({ ...prev, creditLimit: null }));
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: Number(editForm.creditLimit) === amt ? 'rgba(0, 143, 224, 0.15)' : 'var(--bg-app)',
                        color: Number(editForm.creditLimit) === amt ? 'var(--brand-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt / 100000}L
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                min="0"
                step="10000"
                value={editForm.creditLimit}
                onChange={e => {
                  setEditForm({ ...editForm, creditLimit: e.target.value });
                  if (editErrors.creditLimit) setEditErrors(prev => ({ ...prev, creditLimit: null }));
                }}
                onBlur={() => setEditErrors(prev => ({ ...prev, creditLimit: validateCreditLimit(editForm.creditLimit) }))}
                placeholder="e.g. 500000"
                error={editErrors.creditLimit}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>KYC & Account Status *</label>
              <Select
                value={editForm.accountStatus}
                onChange={e => setEditForm({ ...editForm, accountStatus: e.target.value })}
                options={[
                  { value: 'APPROVED', label: 'APPROVED (Active Partner)' },
                  { value: 'PENDING_REVIEW', label: 'PENDING_REVIEW (Awaiting KYC)' },
                  { value: 'SUSPENDED', label: 'SUSPENDED (Credit Hold)' },
                  { value: 'REJECTED', label: 'REJECTED (Denied)' }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid var(--border-medium)', paddingTop: '14px' }}>
            <Button
              type="button"
              variant="ghost"
              style={{ color: 'var(--status-danger)' }}
              icon={XCircle}
              onClick={handleRejectDistributor}
            >
              Reject Account
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsKycModalOpen(false);
                  setEditErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={CheckCircle2}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* CREATE DISTRIBUTOR ACCOUNT MODAL */}
      <Modal
        isOpen={isCreateDistributorModalOpen}
        onClose={() => {
          setIsCreateDistributorModalOpen(false);
          setNewDistErrors({});
        }}
        title="Directly Create & Onboard Distributor Account"
      >
        <form noValidate onSubmit={handleCreateDistributorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enterprise Name *</label>
            <Input 
              value={newDistForm.companyName} 
              onChange={e => {
                setNewDistForm({ ...newDistForm, companyName: e.target.value });
                if (newDistErrors.companyName) setNewDistErrors(prev => ({ ...prev, companyName: null }));
              }} 
              onBlur={() => setNewDistErrors(prev => ({ ...prev, companyName: validateEnterprise(newDistForm.companyName) }))}
              placeholder="e.g. Kalinga Express Heavy Haulers" 
              error={newDistErrors.companyName}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Contact Person *</label>
              <Input 
                value={newDistForm.contactPerson} 
                onChange={e => {
                  setNewDistForm({ ...newDistForm, contactPerson: e.target.value });
                  if (newDistErrors.contactPerson) setNewDistErrors(prev => ({ ...prev, contactPerson: null }));
                }} 
                onBlur={() => setNewDistErrors(prev => ({ ...prev, contactPerson: validateContact(newDistForm.contactPerson) }))}
                placeholder="e.g. Subrat Das" 
                error={newDistErrors.contactPerson}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Mobile Number *</label>
              <Input 
                value={newDistForm.phone} 
                maxLength={10}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewDistForm({ ...newDistForm, phone: val });
                  if (newDistErrors.phone) setNewDistErrors(prev => ({ ...prev, phone: null }));
                }} 
                onBlur={() => setNewDistErrors(prev => ({ ...prev, phone: validatePhone(newDistForm.phone) }))}
                placeholder="10-digit mobile number" 
                error={newDistErrors.phone}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Email Address (Login ID) *</label>
              <Input 
                type="email" 
                value={newDistForm.email} 
                onChange={e => {
                  setNewDistForm({ ...newDistForm, email: e.target.value });
                  if (newDistErrors.email) setNewDistErrors(prev => ({ ...prev, email: null }));
                }} 
                onBlur={() => setNewDistErrors(prev => ({ ...prev, email: validateEmail(newDistForm.email) }))}
                placeholder="distributor@domain.com" 
                error={newDistErrors.email}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>GSTIN Number *</label>
              <Input 
                value={newDistForm.gstin} 
                maxLength={15}
                onChange={e => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                  setNewDistForm({ ...newDistForm, gstin: val });
                  if (newDistErrors.gstin) setNewDistErrors(prev => ({ ...prev, gstin: null }));
                }} 
                onBlur={() => setNewDistErrors(prev => ({ ...prev, gstin: validateGSTIN(newDistForm.gstin) }))}
                placeholder="15-character GSTIN (e.g. 21AABCU9603R1ZM)" 
                error={newDistErrors.gstin}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>State *</label>
              <Select
                value={newDistForm.state}
                onChange={e => {
                  const newState = e.target.value;
                  const firstCity = (databaseTerritories[newState] || [])[0];
                  const defaultCity = typeof firstCity === 'string' ? firstCity : (firstCity?.city || '');
                  setNewDistForm({ ...newDistForm, state: newState, city: defaultCity, customState: '', customCity: '' });
                  if (newDistErrors.state) setNewDistErrors(prev => ({ ...prev, state: null }));
                }}
                options={stateOptions}
                error={newDistErrors.state}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>City / Territory *</label>
              <Select
                value={newDistForm.city}
                onChange={e => {
                  setNewDistForm({ ...newDistForm, city: e.target.value });
                  if (newDistErrors.city) setNewDistErrors(prev => ({ ...prev, city: null }));
                }}
                options={getCityOptions(newDistForm.state, newDistForm.city)}
                disabled={!newDistForm.state || newDistForm.state === 'Other'}
                error={newDistErrors.city}
              />
            </div>
          </div>

          {newDistForm.state === 'Other' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New State Name *</label>
                <Input
                  value={newDistForm.customState}
                  onChange={e => setNewDistForm({ ...newDistForm, customState: e.target.value })}
                  placeholder="e.g. Telangana, Maharashtra"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter City Name for this State *</label>
                <Input
                  value={newDistForm.customCity}
                  onChange={e => setNewDistForm({ ...newDistForm, customCity: e.target.value })}
                  placeholder="e.g. Hyderabad, Mumbai"
                />
              </div>
            </div>
          )}

          {newDistForm.state !== 'Other' && newDistForm.city === 'Other' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New City to Add to {newDistForm.state} *</label>
              <Input
                value={newDistForm.customCity}
                onChange={e => setNewDistForm({ ...newDistForm, customCity: e.target.value })}
                placeholder={`Enter new city in ${newDistForm.state}`}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Credit Limit (₹) *</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[250000, 500000, 1000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setNewDistForm(prev => ({ ...prev, creditLimit: amt }));
                        if (newDistErrors.creditLimit) setNewDistErrors(prev => ({ ...prev, creditLimit: null }));
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: Number(newDistForm.creditLimit) === amt ? 'rgba(0, 143, 224, 0.15)' : 'var(--bg-app)',
                        color: Number(newDistForm.creditLimit) === amt ? 'var(--brand-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt / 100000}L
                    </button>
                  ))}
                </div>
              </div>
              <Input 
                type="number" 
                min="0" 
                step="10000" 
                value={newDistForm.creditLimit} 
                onChange={e => {
                  setNewDistForm({ ...newDistForm, creditLimit: e.target.value });
                  if (newDistErrors.creditLimit) setNewDistErrors(prev => ({ ...prev, creditLimit: null }));
                }} 
                onBlur={() => setNewDistErrors(prev => ({ ...prev, creditLimit: validateCreditLimit(newDistForm.creditLimit) }))}
                placeholder="e.g. 500000" 
                error={newDistErrors.creditLimit}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Portal Login Password</label>
              <Input type="password" value={newDistForm.password} onChange={e => setNewDistForm({ ...newDistForm, password: e.target.value })} placeholder="Set account password" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => {
              setIsCreateDistributorModalOpen(false);
              setNewDistErrors({});
            }}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>Create & Authorize Account</Button>
          </div>
        </form>
      </Modal>

      {/* MANAGE DATABASE TERRITORIES MODAL */}
      <Modal
        isOpen={isAddTerritoryModalOpen}
        onClose={() => setIsAddTerritoryModalOpen(false)}
        title="Manage Database States & Territories"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={handleAddNewTerritorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <strong style={{ fontSize: '13px' }}>Add New State / City to Database</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>State / Region Name *</label>
                <Input
                  value={territoryForm.state}
                  onChange={e => setTerritoryForm({ ...territoryForm, state: e.target.value })}
                  placeholder="e.g. Odisha, Gujarat, Punjab"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>City / Hub / Territory Name *</label>
                <Input
                  value={territoryForm.city}
                  onChange={e => setTerritoryForm({ ...territoryForm, city: e.target.value })}
                  placeholder="e.g. Angul, Vapi, Ludhiana"
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" icon={Plus} size="sm">
                Save Territory to Database
              </Button>
            </div>
          </form>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
              Currently Stored States ({Object.keys(databaseTerritories).length} States Active in DB):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
              {Object.keys(databaseTerritories).sort().map(stateName => (
                <div
                  key={stateName}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MapPin size={10} color="var(--brand-blue)" />
                  <strong>{stateName}</strong>: {(databaseTerritories[stateName] || []).length} cities
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsAddTerritoryModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
