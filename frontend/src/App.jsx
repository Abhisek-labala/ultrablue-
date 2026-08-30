import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import { DesignSystemPreview } from './views/DesignSystemPreview';
import { PublicWebsite } from './views/PublicWebsite';
import { LoginPage, JWT_AUTH } from './views/LoginPage';
import { DistributorPortal } from './views/DistributorPortal';
import { SalesOperatorTerminal } from './views/SalesOperatorTerminal';
import { MobileOperatorApp } from './views/MobileOperatorApp';
import { AdminDashboard } from './views/AdminDashboard';
import { PromotionAPI } from './services/api';
import './styles/tokens.css';
import './styles/base.css';

// Master Route Definitions for Every Menu and Submenu in the Platform
export const ROUTES = [
  // Admin Routes
  // Admin Routes - Product Master & Catalogue Sub-Routes
  { path: '/admin', role: 'admin', tab: 'admin_dashboard', exact: true, title: 'Master Plant & Operations Dashboard', crumbs: ['UltraBlue+', 'Ayush Green Energy', 'Admin Command Center'] },
  { path: '/admin/dashboard', role: 'admin', tab: 'admin_dashboard', title: 'Master Plant & Operations Dashboard', crumbs: ['UltraBlue+', 'Admin', 'Executive Dashboard'] },
  { path: '/admin/products', role: 'admin', tab: 'admin_products_master', aliases: ['/admin/products/master', '/admin/catalogue', '/admin/catalog'], title: 'Product Master Catalogue & SKU Matrix', crumbs: ['UltraBlue+', 'Products Catalogue', 'Product Master'] },
  { path: '/admin/products/categories', role: 'admin', tab: 'admin_products_categories', aliases: ['/admin/categories'], title: 'Product Categories & Industry Classifications', crumbs: ['UltraBlue+', 'Products Catalogue', 'Product Categories'] },
  { path: '/admin/products/packsizes', role: 'admin', tab: 'admin_products_packsizes', aliases: ['/admin/packsizes', '/admin/pack-sizes'], title: 'Master Pack Sizes & Packaging Variants', crumbs: ['UltraBlue+', 'Products Catalogue', 'Pack Sizes & Variants'] },
  { path: '/admin/products/compliance', role: 'admin', tab: 'admin_products_compliance', aliases: ['/admin/compliance', '/admin/standards'], title: 'ISO 22241 & BIS Quality Compliance', crumbs: ['UltraBlue+', 'Products Catalogue', 'ISO / BIS Compliance'] },
  { path: '/admin/pricing', role: 'admin', tab: 'admin_prices', aliases: ['/admin/prices', '/admin/pricing-engine'], title: 'Pricing Engine & Multi-Tier Wholesale Matrix', crumbs: ['UltraBlue+', 'Admin', 'Pricing Engine'] },
  { path: '/admin/offers', role: 'admin', tab: 'admin_offers', aliases: ['/admin/promotions', '/admin/deals'], title: 'Offers, Promotions & Broadcast Deals', crumbs: ['UltraBlue+', 'Admin', 'Offers & Promotions'] },
  { path: '/admin/distributors', role: 'admin', tab: 'admin_distributors', aliases: ['/admin/partners', '/admin/b2b'], title: 'Authorized B2B Distributor Accounts & KYC', crumbs: ['UltraBlue+', 'Admin', 'Distributor Accounts'] },
  { path: '/admin/operators', role: 'admin', tab: 'admin_operators', aliases: ['/admin/staff', '/admin/users'], title: 'Plant & Depot Sales Operator Terminals', crumbs: ['UltraBlue+', 'Admin', 'Sales Operators'] },
  { path: '/admin/inventory', role: 'admin', tab: 'admin_inventory', aliases: ['/admin/stock', '/admin/depots'], title: 'Multi-Hub Depot Inventory & Batch Allocations', crumbs: ['UltraBlue+', 'Admin', 'Inventory & Refills'] },
  { path: '/admin/sales', role: 'admin', tab: 'admin_sales', aliases: ['/admin/invoices', '/admin/billing', '/admin/pos-invoices'], title: 'Direct Sales & POS Invoices Register', crumbs: ['UltraBlue+', 'Admin', 'Sales & POS Invoices'] },
  { path: '/admin/enquiries', role: 'admin', tab: 'admin_inquiries', aliases: ['/admin/inquiries', '/admin/leads'], title: 'Commercial Customer Enquiries & Bulk Leads', crumbs: ['UltraBlue+', 'Admin', 'Customer Enquiries'] },
  { path: '/admin/reports', role: 'admin', tab: 'admin_reports', aliases: ['/admin/analytics', '/admin/stats'], title: 'Reports, Analytics & Financial Intelligence', crumbs: ['UltraBlue+', 'Admin', 'Reports & Analytics'] },
  { path: '/admin/settings', role: 'admin', tab: 'admin_settings', aliases: ['/admin/config', '/admin/platform-settings'], title: 'Ayush Green Energy Enterprise Settings', crumbs: ['UltraBlue+', 'Admin', 'Platform Settings'] },

  // Distributor Routes
  { path: '/distributor', role: 'distributor', tab: 'dist_dashboard', exact: true, title: 'B2B Distributor Operations Portal', crumbs: ['UltraBlue+', 'B2B Distributor Portal', 'Dashboard'] },
  { path: '/distributor/dashboard', role: 'distributor', tab: 'dist_dashboard', title: 'B2B Distributor Operations Portal', crumbs: ['UltraBlue+', 'Distributor Portal', 'B2B Dashboard'] },
  { path: '/distributor/catalog', role: 'distributor', tab: 'dist_catalog', aliases: ['/distributor/catalogue', '/distributor/products'], title: 'Distributor Tier Price Catalogue', crumbs: ['UltraBlue+', 'Distributor Portal', 'Price Catalogue'] },
  { path: '/distributor/pricelist', role: 'distributor', tab: 'dist_pricelist', aliases: ['/distributor/prices'], title: 'Download Official GST Price List', crumbs: ['UltraBlue+', 'Distributor Portal', 'Price List Download'] },
  { path: '/distributor/orders', role: 'distributor', tab: 'dist_orders', aliases: ['/distributor/history', '/distributor/inquiries'], title: 'Order Placement & Purchase History', crumbs: ['UltraBlue+', 'Distributor Portal', 'Order & Enquiry History'] },
  { path: '/distributor/kyc', role: 'distributor', tab: 'dist_kyc', aliases: ['/distributor/profile'], title: 'Distributor Profile & KYC Compliance', crumbs: ['UltraBlue+', 'Distributor Portal', 'Profile & KYC'] },

  // Sales Operator / POS Routes
  { path: '/operator', role: 'operator', tab: 'pos_billing', exact: true, title: 'Sales Operator Direct Billing Terminal', crumbs: ['UltraBlue+', 'Sales Operator POS', 'Fast POS Billing'] },
  { path: '/operator/pos', role: 'operator', tab: 'pos_billing', aliases: ['/pos', '/operator/billing'], title: 'Sales Operator Direct Billing Terminal', crumbs: ['UltraBlue+', 'Sales Operator POS', 'Fast POS Billing'] },
  { path: '/operator/stock', role: 'operator', tab: 'stock_check', aliases: ['/operator/inventory'], title: 'Live Depot Stock Verification', crumbs: ['UltraBlue+', 'Sales Operator POS', 'Live Stock Check'] },
  { path: '/operator/sales', role: 'operator', tab: 'sales_history', aliases: ['/operator/invoices', '/operator/history'], title: 'POS Invoices & Dispensing Records', crumbs: ['UltraBlue+', 'Sales Operator POS', 'Invoice Records'] },
  { path: '/operator/shift', role: 'operator', tab: 'shift_summary', aliases: ['/operator/summary'], title: 'Shift Summary & Cash Collection', crumbs: ['UltraBlue+', 'Sales Operator POS', 'Shift Summary'] },

  // Design System Routes
  { path: '/design-system', role: 'design_system', tab: 'ds_preview', exact: true, title: 'UltraBlue+ Master Design System & Token Architecture', crumbs: ['UltraBlue+', 'Design System & Tokens', 'Master Preview'] },
  { path: '/design-system/preview', role: 'design_system', tab: 'ds_preview', aliases: ['/tokens'], title: 'Master Design System & Section 45 Preview', crumbs: ['UltraBlue+', 'Design System', 'Preview'] },
  { path: '/design-system/colors', role: 'design_system', tab: 'ds_colors', title: 'Color Tokens & 60/30/10 Ratio Architecture', crumbs: ['UltraBlue+', 'Design System', 'Color Tokens'] },
  { path: '/design-system/components', role: 'design_system', tab: 'ds_components', title: 'Standardized Component Primitives & UI Atoms', crumbs: ['UltraBlue+', 'Design System', 'Component Primitives'] },
  { path: '/design-system/feedback', role: 'design_system', tab: 'ds_feedback', title: 'Feedback, Skeleton & Error State Guidelines', crumbs: ['UltraBlue+', 'Design System', 'Feedback States'] },

  // Mobile App Simulator
  { path: '/android-pos', role: 'android_pos', tab: 'mobile_pos', aliases: ['/mobile-pos'], title: 'Android Sales POS App Simulator (React Native)', crumbs: ['UltraBlue+', 'Android App (React Native)', 'Touch POS Terminal'] },

  // Login
  { path: '/login', role: 'login', tab: 'login', aliases: ['/signin', '/register', '/auth'], title: 'Enterprise Security Portal Login', crumbs: ['UltraBlue+', 'Enterprise Security', 'JWT Login'] },

  // Public Website
  { path: '/', role: 'public', tab: 'public_home', aliases: ['/home', '/index.html'], title: 'UltraBlue+ Genuine DEF & Industrial Lubricants', crumbs: ['UltraBlue+', 'Ayush Green Energy', 'Public Portal'] }
];

