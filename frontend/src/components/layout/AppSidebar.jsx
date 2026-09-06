import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Warehouse,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  PhoneCall,
  Sliders,
  Layers,
  FileCheck2,
  TrendingUp,
  Globe,
  BadgePercent,
  Sparkles,
  Tag,
  ShieldCheck,
  Building2,
  Database,
  MapPin
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { COMPANY_INFO } from '../../config/companyInfo';
import { ROLES } from '../../config/roles';

export const AppSidebar = ({
  currentRole = 'admin',
  activeTab = 'dashboard',
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
  authUser = null
}) => {
  // Track open/collapsed submenu groups (Closed by default as requested)
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubMenu = (menuId) => {
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  // Define navigation items grouped by role
  const getNavItems = () => {
    switch (currentRole) {
      case ROLES.OPERATOR:
        return [
          { id: 'pos_billing', label: 'Fast Sales POS', icon: ShoppingCart, badge: 'Active' },
          { id: 'stock_check', label: 'Live Stock Check', icon: Warehouse },
          { id: 'sales_history', label: 'Invoice Records', icon: FileText },
          { id: 'shift_summary', label: 'Shift Summary', icon: TrendingUp }
        ];

      case ROLES.DISTRIBUTOR:
        return [
          { id: 'dist_dashboard', label: 'B2B Dashboard', icon: LayoutDashboard },
          { id: 'dist_catalog', label: 'Price Catalogue', icon: Package },
          { id: 'dist_pricelist', label: 'Download Price List', icon: FileCheck2 },
          { id: 'dist_orders', label: 'Order & Enquiry History', icon: ShoppingCart },
          { id: 'dist_kyc', label: 'Distributor Profile / KYC', icon: Shield }
        ];

      case 'design_system':
        return [
          { id: 'ds_preview', label: 'Design System Preview', icon: Sliders, badge: 'Sec 45' },
          { id: 'ds_colors', label: 'Color Tokens (60/30/10)', icon: Layers },
          { id: 'ds_components', label: 'Component Primitives', icon: Package },
          { id: 'ds_feedback', label: 'Feedback States', icon: MessageSquare }
        ];

      case 'admin':
      default:
        return [
          { id: 'admin_dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          {
            id: 'admin_products',
            label: 'Master Data Config',
            icon: Database,
            badge: 'Config',
            subItems: [
              { id: 'admin_products_master', label: 'Product Master', icon: Package, badge: 'SKUs' },
              { id: 'admin_products_categories', label: 'Product Categories', icon: Layers, badge: 'Categories' },
              { id: 'admin_products_packsizes', label: 'Pack Sizes & Variants', icon: Warehouse, badge: 'Packs' },
              { id: 'admin_products_compliance', label: 'ISO / BIS Compliance', icon: ShieldCheck, badge: 'ISO' },
              { id: 'admin_products_territories', label: 'States & Territories', icon: Globe, badge: 'DB' },
              { id: 'admin_products_depots', label: 'Depots & Stations', icon: Building2, badge: 'Multi-Hub' }
            ]
          },
          { id: 'admin_prices', label: 'Pricing Engine', icon: BadgePercent, badge: 'Live GST' },
          { id: 'admin_offers', label: 'Offers & Promotions', icon: Sparkles, badge: 'Deals' },
          { id: 'admin_distributors', label: 'Distributor Accounts', icon: Users, badge: 'B2B' },
          { id: 'admin_operators', label: 'Sales Operators', icon: Shield, badge: 'Active' },
          { id: 'admin_inventory', label: 'Inventory & Refills', icon: Warehouse, badge: 'Multi-Depot' },
          { id: 'admin_sales', label: 'Sales & POS Invoices', icon: ShoppingCart },
          { id: 'admin_inquiries', label: 'Customer Enquiries', icon: MessageSquare, badge: 'Leads' },
          { id: 'admin_reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'admin_settings', label: 'Platform Settings', icon: Settings }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      style={{
        width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)',
        backgroundColor: '#040D1E',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 120,
        transition: 'width var(--transition-normal)',
        borderRight: '1px solid #13274F',
        userSelect: 'none'
      }}
    >
      {/* Sidebar Header with Brand Logo */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 var(--space-5)',
          borderBottom: '1px solid var(--brand-navy-border)',
          overflow: 'hidden'
        }}
      >
        {!isCollapsed ? (
          <Logo size="small" variant="dark" />
        ) : (
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#FFFFFF' }}>
            UB+
          </div>
        )}
      </div>

      {/* Role Indicator Banner */}
      {!isCollapsed && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--brand-navy-dark)',
            borderBottom: '1px solid var(--brand-navy-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}
        >
          <span style={{ color: 'var(--brand-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {currentRole.replace('_', ' ')}
          </span>
          <span style={{ color: '#94A3B8', fontSize: '10px' }}>v2.4 Enterprise</span>
        </div>
      )}

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: 'var(--space-3) var(--space-2)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const isParentActive = activeTab === item.id || (hasSubItems && item.subItems.some(sub => sub.id === activeTab));
            const isSubOpen = Boolean(expandedMenus[item.id]);

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasSubItems) {
                      if (isCollapsed) {
                        onTabChange(item.subItems[0].id);
                      } else {
                        toggleSubMenu(item.id);
                        if (!isParentActive) {
                          onTabChange(item.subItems[0].id);
                        }
                      }
                    } else {
                      onTabChange(item.id);
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: isCollapsed ? '12px 0' : '10px 14px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    backgroundColor: isParentActive ? 'rgba(0, 200, 245, 0.14)' : 'transparent',
                    color: isParentActive ? '#FFFFFF' : '#CBD5E1',
                    border: isParentActive ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isParentActive ? 700 : 500,
                    position: 'relative',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isParentActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isParentActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#CBD5E1';
                    }
                  }}
                >
                  {/* Active Indicator Bar on the Left */}
                  {isParentActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '4px',
                        bottom: '4px',
                        width: '3px',
                        backgroundColor: 'var(--brand-cyan)',
                        borderRadius: '0 2px 2px 0',
                        boxShadow: '0 0 10px var(--brand-cyan)'
                      }}
                    />
                  )}

                  <Icon
                    size={18}
                    color={isParentActive ? 'var(--brand-cyan)' : '#94A3B8'}
                    style={{ flexShrink: 0 }}
                  />

                  {!isCollapsed && (
                    <>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>

                      {item.badge && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: isParentActive ? 'var(--brand-blue)' : 'rgba(255, 255, 255, 0.16)',
                            color: '#FFFFFF',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-pill)',
                            marginLeft: 'auto'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}

                      {hasSubItems && (
                        <ChevronDown
                          size={15}
                          style={{
                            color: '#94A3B8',
                            transform: isSubOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            marginLeft: '4px'
                          }}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu Accordion Items */}
                {!isCollapsed && hasSubItems && isSubOpen && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      paddingLeft: '24px',
                      marginTop: '2px',
                      borderLeft: '2px solid rgba(0, 200, 245, 0.2)',
                      marginLeft: '18px'
                    }}
                  >
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id || (sub.id === 'admin_products_master' && activeTab === 'admin_products');

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onTabChange(sub.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '7px 10px',
                            backgroundColor: isSubActive ? 'rgba(0, 200, 245, 0.22)' : 'transparent',
                            color: isSubActive ? 'var(--brand-cyan)' : '#94A3B8',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: isSubActive ? 700 : 500,
                            textAlign: 'left',
                            transition: 'all var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                              e.currentTarget.style.color = '#FFFFFF';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#94A3B8';
                            }
                          }}
                        >
                          <SubIcon size={14} color={isSubActive ? 'var(--brand-cyan)' : '#64748B'} />
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sub.label}
                          </span>
                          {sub.badge && (
                            <span style={{ fontSize: '9px', opacity: 0.8, color: isSubActive ? 'var(--brand-cyan)' : '#64748B' }}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Support & Plant Quick Help */}
      {!isCollapsed && (
        <div
          style={{
            margin: 'var(--space-3)',
            padding: '12px',
            backgroundColor: 'var(--brand-navy-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--brand-navy-border)',
            fontSize: '11px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-gold)', fontWeight: 700, marginBottom: '4px' }}>
            <PhoneCall size={13} />
            <span>{COMPANY_INFO.name} Helpline</span>
          </div>
          <p style={{ color: 'var(--text-on-dark-secondary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
            {(currentRole === ROLES.OPERATOR && (authUser?.assignedDepot || authUser?.organization))
              ? `${(authUser?.assignedDepot || authUser?.organization)} Dispatch Desk:`
              : '24/7 Dispatch Desk:'}
          </p>
          <strong style={{ color: '#FFFFFF', fontSize: '12px', letterSpacing: '0.02em' }}>
            {COMPANY_INFO.salesHotline}
          </strong>
        </div>
      )}

      {/* Sidebar Collapse Toggle Button */}
      <div
        style={{
          padding: '10px',
          borderTop: '1px solid var(--brand-navy-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-end'
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="ub-btn ub-btn-ghost ub-btn-icon"
          style={{ color: 'var(--text-on-dark-secondary)', padding: '6px' }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
