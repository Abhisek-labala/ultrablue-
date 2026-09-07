import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Download, 
  FileText, 
  ShoppingCart, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Plus, 
  Calculator,
  Layers,
  ArrowUpRight,
  UserPlus,
  Package,
  FileCheck2,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { KPICard } from '../components/ui/KPICard';
import { ProductCard } from '../components/ui/ProductCard';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { 
  DistributorAPI, 
  DistributorOrderAPI,
  SalesAPI, 
  InventoryAPI, 
  ProductAPI,
  exportToCSV,
  API_BASE_URL
} from '../services/api';

export const DistributorPortal = ({ authUser, activeTab: externalTab, onTabChange }) => {
  const [distributors, setDistributors] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentTab, setCurrentTab] = useState(() => {
    if (externalTab === 'dist_orders') return 'orders';
    if (externalTab === 'dist_pricelist') return 'pricelist';
    if (externalTab === 'dist_kyc') return 'kyc';
    if (externalTab === 'dist_dashboard') return 'dashboard';
    return 'catalog';
  });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [activeInvoiceModal, setActiveInvoiceModal] = useState(null);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [selectedPackSku, setSelectedPackSku] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(20);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  // Sign-up Form State
  const [signupForm, setSignupForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    gstin: ''
  });

  const [distributorOrders, setDistributorOrders] = useState([]);

  // Derive current distributor details from authUser and distributor_profiles
  const matchedProfile = (distributors || []).find(d => 
    (d.email && authUser?.email && d.email.toLowerCase() === authUser.email.toLowerCase()) ||
    (d.phone && authUser?.phone && d.phone.replace(/\D/g, '').slice(-10) === authUser.phone.replace(/\D/g, '').slice(-10)) ||
    (d.company_name && authUser?.organization && d.company_name.toLowerCase() === authUser.organization.toLowerCase())
  );

  const currentDistributor = (authUser && authUser.role === 'distributor') ? {
    id: matchedProfile?.id || null,
    name: authUser.organization || matchedProfile?.company_name || authUser.name || 'Authorized Distributor',
    companyName: authUser.organization || matchedProfile?.company_name || authUser.name || 'Authorized Distributor',
    gstin: matchedProfile?.gstin || authUser.gstin || '',
    city: matchedProfile?.territory_city || authUser.city || '',
    state: matchedProfile?.territory_state || authUser.state || '',
    contactPerson: authUser.name || matchedProfile?.contact_person || '',
    phone: authUser.phone || matchedProfile?.phone || '',
    email: authUser.email || matchedProfile?.email || '',
    creditLimit: matchedProfile?.creditLimit || (matchedProfile?.credit_limit ? `₹ ${Number(matchedProfile.credit_limit).toLocaleString('en-IN')}` : '₹ 0'),
    rawCreditLimit: matchedProfile?.rawCreditLimit || (matchedProfile?.credit_limit ? Number(matchedProfile.credit_limit) : 0),
    outstandingCredit: matchedProfile?.outstandingCredit || '₹ 0',
    rawOutstandingCredit: matchedProfile?.rawOutstandingCredit || 0,
    availableCredit: matchedProfile?.availableCredit || '₹ 0',
    rawAvailableCredit: matchedProfile?.rawAvailableCredit || 0,
    totalOrders: distributorOrders.length
  } : (distributors[0] ? {
    ...distributors[0],
    name: distributors[0].companyName || distributors[0].company_name || distributors[0].name || '',
    companyName: distributors[0].companyName || distributors[0].company_name || distributors[0].name || '',
    gstin: distributors[0].gstin || '',
    city: distributors[0].city || distributors[0].territory_city || '',
    state: distributors[0].state || distributors[0].territory_state || '',
    contactPerson: distributors[0].contactPerson || distributors[0].contact_person || '',
    phone: distributors[0].phone || '',
    email: distributors[0].email || '',
    creditLimit: distributors[0].creditLimit || (distributors[0].credit_limit ? `₹ ${Number(distributors[0].credit_limit).toLocaleString('en-IN')}` : '₹ 0'),
    rawCreditLimit: distributors[0].rawCreditLimit || (distributors[0].credit_limit ? Number(distributors[0].credit_limit) : 0),
    outstandingCredit: distributors[0].outstandingCredit || '₹ 0',
    rawOutstandingCredit: distributors[0].rawOutstandingCredit || 0,
    availableCredit: distributors[0].availableCredit || '₹ 0',
    rawAvailableCredit: distributors[0].rawAvailableCredit || 0,
    totalOrders: distributorOrders.length
  } : {
    id: null,
    name: 'Authorized Distributor',
    companyName: 'Authorized Distributor',
    gstin: '',
    city: '',
    state: '',
    contactPerson: '',
    phone: '',
    email: '',
    creditLimit: '₹ 0',
    rawCreditLimit: 0,
    outstandingCredit: '₹ 0',
    rawOutstandingCredit: 0,
    availableCredit: '₹ 0',
    rawAvailableCredit: 0,
    totalOrders: distributorOrders.length
  });

  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadCreditLedger = async () => {
    const distId = currentDistributor.id || distributors[0]?.id;
    if (!distId) return;
    setLedgerLoading(true);
    try {
      const res = await DistributorOrderAPI.getCreditLedger(distId);
      if (res && res.transactions) {
        setLedgerTransactions(res.transactions);
      }
    } catch (e) {
      console.warn('Error fetching credit ledger:', e);
    } finally {
      setLedgerLoading(false);
    }
  };

  const getStorageKey = () => {
    const raw = (currentDistributor.phone || authUser?.phone || '').replace(/\D/g, '').slice(-10);
    return `ub_dist_orders_${raw || 'default'}`;
  };

  // Helper to determine if an invoice strictly belongs to this distributor
  const isInvoiceForMe = (inv) => {
    if (!inv) return false;
    const normDigits = (v) => (v || '').replace(/\D/g, '');
    const normStr = (v) => (v || '').trim().toLowerCase();

    const invPhone = normDigits(inv.customerPhone);
    const myPhone = normDigits(currentDistributor.phone);

    // 1. Phone match (last 10 digits)
    if (myPhone.length >= 10 && invPhone.length >= 10) {
      if (invPhone.slice(-10) === myPhone.slice(-10)) return true;
    }

    const invCust = normStr(inv.customerName);
    const myCompany = normStr(currentDistributor.companyName || currentDistributor.name);
    const myContact = normStr(currentDistributor.contactPerson);

    // 2. Company / Firm name match
    if (myCompany && myCompany.length >= 3) {
      if (invCust.includes(myCompany) || myCompany.includes(invCust)) return true;
    }

    // 3. Contact person name match
    if (myContact && myContact.length >= 3) {
      if (invCust.includes(myContact) || myContact.includes(invCust)) return true;
    }

    return false;
  };

  const fetchMyOrders = async () => {
    // 1. Fetch real B2B database orders
    let dbOrders = [];
    try {
      dbOrders = await DistributorOrderAPI.getAll({ phone: currentDistributor.phone });
    } catch (e) {
      console.warn('Could not fetch distributor orders:', e);
    }

    // 2. Fetch invoices specifically for this distributor
    const distParams = {
      distributorPhone: currentDistributor.phone,
      distributorCompany: currentDistributor.companyName || currentDistributor.name,
      distributorName: currentDistributor.contactPerson
    };
    const invs = await SalesAPI.getAllInvoices(distParams).catch(() => []);

    // 3. Strict filter so no other company's invoice leaks through
    const myInvs = (invs || []).filter(isInvoiceForMe);
    const mappedInvs = myInvs.map(i => ({
      id: i.id,
      date: i.date,
      item: i.items?.map(it => `${it.name} x ${it.qty}`).join(', ') || 'Wholesale DEF Order',
      total: `₹ ${i.grandTotal?.toLocaleString('en-IN')}`,
      status: i.paymentStatus === 'ON_CREDIT' ? 'BILLED (ON CREDIT)' : (i.paymentStatus === 'PART_CREDIT' ? 'BILLED (PART CREDIT)' : (i.paymentStatus || 'PAID')),
      rawStatus: 'CONVERTED_TO_INVOICE',
      invoiceNo: i.id,
      isInvoice: true,
      rawInvoice: i
    }));

    const mappedDbOrders = (dbOrders || []).map(o => {
      let displayStatus = 'PENDING ADMIN APPROVAL';
      if (o.status === 'APPROVED') displayStatus = 'APPROVED (READY FOR BILLING)';
      else if (o.status === 'CONVERTED_TO_INVOICE') displayStatus = 'BILLED & DISPATCHED';
      else if (o.status === 'REJECTED') displayStatus = 'REJECTED BY ADMIN';

      return {
        id: o.orderNumber || o.id,
        rawOrderId: o.id,
        date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''),
        item: o.items?.map(it => `${it.productName} (${it.packSize}) x ${it.quantity}`).join(', ') || 'Wholesale DEF Order',
        total: `₹ ${o.totalEstimatedValue?.toLocaleString('en-IN')}`,
        status: displayStatus,
        rawStatus: o.status,
        invoiceNo: o.invoiceNumber || (o.status === 'CONVERTED_TO_INVOICE' ? 'Billed' : 'Pending Billing'),
        isInvoice: Boolean(o.invoiceId || o.invoiceNumber),
        invoiceId: o.invoiceId,
        adminNotes: o.adminNotes,
        rawInvoice: myInvs.find(inv => inv.id === o.invoiceId || inv.id === o.invoiceNumber)
      };
    });

    // 4. Merge: DB orders + verified invoices
    const combined = [
      ...mappedDbOrders,
      ...mappedInvs.filter(m => !mappedDbOrders.some(r => r.id === m.id || r.invoiceNo === m.id || r.invoiceId === m.id))
    ];

    setDistributorOrders(combined);
  };

  // Sync external tab prop from sidebar
  useEffect(() => {
    if (externalTab) {
      if (externalTab === 'dist_orders') setCurrentTab('orders');
      else if (externalTab === 'dist_pricelist') setCurrentTab('pricelist');
      else if (externalTab === 'dist_kyc') setCurrentTab('kyc');
      else if (externalTab === 'dist_dashboard') setCurrentTab('dashboard');
      else setCurrentTab('catalog');
    }
  }, [externalTab]);

  const handleTabSwitch = (tabId) => {
    setCurrentTab(tabId);
    if (onTabChange) {
      if (tabId === 'orders') onTabChange('dist_orders');
      else if (tabId === 'pricelist') onTabChange('dist_pricelist');
      else if (tabId === 'kyc') onTabChange('dist_kyc');
      else if (tabId === 'dashboard') onTabChange('dist_dashboard');
      else onTabChange('dist_catalog');
    }
  };

  const loadData = async () => {
    try {
      if (currentTab === 'catalog' || currentTab === 'pricelist') {
        const prods = await ProductAPI.getAll().catch(() => []);
        setProducts(prods || []);
      } else if (currentTab === 'orders') {
        await fetchMyOrders();
      } else if (currentTab === 'kyc') {
        const distData = await DistributorAPI.getAll().catch(() => []);
        setDistributors(distData || []);
      } else {
        // dashboard
        const [distData, prods] = await Promise.all([
          DistributorAPI.getAll().catch(() => []),
          ProductAPI.getAll().catch(() => [])
        ]);
        setDistributors(distData || []);
        setProducts(prods || []);
        await fetchMyOrders();
      }
    } catch (e) {
      console.error('Error fetching distributor portal data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTab, authUser]);

  const handleOrderClick = (product, pack) => {
    setSelectedProductForOrder({ product, pack });
    setSelectedPackSku(pack ? pack.sku : (product.packOptions?.[0]?.sku || ''));
    setIsOrderModalOpen(true);
  };

  const handleDownloadPriceList = () => {
    const priceListData = products.flatMap(prod => 
      (prod.packOptions || []).map(pack => ({
        Product: prod.name,
        Category: prod.category,
        Pack_Size: pack.size,
        SKU: pack.sku,
        Standard_MRP_INR: pack.mrp,
        Distributor_Base_Price_INR: pack.distributorPrice,
        GST_Rate: `${prod.gstRate || 18}% (${prod.isGstInclusive !== false ? 'Inclusive' : 'Exclusive'})`
      }))
    );
    exportToCSV('UltraBlue_Distributor_PriceList', priceListData);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await DistributorAPI.register(signupForm);
      setIsSignupModalOpen(false);
      setOrderSuccessMsg(`KYC submitted for ${signupForm.companyName}! Saved to Laravel database for review.`);
      setSignupForm({ companyName: '', contactPerson: '', phone: '', email: '', city: '', gstin: '' });
      loadData();
      setTimeout(() => setOrderSuccessMsg(''), 6000);
    } catch (err) {
      setOrderSuccessMsg(err.message || 'Registration error.');
    }
  };

  // Product Pack options list for Order Modal
  const allPackOptions = products.flatMap(p => 
    (p.packOptions || []).map(pk => ({
      value: pk.sku,
      label: `${p.name} (${pk.size}) — Wholesale ₹ ${pk.distributorPrice} (MRP ₹ ${pk.mrp})`
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Distributor Welcome Banner */}
      <div 
        className="ub-card"
        style={{
          background: 'linear-gradient(135deg, var(--brand-navy-primary) 0%, var(--brand-navy-surface) 100%)',
          color: '#FFFFFF',
          padding: 'var(--space-5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderLeft: '4px solid var(--brand-blue)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'var(--brand-blue)', color: '#FFFFFF', padding: '2px 8px', borderRadius: 'var(--radius-pill)', textTransform: 'uppercase' }}>
              Authorized Distributor
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--brand-cyan)' }}>GSTIN: {currentDistributor.gstin}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', color: '#FFFFFF', margin: 0, fontFamily: 'var(--font-family-heading)' }}>
            {currentDistributor.name}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-on-dark-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            Authorised Distribution Zone: <strong>{currentDistributor.city}, {currentDistributor.state}</strong> • Contact: {currentDistributor.contactPerson} ({currentDistributor.phone})
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={Download} onClick={handleDownloadPriceList}>
            Download B2B Price List
          </Button>
          <Button variant="secondary" icon={UserPlus} onClick={() => setIsSignupModalOpen(true)}>
            New Distributor Sign-up
          </Button>
        </div>
      </div>

      {orderSuccessMsg && (
        <div style={{ backgroundColor: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', color: 'var(--status-success-text)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          {orderSuccessMsg}
        </div>
      )}

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard
          title="Wholesale Pricing"
          value="B2B Base Rates"
          subtext="Applied automatically at checkout"
          icon={Sparkles}
        />
        <KPICard
          title="Orders & Requisitions"
          value={`${distributorOrders.length} Records`}
          subtext="Lifetime B2B purchases"
          icon={ShoppingCart}
        />
        <KPICard
          title="Available Credit Limit"
          value={currentDistributor.availableCredit}
          subtext={`Credit Limit: ${currentDistributor.creditLimit}`}
          icon={Building}
          iconColor="var(--brand-cyan)"
        />
        <KPICard
          title="Outstanding Credit Debt"
          value={currentDistributor.outstandingCredit}
          subtext="30-Day Revolving Terms"
          icon={CreditCard}
          iconColor={currentDistributor.rawOutstandingCredit > 0 ? "var(--status-danger)" : "var(--status-success)"}
        />
      </div>

      {/* Navigation Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <Button
          size="sm"
          variant={currentTab === 'catalog' ? 'primary' : 'secondary'}
          icon={Layers}
          onClick={() => handleTabSwitch('catalog')}
        >
          Wholesale Product Catalogue
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'pricelist' ? 'primary' : 'secondary'}
          icon={FileCheck2}
          onClick={() => handleTabSwitch('pricelist')}
        >
          Price List Matrix
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'orders' ? 'primary' : 'secondary'}
          icon={FileText}
          onClick={() => handleTabSwitch('orders')}
        >
          Order & Requisition History ({distributorOrders.length})
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'ledger' ? 'primary' : 'secondary'}
          icon={CreditCard}
          onClick={() => {
            handleTabSwitch('ledger');
            loadCreditLedger();
          }}
        >
          Credit Ledger & Statement
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'kyc' ? 'primary' : 'secondary'}
          icon={ShieldCheck}
          onClick={() => handleTabSwitch('kyc')}
        >
          Distributor Profile & KYC
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* Tab 1: Wholesale Product Catalogue */}
      {/* ========================================================================= */}
      {currentTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Showing wholesale distributor pricing exclusively for authorized distributors. Product-specific GST is calculated at checkout.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-6)' }}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isDistributorView={true}
                onOrderClick={handleOrderClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 2: Live Price List Matrix */}
      {/* ========================================================================= */}
      {currentTab === 'pricelist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--brand-navy-primary)' }}>
              Authorized B2B Wholesale Price Schedule
            </h3>
            <Button size="sm" variant="gold" icon={Download} onClick={handleDownloadPriceList}>
              Export Price Schedule (CSV)
            </Button>
          </div>

          <DataTable
            title="Complete Live SKU Matrix"
            data={products.flatMap(prod => 
              (prod.packOptions || []).map(pack => ({
                product: prod.name,
                category: prod.category,
                sku: pack.sku,
                size: pack.size,
                mrp: pack.mrp,
                distPrice: pack.distributorPrice,
                gst: `${prod.gstRate || 18}% (${prod.isGstInclusive !== false ? 'Incl.' : 'Excl.'})`
              }))
            )}
            columns={[
              { header: 'Product Name', accessor: 'product', render: (val, row) => <div><strong>{val}</strong><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.category}</div></div> },
              { header: 'SKU Code', accessor: 'sku' },
              { header: 'Pack Size', accessor: 'size' },
              { header: 'Standard MRP', accessor: 'mrp', render: (val) => `₹ ${val?.toLocaleString('en-IN')}` },
              { header: 'Distributor Rate', accessor: 'distPrice', render: (val) => <strong style={{ color: 'var(--brand-blue)' }}>₹ {val?.toLocaleString('en-IN')}</strong> },
              { header: 'Applicable GST', accessor: 'gst' }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 3: Order History */}
      {/* ========================================================================= */}
      {currentTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>B2B Supply Orders & Plant Requisitions</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Track live approval from Plant Administration and dispatch billing status from Bhadrak Depot.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchMyOrders}>
                Refresh Orders
              </Button>
              <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsOrderModalOpen(true)}>
                Place Stock Requisition
              </Button>
            </div>
          </div>

          <DataTable
            data={distributorOrders}
            emptyMessage="No orders or requisitions found. Click 'Place Stock Requisition' to submit a wholesale purchase order."
            columns={[
              { 
                header: 'Requisition / Order ID', 
                accessor: 'id', 
                render: (val) => <strong style={{ color: 'var(--brand-blue)', fontFamily: 'monospace' }}>{val}</strong> 
              },
              { header: 'Order Date', accessor: 'date' },
              { 
                header: 'Items & Packaging', 
                accessor: 'item',
                render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>
              },
              { 
                header: 'Estimated Value', 
                accessor: 'total', 
                render: (val) => <strong style={{ color: 'var(--brand-blue)' }}>{val}</strong> 
              },
              { 
                header: 'Status', 
                accessor: 'status', 
                render: (val, row) => {
                  const s = row.rawStatus || val;
                  let bg = 'rgba(234, 179, 8, 0.15)';
                  let color = '#EAB308';
                  let border = 'rgba(234, 179, 8, 0.3)';
                  let label = val;

                  if (s === 'APPROVED') {
                    bg = 'rgba(6, 182, 212, 0.15)';
                    color = '#06B6D4';
                    border = 'rgba(6, 182, 212, 0.3)';
                    label = 'APPROVED (READY FOR BILLING)';
                  } else if (s === 'CONVERTED_TO_INVOICE' || s === 'PAID') {
                    bg = 'rgba(34, 197, 94, 0.15)';
                    color = '#22C55E';
                    border = 'rgba(34, 197, 94, 0.3)';
                    label = 'BILLED & DISPATCHED';
                  } else if (s === 'REJECTED') {
                    bg = 'rgba(239, 68, 68, 0.15)';
                    color = '#EF4444';
                    border = 'rgba(239, 68, 68, 0.3)';
                    label = 'REJECTED';
                  } else if (s === 'PENDING_ADMIN_APPROVAL') {
                    label = 'PENDING ADMIN APPROVAL';
                  }

                  return (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: bg,
                      color: color,
                      border: `1px solid ${border}`,
                      display: 'inline-block'
                    }}>
                      {label}
                    </span>
                  );
                } 
              },
              { 
                header: 'Invoice Reference', 
                accessor: 'invoiceNo',
                render: (val, row) => (
                  val && val !== 'Pending Billing' && val !== 'Pending Dispatch' ? (
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-navy-primary)' }}>
                      {val}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontStyle: 'italic' }}>
                      {row.rawStatus === 'APPROVED' ? 'Awaiting POS Bill' : 'Pending Approval'}
                    </span>
                  )
                )
              },
              { 
                header: 'Actions', 
                accessor: 'id', 
                render: (val, row) => (
                  <Button 
                    size="xs" 
                    variant={row.invoiceNo && row.invoiceNo !== 'Pending Billing' && row.invoiceNo !== 'Pending Dispatch' ? "primary" : "secondary"}
                    icon={Download} 
                    onClick={() => {
                      if (row.invoiceNo && row.invoiceNo !== 'Pending Billing' && row.invoiceNo !== 'Pending Dispatch') {
                        if (row.rawInvoice) {
                          setActiveInvoiceModal(row.rawInvoice);
                        } else {
                          window.open(`${API_BASE_URL}/invoices/${row.invoiceNo}/pdf`, '_blank');
                        }
                      } else {
                        alert(`Requisition #${row.id} status: ${row.status}. Tax invoice PDF will be available immediately after Sales Operator bills and dispatches the order.`);
                      }
                    }}
                  >
                    {row.invoiceNo && row.invoiceNo !== 'Pending Billing' && row.invoiceNo !== 'Pending Dispatch' ? "Tax Invoice PDF" : "View Details"}
                  </Button>
                )
              }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab: Credit Ledger & Statement */}
      {/* ========================================================================= */}
      {currentTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="var(--brand-blue)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Revolving Credit Account Statement & Ledger</h3>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Itemized transaction history of credit billing debits and payment settlements for {currentDistributor.name}.
              </p>
            </div>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={loadCreditLedger}>
              Refresh Statement
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <KPICard
              title="Approved Credit Limit"
              value={currentDistributor.creditLimit}
              subtext="30-Day Revolving Terms"
              icon={Building}
            />
            <KPICard
              title="Total Outstanding Debt"
              value={currentDistributor.outstandingCredit}
              subtext="Payable to Ayush Green Energy"
              icon={CreditCard}
              iconColor={currentDistributor.rawOutstandingCredit > 0 ? "var(--status-danger)" : "var(--status-success)"}
            />
            <KPICard
              title="Current Available Credit"
              value={currentDistributor.availableCredit}
              subtext="Available for immediate orders"
              icon={ShieldCheck}
              iconColor="var(--status-success)"
            />
          </div>

          <DataTable
            title="Credit Ledger Transactions"
            data={ledgerTransactions}
            emptyMessage="No credit transactions recorded yet. Invoices billed on credit will automatically log here."
            columns={[
              {
                header: 'Date & Time',
                accessor: 'created_at',
                render: (val) => <span style={{ fontSize: '12px' }}>{val ? new Date(val).toLocaleString('en-IN') : '-'}</span>
              },
              {
                header: 'Transaction Type',
                accessor: 'type',
                render: (val) => (
                  val === 'DEBIT_INVOICE' ? (
                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                      DEBIT (Credit Purchase)
                    </span>
                  ) : (
                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
                      CREDIT (Payment Settlement)
                    </span>
                  )
                )
              },
              {
                header: 'Amount (₹)',
                accessor: 'amount',
                render: (val, row) => (
                  <strong style={{ color: row.type === 'DEBIT_INVOICE' ? '#EF4444' : '#22C55E' }}>
                    {row.type === 'DEBIT_INVOICE' ? '+ ' : '- '}₹ {parseFloat(val || 0).toLocaleString('en-IN')}
                  </strong>
                )
              },
              {
                header: 'Balance After (₹)',
                accessor: 'balance_after',
                render: (val) => <span>₹ {parseFloat(val || 0).toLocaleString('en-IN')}</span>
              },
              {
                header: 'Reference / Invoice #',
                accessor: 'reference_no',
                render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{val || '-'}</span>
              },
              {
                header: 'Payment Mode',
                accessor: 'payment_method',
                render: (val) => <span>{val || '-'}</span>
              },
              {
                header: 'Notes / Remarks',
                accessor: 'notes',
                render: (val) => <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{val || '-'}</span>
              }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 4: Distributor Profile & KYC */}
      {/* ========================================================================= */}
      {currentTab === 'kyc' && (
        <div className="ub-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: '16px' }}>
            Distributor Profile & Verified Commercial Credentials
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Company / Firm Name</span>
              <strong>{currentDistributor.name}</strong>
            </div>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>GSTIN Number</span>
              <strong>{currentDistributor.gstin}</strong>
            </div>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Primary Contact</span>
              <strong>{currentDistributor.contactPerson}</strong>
            </div>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Contact Phone</span>
              <strong>{currentDistributor.phone}</strong>
            </div>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Authorized Region</span>
              <strong>{currentDistributor.city}, {currentDistributor.state}</strong>
            </div>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Revolving Credit Term</span>
              <strong>{currentDistributor.creditLimit} (30 Days)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Place Stock Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Place Direct Distributor Stock Order"
        subtitle="Ayush Green Energy - Bhadrak Central Depot"
        icon={ShoppingCart}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOrderModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={async () => {
                const selectedPack = products.flatMap(p => p.packOptions || []).find(pk => pk.sku === selectedPackSku);
                const unitPrice = selectedPack ? parseFloat(selectedPack.distributorPrice || selectedPack.mrp || 0) : 0;
                const effectiveSku = selectedPackSku || (allPackOptions[0]?.value || '');

                if (!effectiveSku) {
                  alert('Please select a valid product pack size before submitting.');
                  return;
                }

                try {
                  const resp = await DistributorOrderAPI.create({
                    distributorName: currentDistributor.contactPerson,
                    distributorCompany: currentDistributor.companyName || currentDistributor.name,
                    distributorPhone: currentDistributor.phone,
                    distributorEmail: currentDistributor.email,
                    distributorGstin: currentDistributor.gstin,
                    deliveryCity: currentDistributor.city,
                    deliveryState: currentDistributor.state,
                    orderNotes: `Direct Requisition from Distributor Portal (${orderQuantity} units)`,
                    items: [
                      {
                        sku: effectiveSku,
                        quantity: orderQuantity,
                        unitPrice: unitPrice
                      }
                    ]
                  });

                  setIsOrderModalOpen(false);
                  setOrderSuccessMsg(`Requisition #${resp.order_number} submitted successfully! It has been routed to Admin for review & approval.`);
                  await fetchMyOrders();
                  setTimeout(() => setOrderSuccessMsg(''), 6000);
                } catch (err) {
                  alert(err.message || 'Failed to submit dispatch requisition.');
                }
              }}
            >
              Submit Dispatch Requisition
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label="Select Product Line & Packaging"
            value={selectedPackSku}
            onChange={(e) => setSelectedPackSku(e.target.value)}
            options={allPackOptions}
          />

          <Input
            label="Order Quantity (Units / Barrels / Buckets)"
            type="number"
            min="1"
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
          />
        </div>
      </Modal>

      {/* New Distributor Sign-up Modal */}
      <Modal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        title="Distributor Application & Onboarding"
        subtitle="Apply for UltraBlue+ Authorized Dealership"
        icon={UserPlus}
      >
        <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Enterprise / Firm Name *"
            placeholder="e.g. Kalinga Auto Spares LLP"
            value={signupForm.companyName}
            onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Contact Person Name *"
              placeholder="e.g. Biplab Mohanty"
              value={signupForm.contactPerson}
              onChange={(e) => setSignupForm({ ...signupForm, contactPerson: e.target.value })}
              required
            />
            <Input
              label="Phone Number *"
              placeholder="+91 94370 12345"
              value={signupForm.phone}
              onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Email Address *"
              type="email"
              placeholder="sales@kalingasparest.com"
              value={signupForm.email}
              onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
              required
            />
            <Input
              label="Distribution Territory / City *"
              placeholder="e.g. Sambalpur / Rourkela"
              value={signupForm.city}
              onChange={(e) => setSignupForm({ ...signupForm, city: e.target.value })}
              required
            />
          </div>
          <Input
            label="GSTIN Number *"
            placeholder="21AAAAA0000A1Z5"
            value={signupForm.gstin}
            onChange={(e) => setSignupForm({ ...signupForm, gstin: e.target.value })}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button type="button" variant="secondary" onClick={() => setIsSignupModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={CheckCircle2}>
              Submit Application to Database
            </Button>
          </div>
        </form>
      </Modal>

      {/* VERIFIED GST TAX INVOICE MODAL */}
      <InvoiceModal
        isOpen={Boolean(activeInvoiceModal)}
        onClose={() => setActiveInvoiceModal(null)}
        invoice={activeInvoiceModal}
      />
    </div>
  );
};