export const matchRoute = (pathname) => {
  const clean = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';

  // 1. Direct path match
  const exact = ROUTES.find(r => r.path.toLowerCase() === clean);
  if (exact) return exact;

  // 2. Alias match
  const alias = ROUTES.find(r => r.aliases && r.aliases.some(a => a.toLowerCase() === clean));
  if (alias) return alias;

  // 3. Prefix match for specific subroutes
  const prefix = ROUTES.find(r => clean.startsWith(r.path.toLowerCase()) && r.path !== '/');
  if (prefix) return prefix;

  // 4. Fallback keyword matching
  if (clean.includes('admin') || clean.includes('dashboard')) return ROUTES.find(r => r.tab === 'admin_dashboard');
  if (clean.includes('distributor') || clean.includes('portal')) return ROUTES.find(r => r.tab === 'dist_catalog');
  if (clean.includes('operator') || clean.includes('pos')) return ROUTES.find(r => r.tab === 'pos_billing');
  if (clean.includes('design') || clean.includes('token')) return ROUTES.find(r => r.tab === 'ds_preview');
  if (clean.includes('android')) return ROUTES.find(r => r.tab === 'mobile_pos');
  if (clean.includes('login') || clean.includes('signin')) return ROUTES.find(r => r.tab === 'login');

  return ROUTES[ROUTES.length - 1]; // Public Website
};

