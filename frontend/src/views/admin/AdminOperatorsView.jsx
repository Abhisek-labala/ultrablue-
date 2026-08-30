import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Download, 
  CheckCircle2, 
  KeyRound, 
  MapPin, 
  Power 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OperatorAPI } from '../../services/api';

export const AdminOperatorsView = ({ 
  operators = [], 
  locations = [], 
  onRefresh, 
  onShowToast, 
  exportToCSV 
}) => {
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);
  const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
  const [isReassignDepotModalOpen, setIsReassignDepotModalOpen] = useState(false);
  const [selectedOperatorForAction, setSelectedOperatorForAction] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [newDepotValue, setNewDepotValue] = useState('');

  const [newOperatorForm, setNewOperatorForm] = useState({
    name: '',
    email: '',
    phone: '',
    assignedDepot: 'Bhadrak Central Plant',
    password: ''
  });

  const handleCreateOperatorSubmit = async (e) => {
    e.preventDefault();
    try {
      await OperatorAPI.create({
        name: newOperatorForm.name,
        email: newOperatorForm.email,
        phone: newOperatorForm.phone,
        assigned_depot: newOperatorForm.assignedDepot,
        password: newOperatorForm.password,
        role: 'operator'
      });

      if (onShowToast) onShowToast(`Sales Operator "${newOperatorForm.name}" created and assigned to ${newOperatorForm.assignedDepot}!`);
      setIsAddOperatorModalOpen(false);
      setNewOperatorForm({
        name: '',
        email: '',
        phone: '',
        assignedDepot: 'Bhadrak Central Plant',
        password: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error creating operator.');
    }
  };

  const handleToggleOperatorStatus = async (op) => {
    const nextStatus = op.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await OperatorAPI.updateStatus(op.id, nextStatus);
      if (onShowToast) onShowToast(`Operator ${op.name} is now ${nextStatus}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error changing operator status.');
    }
  };

  const handleOpenResetPin = (op) => {
    setSelectedOperatorForAction(op);
    setNewPinValue('');
    setIsResetPinModalOpen(true);
  };

  const handleResetPinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOperatorForAction || !newPinValue.trim()) return;
    try {
      await OperatorAPI.resetPin(selectedOperatorForAction.id, newPinValue.trim());
      if (onShowToast) onShowToast(`PIN successfully updated for ${selectedOperatorForAction.name}`);
      setIsResetPinModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error resetting PIN.');
    }
  };

  const handleOpenReassignDepot = (op) => {
    setSelectedOperatorForAction(op);
    setNewDepotValue(op.assignedDepot || (locations[0] && locations[0].name) || 'Bhadrak Central Plant');
    setIsReassignDepotModalOpen(true);
  };

  const handleReassignDepotSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOperatorForAction || !newDepotValue) return;
    try {
      await OperatorAPI.reassignDepot(selectedOperatorForAction.id, newDepotValue);
      if (onShowToast) onShowToast(`Reassigned ${selectedOperatorForAction.name} to ${newDepotValue}`);
      setIsReassignDepotModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error reassigning depot.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="var(--brand-cyan)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Sales Operator Terminals & POS Dispenser Authorization</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Manage station operators, terminal credentials, assigned dispensing locations, and live retail shift throughput.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Operators', operators)}>
            Export Operators CSV
          </Button>
          <Button size="sm" variant="gold" icon={Plus} onClick={() => setIsAddOperatorModalOpen(true)}>
            Add Sales Operator
          </Button>
        </div>
      </div>

      {/* Operators DataTable */}
      <DataTable
        title="Active Depot Dispenser Operators & Access Terminals"
        data={operators}
        columns={[
          {
            header: 'Operator & Contact',
            accessor: 'name',
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)' }}>{val}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {row.email} • {row.phone}
                </div>
              </div>
            )
          },
          {
            header: 'Terminal Role',
            accessor: 'role',
            render: (val) => (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)' }}>
                {val ? val.toUpperCase() : 'STATION POS'}
              </span>
            )
          },
          {
            header: 'Assigned Depot / Hub',
            accessor: 'assignedDepot',
            render: (val) => (
              <div>
                <strong>{val || 'Bhadrak Central Plant'}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct POS Terminal</div>
              </div>
            )
          },
          {
            header: 'Shift Status',
            accessor: 'status',
            render: (val) => <StatusBadge status={val} />
          },
          {
            header: 'Last Login / Shift',
            accessor: 'lastLogin',
            render: (val) => <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{val || 'Active Today'}</span>
          },
          {
            header: 'Total Shift Dispensed',
            accessor: 'totalDispensedLiters',
            render: (val) => (
              <div>
                <strong style={{ color: 'var(--brand-blue)' }}>{(val || 0).toLocaleString('en-IN')} L</strong>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Recorded Flow</div>
              </div>
            )
          },
          {
            header: 'Terminal Actions',
            accessor: 'id',
            render: (val, row) => (
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button 
                  size="sm" 
                  variant="secondary"
                  icon={KeyRound}
                  onClick={() => handleOpenResetPin(row)}
                  title="Reset POS Terminal PIN"
                >
                  PIN
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  icon={MapPin}
                  onClick={() => handleOpenReassignDepot(row)}
                  title="Reassign Station Depot"
                >
                  Hub
                </Button>
                <Button 
                  size="sm" 
                  variant={row.status === 'ACTIVE' ? 'ghost' : 'gold'}
                  icon={Power}
                  style={{ color: row.status === 'ACTIVE' ? 'var(--status-danger)' : undefined }}
                  onClick={() => handleToggleOperatorStatus(row)}
                  title={row.status === 'ACTIVE' ? 'Suspend Access' : 'Activate Access'}
                >
                  {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </Button>
              </div>
            )
          }
        ]}
      />

      {/* ADD OPERATOR MODAL */}
      <Modal
        isOpen={isAddOperatorModalOpen}
        onClose={() => setIsAddOperatorModalOpen(false)}
        title="Create New Sales Operator Terminal Account"
      >
        <form onSubmit={handleCreateOperatorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Operator Full Name</label>
            <Input value={newOperatorForm.name} onChange={e => setNewOperatorForm({ ...newOperatorForm, name: e.target.value })} placeholder="e.g. Ramesh Nayak" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Email (Login ID)</label>
              <Input type="email" value={newOperatorForm.email} onChange={e => setNewOperatorForm({ ...newOperatorForm, email: e.target.value })} placeholder="operator@ultrablueplus.com" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Mobile Number</label>
              <Input value={newOperatorForm.phone} onChange={e => setNewOperatorForm({ ...newOperatorForm, phone: e.target.value })} placeholder="+91 8328826667" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Assigned Depot / Dispenser Station</label>
            <Select
              value={newOperatorForm.assignedDepot}
              onChange={e => setNewOperatorForm({ ...newOperatorForm, assignedDepot: e.target.value })}
              options={locations.map(l => ({ label: l.name, value: l.name }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Terminal Login PIN / Password</label>
            <Input type="password" value={newOperatorForm.password} onChange={e => setNewOperatorForm({ ...newOperatorForm, password: e.target.value })} placeholder="operator123" required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddOperatorModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>Create Operator Account</Button>
          </div>
        </form>
      </Modal>

      {/* RESET PIN MODAL */}
      <Modal
        isOpen={isResetPinModalOpen}
        onClose={() => setIsResetPinModalOpen(false)}
        title={`Reset Terminal PIN for ${selectedOperatorForAction?.name || 'Operator'}`}
      >
        <form onSubmit={handleResetPinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Set a new 4-8 digit security PIN for terminal POS authentication.
          </p>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>New Terminal PIN / Password</label>
            <Input 
              type="password" 
              value={newPinValue} 
              onChange={e => setNewPinValue(e.target.value)} 
              placeholder="e.g. 9842" 
              required 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsResetPinModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={KeyRound}>Save New PIN</Button>
          </div>
        </form>
      </Modal>

      {/* REASSIGN DEPOT MODAL */}
      <Modal
        isOpen={isReassignDepotModalOpen}
        onClose={() => setIsReassignDepotModalOpen(false)}
        title={`Reassign Station Depot for ${selectedOperatorForAction?.name || 'Operator'}`}
      >
        <form onSubmit={handleReassignDepotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Assigned Station Location</label>
            <Select
              value={newDepotValue}
              onChange={e => setNewDepotValue(e.target.value)}
              options={locations.map(l => ({ label: `${l.name} (${l.city || ''})`, value: l.name }))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsReassignDepotModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>Confirm Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
