import React, { useState, useEffect } from 'react';
import { 
  InventoryAPI, 
  ProductAPI, 
  DistributorAPI, 
  OperatorAPI, 
  SalesAPI, 
  InquiryAPI, 
  PromotionAPI,
  ReportAPI 
} from '../services/api';
import { Sparkles } from 'lucide-react';

// Dedicated Menu Components
import { AdminExecutiveOverview } from './admin/AdminExecutiveOverview';
import { AdminProductsView } from './admin/AdminProductsView';
import { AdminPricingEngineView } from './admin/AdminPricingEngineView';
import { AdminOffersView } from './admin/AdminOffersView';
import { AdminInventoryView } from './admin/AdminInventoryView';
import { AdminDistributorsView } from './admin/AdminDistributorsView';
import { AdminOperatorsView } from './admin/AdminOperatorsView';
import { AdminSalesInvoicesView } from './admin/AdminSalesInvoicesView';
import { AdminCustomerEnquiriesView } from './admin/AdminCustomerEnquiriesView';
import { AdminReportsAnalyticsView } from './admin/AdminReportsAnalyticsView';
import { AdminSettingsView } from './admin/AdminSettingsView';

const COMPANY_INFO = {
  name: 'AYUSH GREEN ENERGY',
  tagline: 'Leading Manufacturer & Dispenser of UltraBlue+ AUS 32 DEF & Industrial Clean Fluids',
  plantAddress: 'At- Charampa, Dist- Bhadrak, Odisha, Pin- 756101',
  salesHotline: '+91 8328826667 / +91 9853675971',
  email: 'info@ayushgreenenergy.com / support@ultrablueplus.com',
  gstin: '21AABCU9603R1ZM',
  cin: 'U23209OR2026PTC048912'
};