export const getRouteForTab = (tabKey, role = null) => {
  if (tabKey) {
    const found = ROUTES.find(r => r.tab === tabKey);
    if (found) return found;
  }
  if (role) {
    const foundByRole = ROUTES.find(r => r.role === role);
    if (foundByRole) return foundByRole;
  }
  return ROUTES[0];
};

export function App() {
  const initialRoute = matchRoute(window.location.pathname);
  const [currentRole, setCurrentRole] = useState(initialRoute.role);
  const [activeTab, setActiveTab] = useState(initialRoute.tab);
  const [currentRouteInfo, setCurrentRouteInfo] = useState(initialRoute);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [authUser, setAuthUser] = useState(() => {
    const session = JWT_AUTH.getSession();
    return session ? session.user : null;
  });

  // Synchronize route metadata whenever role or tab changes
  useEffect(() => {
    const matched = getRouteForTab(activeTab, currentRole);
    setCurrentRouteInfo(matched);
    if (matched && matched.title) {
      document.title = `${matched.title} | UltraBlue+`;
    }
  }, [currentRole, activeTab]);

  // Fetch live active promotions / broadcast announcements
  useEffect(() => {
    PromotionAPI.getAll()
      .then(promos => {
        if (Array.isArray(promos) && promos.length > 0) {
          setNotifications(promos.map(p => ({
            id: p.id,
            title: p.title,
            message: p.description,
            type: 'PROMO',
            time: p.discount_percent || 'Active Offer',
            read: false
          })));
        }
      })
      .catch(() => setNotifications([]));
  }, []);

  // Restore authenticated session on mount if available
  useEffect(() => {
    const session = JWT_AUTH.getSession();
    if (session && session.user) {
      setAuthUser(session.user);
    }
  }, []);

  // Handle browser Back & Forward buttons (PopState)
  useEffect(() => {
    const onPopState = () => {
      const route = matchRoute(window.location.pathname);
      setCurrentRole(route.role);
      setActiveTab(route.tab);
      setCurrentRouteInfo(route);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Switch tab with instant URL pushState update
  const handleTabChange = (newTab, updateUrl = true) => {
    const route = getRouteForTab(newTab);
    setActiveTab(route.tab);
    setCurrentRole(route.role);
    setCurrentRouteInfo(route);

    if (updateUrl && window.location.pathname !== route.path) {
      window.history.pushState({ role: route.role, tab: route.tab }, '', route.path);
    }
  };

  // Role switch handler
  const handleRoleChange = (newRole, updateUrl = true) => {
    let defaultTab = 'public_home';
    if (newRole === 'admin') defaultTab = 'admin_dashboard';
    else if (newRole === 'distributor') defaultTab = 'dist_catalog';
    else if (newRole === 'operator') defaultTab = 'pos_billing';
    else if (newRole === 'design_system') defaultTab = 'ds_preview';
    else if (newRole === 'android_pos') defaultTab = 'mobile_pos';
    else if (newRole === 'login') defaultTab = 'login';
    else if (newRole === 'public') defaultTab = 'public_home';

    handleTabChange(defaultTab, updateUrl);
  };

  const handleLogout = () => {
    JWT_AUTH.clearSession();
    setAuthUser(null);
    handleRoleChange('public');
  };

  const getBreadcrumbs = () => {
    return currentRouteInfo?.crumbs || ['UltraBlue+', 'Ayush Green Energy', 'Portal'];
  };

  const getPageTitle = () => {
    return currentRouteInfo?.title || 'Admin Command Center & Multi-Hub Matrix';
  };

  // 1. If in Dedicated Login Page Mode
  if (currentRole === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(role, user) => {
          setAuthUser(user);
          handleRoleChange(role);
        }}
        onBackToWebsite={() => handleRoleChange('public')}
      />
    );
  }

  // 2. If in Public Website mode, render clean dedicated website
  if (currentRole === 'public') {
    return (
      <div className="public-site-wrapper" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
        <PublicWebsite
          onLoginClick={() => handleRoleChange('login')}
          onDistributorLoginClick={() => handleRoleChange('login')}
          onOperatorLoginClick={() => handleRoleChange('login')}
          onAdminLoginClick={() => handleRoleChange('login')}
        />
      </div>
    );
  }

  // 3. Authenticated Internal Portals Layout (Admin / POS / Distributor / Android POS / Design System)
  return (
    <div className="app-container">
      {/* Sidebar for Internal Applications */}
      {currentRole !== 'android_pos' && (
        <AppSidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Global Header */}
        <AppHeader
          title={getPageTitle()}
          breadcrumbs={getBreadcrumbs()}
          currentRole={currentRole}
          authUser={authUser}
          onRoleChange={handleRoleChange}
          onLogout={handleLogout}
          onViewPublicWebsite={() => handleRoleChange('public')}
          notifications={notifications}
          onNotificationClick={(notif) => {
            if (notif.action === 'GO_TO_INVENTORY') {
              handleTabChange('admin_inventory');
            } else if (notif.action === 'GO_TO_DISTRIBUTORS') {
              handleTabChange('admin_distributors');
            } else if (notif.action === 'GO_TO_SALES') {
              handleTabChange('pos_billing');
            }
          }}
        />

        {/* View Router */}
        <main className="page-body">
          {currentRole === 'design_system' && (
            <DesignSystemPreview
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
          {currentRole === 'distributor' && (
            <DistributorPortal
              authUser={authUser}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
          {currentRole === 'operator' && (
            <SalesOperatorTerminal
              authUser={authUser}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
          {currentRole === 'android_pos' && (
            <MobileOperatorApp
              authUser={authUser}
            />
          )}
          {currentRole === 'admin' && (
            <AdminDashboard
              authUser={authUser}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;



