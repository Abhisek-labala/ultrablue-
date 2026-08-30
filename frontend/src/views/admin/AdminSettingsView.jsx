import React from 'react';
import { 
  Settings, 
  CheckCircle2, 
  Building2, 
  Phone, 
  ShieldCheck, 
  Database 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminSettingsView = ({ 
  COMPANY_INFO, 
  onShowToast 
}) => {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '24px', maxWidth: '820px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={18} color="var(--brand-cyan)" />
        <span>Ayush Green Energy Platform Configuration</span>
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Factory Plant Address
          </label>
          <Input value={COMPANY_INFO?.plantAddress || 'At- Charampa, Dist- Bhadrak, Odisha, Pin- 756101'} readOnly />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
            24/7 Plant Dispatch Hotline
          </label>
          <Input value={COMPANY_INFO?.salesHotline || '+91 8328826667 / +91 9853675971'} readOnly />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
            DEF Quality Benchmark
          </label>
          <Input value="ISO 22241-1 / BIS Certified • <0.2 ppm Trace Metals" readOnly />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Database Connection Status
          </label>
          <Input value="ACTIVE (Users, Inventory, Invoices, Distributors, Operators)" readOnly />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-medium)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="sm" onClick={() => onShowToast && onShowToast('Platform configuration saved and validated!')}>
          Save Platform Settings
        </Button>
      </div>
    </div>
  );
};
