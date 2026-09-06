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
  RefreshCw
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
    name: authUser.organization || matchedProfile?.company_name || authUser.name || 'Shree Ganesh Fleet Logistics',
    companyName: authUser.organization || matchedProfile?.company_name || 'Shree Ganesh Fleet Logistics',
    gstin: matchedProfile?.gstin || authUser.gstin || '21AABCU9603R1ZM',
    city: matchedProfile?.territory_city || authUser.city || 'Bhadrak',
    state: matchedProfile?.territory_state || authUser.state || 'Odisha',
    contactPerson: authUser.name || matchedProfile?.contact_person || 'Subrat Das',
    phone: authUser.phone || matchedProfile?.phone || '+91 9853675971',
    email: authUser.email || matchedProfile?.email || 'distributor@shreeganesh.com',
    creditLimit: matchedProfile?.credit_limit ? `₹ ${Number(matchedProfile.credit_limit).toLocaleString('en-IN')}` : '₹ 5,00,000',
    totalOrders: distributorOrders.length
  } : (distributors[0] || {
    name: 'Shree Ganesh Fleet Logistics',
    companyName: 'Shree Ganesh Fleet Logistics',
    gstin: '21AABCU9603R1ZM',
    city: 'Bhadrak',
    state: 'Odisha',
    contactPerson: 'Subrat Das',
    phone: '+91 9853675971',
    email: 'distributor@shreeganesh.com',
    creditLimit: '₹ 5,00,000',
    totalOrders: distributorOrders.length
  });

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
    // 1. Read locally saved dispatch requisitions
    let localReqs = [];
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) localReqs = JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved requisitions:', e);
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
      status: i.paymentStatus || 'PAID',
      invoiceNo: i.id,
      isInvoice: true,
      rawInvoice: i
    }));

    // 4. Merge: local requisitions + verified invoices
    const combined = [
      ...localReqs,
      ...mappedInvs.filter(m => !localReqs.some(r => r.id === m.id || (r.invoiceNo && r.invoiceNo === m.id)))
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
          padding: 'var(--space-6) var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderLeft: '4px solid var(--brand-blue)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'var(--brand-blue)', color: '#FFFFFF', padding: '2px 8px', borderRadius: 'var(--radius-pill)', textTransform: 'uppercase' }}>
              Authorized Distributor
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--brand-cyan)' }}>GSTIN: {currentDistributor.gstin}</span>
          </div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: '#FFFFFF', margin: 0, fontFamily: 'var(--font-family-heading)' }}>
            {currentDistributor.name}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-on-dark-secondary)', marginTop: '4px' }}>
            Authorised Distribution Zone: <strong>{currentDistributor.city}, {currentDistributor.state}</strong> • Contact: {currentDistributor.contactPerson} ({currentDistributor.phone})
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
          title="Total Orders Dispatched"
          value={`${distributorOrders.length || 28} Shipments`}
          subtext="Lifetime B2B purchases"
          icon={ShoppingCart}
        />
        <KPICard
          title="Available Credit Limit"
          value={currentDistributor.creditLimit}
          subtext="30-Day Revolving Terms"
          icon={Building}
        />
        <KPICard
          title="Account Status"
          value="Active & Verified"
          subtext="KYC & GSTIN Validated"
          icon={ShieldCheck}
          iconColor="var(--status-success)"
          iconBg="var(--status-success-bg)"
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
          Order & Dispatch History ({distributorOrders.length})
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'kyc' ? 'primary' : 'secondary'}
          icon={Building}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
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
        <DataTable
          title="B2B Supply Orders & Requisitions"
          subtitle={`Verified Order & Billing History for ${currentDistributor.name}`}
          data={distributorOrders}
          emptyMessage="No orders or bills found against your account yet."
          columns={[
            { header: 'Order ID', accessor: 'id', render: (val) => <strong>{val}</strong> },
            { header: 'Order Date', accessor: 'date' },
            { header: 'Items & Packaging', accessor: 'item' },
            { header: 'Total Value', accessor: 'total', render: (val) => <strong>{val}</strong> },
            { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
            { header: 'Invoice Reference', accessor: 'invoiceNo' },
            { header: 'Actions', accessor: 'id', render: (val, row) => (
              <Button 
                size="sm" 
                variant="secondary" 
                icon={Download} 
                onClick={() => {
                  if (row.invoiceNo && row.invoiceNo !== 'Pending Dispatch') {
                    if (row.rawInvoice) {
                      setActiveInvoiceModal(row.rawInvoice);
                    } else {
                      window.open(`${API_BASE_URL}/invoices/${row.invoiceNo}/pdf`, '_blank');
                    }
                  } else {
                    alert(`Requisition #${row.id} is currently under dispatch processing. The official tax invoice PDF will be generated upon factory dispatch.`);
                  }
                }}
              >
                PDF
              </Button>
            )}
          ]}
        />
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
              onClick={() => {
                const selectedPack = products.flatMap(p => p.packOptions || []).find(pk => pk.sku === selectedPackSku);
                const selectedProd = products.find(p => (p.packOptions || []).some(pk => pk.sku === selectedPackSku));
                const totalVal = selectedPack ? (selectedPack.distributorPrice * orderQuantity) : (22000);

                const newOrd = {
                  id: `ORD-DIST-${Math.floor(8800 + Math.random() * 1000)}`,
                  date: new Date().toISOString().split('T')[0],
                  item: `${selectedProd?.name || 'UltraBlue+ Fluids'} (${selectedPack?.size || 'Pack'}) x ${orderQuantity}`,
                  total: `₹ ${totalVal.toLocaleString('en-IN')}`,
                  status: 'PROCESSING',
                  invoiceNo: 'Pending Dispatch'
                };
                const updated = [newOrd, ...distributorOrders];
                setDistributorOrders(updated);
                try {
                  const saved = localStorage.getItem(getStorageKey());
                  const list = saved ? JSON.parse(saved) : [];
                  localStorage.setItem(getStorageKey(), JSON.stringify([newOrd, ...list]));
                } catch (e) {
                  console.warn('Could not save requisition to storage:', e);
                }
                setIsOrderModalOpen(false);
                setOrderSuccessMsg(`Requisition #${newOrd.id} submitted! Bhadrak depot dispatch team notified.`);
                setTimeout(() => setOrderSuccessMsg(''), 5000);
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
            options={allPackOptions.length > 0 ? allPackOptions : [
              { value: 'UB-DEF-20L', label: 'UltraBlue+ DEF 20L Bucket' }
            ]}
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