export const AdminDashboard = ({ authUser, activeTab = 'admin_dashboard', onTabChange }) => {
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Core Data Collections
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [operators, setOperators] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Targeted API Fetchers - Call only what is needed per active view
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const prods = await ProductAPI.getAll().catch(e => { console.warn('Products fetch error:', e); return []; });
      setProducts(Array.isArray(prods) ? prods : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [inv, locs, prods] = await Promise.all([
        InventoryAPI.getAll().catch(e => { console.warn('Inventory fetch error:', e); return []; }),
        InventoryAPI.getLocations().catch(e => { console.warn('Locations fetch error:', e); return []; }),
        ProductAPI.getAll().catch(e => { console.warn('Products fetch error:', e); return []; })
      ]);
      setInventory(Array.isArray(inv) ? inv : []);
      setLocations(Array.isArray(locs) ? locs : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const dists = await DistributorAPI.getAll().catch(e => { console.warn('Distributors fetch error:', e); return []; });
      setDistributors(Array.isArray(dists) ? dists : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const [ops, locs] = await Promise.all([
        OperatorAPI.getAll().catch(e => { console.warn('Operators fetch error:', e); return []; }),
        InventoryAPI.getLocations().catch(e => { console.warn('Locations fetch error:', e); return []; })
      ]);
      setOperators(Array.isArray(ops) ? ops : []);
      setLocations(Array.isArray(locs) ? locs : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const sales = await SalesAPI.getAllInvoices().catch(e => { console.warn('Invoices fetch error:', e); return []; });
      setInvoices(Array.isArray(sales) ? sales : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const inqs = await InquiryAPI.getAll().catch(e => { console.warn('Inquiries fetch error:', e); return []; });
      setInquiries(Array.isArray(inqs) ? inqs : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const [promos, prods] = await Promise.all([
        PromotionAPI.getAll().catch(e => { console.warn('Promotions fetch error:', e); return []; }),
        ProductAPI.getAll().catch(e => { console.warn('Products fetch error:', e); return []; })
      ]);
      setPromotions(Array.isArray(promos) ? promos : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rep, sales, dists, inqs, inv, locs] = await Promise.all([
        ReportAPI.getSummary().catch(() => null),
        SalesAPI.getAllInvoices().catch(() => []),
        DistributorAPI.getAll().catch(() => []),
        InquiryAPI.getAll().catch(() => []),
        InventoryAPI.getAll().catch(() => []),
        InventoryAPI.getLocations().catch(() => [])
      ]);
      setReportSummary(rep);
      setInvoices(Array.isArray(sales) ? sales : []);
      setDistributors(Array.isArray(dists) ? dists : []);
      setInquiries(Array.isArray(inqs) ? inqs : []);
      setInventory(Array.isArray(inv) ? inv : []);
      setLocations(Array.isArray(locs) ? locs : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardOverview = async () => {
    setLoading(true);
    try {
      const [inv, prods, dists, ops, sales, inqs, promos, rep] = await Promise.all([
        InventoryAPI.getAll().catch(() => []),
        ProductAPI.getAll().catch(() => []),
        DistributorAPI.getAll().catch(() => []),
        OperatorAPI.getAll().catch(() => []),
        SalesAPI.getAllInvoices().catch(() => []),
        InquiryAPI.getAll().catch(() => []),
        PromotionAPI.getAll().catch(() => []),
        ReportAPI.getSummary().catch(() => null)
      ]);
      setInventory(Array.isArray(inv) ? inv : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setDistributors(Array.isArray(dists) ? dists : []);
      setOperators(Array.isArray(ops) ? ops : []);
      setInvoices(Array.isArray(sales) ? sales : []);
      setInquiries(Array.isArray(inqs) ? inqs : []);
      setPromotions(Array.isArray(promos) ? promos : []);
      setReportSummary(rep);
    } catch (err) {
      console.error('Error fetching admin dashboard overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Normalize activeTab string to determine view
  const currentTab = (activeTab || 'admin_dashboard').replace(/^admin_/, '');

  // Fetch ONLY the required API data when navigating to a specific menu route
  useEffect(() => {
    switch (currentTab) {
      case 'products':
      case 'products_master':
      case 'prices':
      case 'pricing':
        fetchProducts();
        break;
      case 'products_categories':
      case 'products_packsizes':
      case 'products_compliance':
      case 'products_territories':
      case 'products_depots':
      case 'territories':
      case 'depots':
        // Managed on-demand inside AdminProductsView per active subTab
        break;
      case 'offers':
        fetchPromotions();
        break;
      case 'inventory':
        fetchInventory();
        break;
      case 'distributors':
        fetchDistributors();
        break;
      case 'operators':
        fetchOperators();
        break;
      case 'sales':
        fetchInvoices();
        break;
      case 'inquiries':
        fetchInquiries();
        break;
      case 'reports':
        fetchReports();
        break;
      case 'settings':
        // Static configuration, no remote dataset required
        break;
      case 'dashboard':
      case 'admin_dashboard':
        fetchDashboardOverview();
        break;
      default:
        // Do not fetch all dashboard overview on unmapped routes
        break;
    }
  }, [currentTab]);

  const handleNavigate = (tabKey) => {
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  // CSV Export Utility
  const exportToCSV = (filename, rows) => {
    if (!rows || !rows.length) {
      showToast('No data available to export.');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        let val = row[header];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        val = (val === undefined || val === null) ? '' : String(val);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename}.csv`);
  };

  // Render view based on activeTab
  const renderActiveView = () => {
    if (currentTab.startsWith('products')) {
      const sub = currentTab.replace('products_', '').replace('products', 'master') || 'master';
      return (
        <AdminProductsView
          products={products}
          subTab={sub}
          onSubTabChange={(newSub) => handleNavigate(newSub === 'master' ? 'admin_products_master' : `admin_products_${newSub}`)}
          onRefresh={fetchProducts}
          onShowToast={showToast}
          onNavigateToPricing={() => handleNavigate('admin_prices')}
        />
      );
    }

    switch (currentTab) {
      case 'prices':
      case 'pricing':
        return (
          <AdminPricingEngineView
            products={products}
            onRefresh={fetchProducts}
            onShowToast={showToast}
            exportToCSV={exportToCSV}
          />
        );

      case 'offers':
        return (
          <AdminOffersView
            promotions={promotions}
            products={products}
            onRefresh={fetchPromotions}
            onShowToast={showToast}
          />
        );

      case 'inventory':
        return (
          <AdminInventoryView
            inventory={inventory}
            locations={locations}
            products={products}
            onRefresh={fetchInventory}
            onShowToast={showToast}
            exportToCSV={exportToCSV}
          />
        );

      case 'distributors':
        return (
          <AdminDistributorsView
            distributors={distributors}
            onRefresh={fetchDistributors}
            onShowToast={showToast}
            exportToCSV={exportToCSV}
          />
        );

      case 'operators':
        return (
          <AdminOperatorsView
            operators={operators}
            locations={locations}
            onRefresh={fetchOperators}
            onShowToast={showToast}
            exportToCSV={exportToCSV}
          />
        );

      case 'sales':
        return (
          <AdminSalesInvoicesView
            invoices={invoices}
            exportToCSV={exportToCSV}
            COMPANY_INFO={COMPANY_INFO}
          />
        );

      case 'inquiries':
        return (
          <AdminCustomerEnquiriesView
            inquiries={inquiries}
            onRefresh={fetchInquiries}
            onShowToast={showToast}
            exportToCSV={exportToCSV}
          />
        );

      case 'reports':
        return (
          <AdminReportsAnalyticsView
            reportSummary={reportSummary}
            invoices={invoices}
            distributors={distributors}
            inquiries={inquiries}
            inventory={inventory}
            locations={locations}
            exportToCSV={exportToCSV}
            onShowToast={showToast}
            COMPANY_INFO={COMPANY_INFO}
          />
        );

      case 'settings':
        return (
          <AdminSettingsView
            COMPANY_INFO={COMPANY_INFO}
            onShowToast={showToast}
          />
        );

      case 'dashboard':
      default:
        return (
          <AdminExecutiveOverview
            inventory={inventory}
            distributors={distributors}
            operators={operators}
            invoices={invoices}
            inquiries={inquiries}
            products={products}
            promotions={promotions}
            reportSummary={reportSummary}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ backgroundColor: '#040D1E', color: '#FFFFFF', padding: '12px 20px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--brand-cyan)', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-lg)' }}>
          <Sparkles size={18} color="var(--brand-cyan)" />
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{toastMsg}</span>
        </div>
      )}

      {/* RENDER DEDICATED COMPONENT */}
      {renderActiveView()}
    </div>
  );
};

export default AdminDashboard;

