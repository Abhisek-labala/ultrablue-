import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Download, 
  CheckCircle2, 
  KeyRound, 
  MapPin, 
  Power,
  Building2,
  Edit2,
  Trash2,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OperatorAPI, InventoryAPI, TerritoryAPI } from '../../services/api';

// Validation helpers
const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email address is required.';
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email.trim())) return 'Please enter a valid email address.';
  return '';
};

const validatePhone = (phone) => {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean) return 'Mobile number is required.';
  if (clean.length !== 10) return `Mobile number must be 10 digits (currently ${clean.length}).`;
  if (!/^[6-9]/.test(clean)) return 'Mobile number must start with 6, 7, 8, or 9.';
  return '';
};

const validateName = (name) => {
  if (!name || !name.trim()) return 'Operator Full Name is required.';
  if (name.trim().length < 2) return 'Operator name must be at least 2 characters.';
  return '';
};

const validatePin = (pin) => {
  if (!pin || !pin.trim()) return 'Terminal login PIN / Password is required.';
  if (pin.trim().length < 4) return 'PIN/Password must be at least 4 characters.';
  return '';
};

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
  const [isManageDepotsModalOpen, setIsManageDepotsModalOpen] = useState(false);
  const [isEditDepotModalOpen, setIsEditDepotModalOpen] = useState(false);
  
  const [selectedOperatorForAction, setSelectedOperatorForAction] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [newDepotValue, setNewDepotValue] = useState('');
  
  // Dynamic database-driven depots and territories
  const [databaseLocations, setDatabaseLocations] = useState(locations || []);
  const [databaseTerritories, setDatabaseTerritories] = useState({});

  const [newDepotForm, setNewDepotForm] = useState({
    name: '',
    city: '',
    state: '',
    customState: '',
    customCity: '',
    address: '',
    phone: ''
  });

  const [editingDepot, setEditingDepot] = useState({
    id: '',
    name: '',
    city: '',
    state: '',
    customState: '',
    customCity: '',
    address: '',
    phone: '',
    isActive: true
  });

  const [operatorErrors, setOperatorErrors] = useState({});

  const [newOperatorForm, setNewOperatorForm] = useState({
    name: '',
    email: '',
    phone: '',
    assignedDepot: '',
    customDepotName: '',
    customDepotCity: '',
    customDepotState: '',
    password: ''
  });

  const loadDatabaseLocations = async () => {
    try {
      const data = await InventoryAPI.getLocations(true);
      if (Array.isArray(data) && data.length > 0) {
        setDatabaseLocations(data);
      }
    } catch (err) {
      console.error('Error fetching depots from database:', err);
    }
  };

  const loadTerritories = async () => {
    try {
      const data = await TerritoryAPI.getAll();
      setDatabaseTerritories(data || {});
      const firstState = Object.keys(data || {})[0] || '';
      const firstCity = firstState && data[firstState] ? (typeof data[firstState][0] === 'string' ? data[firstState][0] : data[firstState][0]?.city) : '';
      
      setNewDepotForm(prev => ({
        ...prev,
        state: prev.state || firstState,
        city: prev.city || firstCity || ''
      }));
    } catch (err) {
      console.error('Error fetching territories from database:', err);
    }
  };

  useEffect(() => {
    loadDatabaseLocations();
    loadTerritories();
  }, []);

  useEffect(() => {
    if (locations && locations.length > 0) {
      setDatabaseLocations(locations);
    }
  }, [locations]);

  // Active locations for operator dropdowns
  const activeLocations = databaseLocations.filter(l => l.is_active !== false && l.is_active !== 0);

  const depotOptions = [
    { value: '', label: '-- Select Depot / Dispenser Station (from DB) --' },
    ...activeLocations.map(l => ({ 
      value: l.name, 
      label: `${l.name} (${l.city || l.state || 'Hub'})` 
    })),
    { value: 'Other', label: '+ Add New Depot to DB' }
  ];

  const stateOptions = [
    { value: '', label: '-- Select State (from DB) --' },
    ...Object.keys(databaseTerritories).sort().map(s => ({ value: s, label: s })),
    { value: 'Other', label: '+ Add New State' }
  ];

  const getCityOptions = (stateName, currentCity) => {
    if (!stateName || stateName === 'Other') return [{ value: '', label: '-- Select State First --' }];
    const cityList = (databaseTerritories[stateName] || []).map(item => (typeof item === 'string' ? item : item.city));
    const list = [{ value: '', label: '-- Select City (from DB) --' }];
    cityList.forEach(c => {
      list.push({ value: c, label: c });
    });
    if (currentCity && !cityList.includes(currentCity) && currentCity !== 'Other') {
      list.push({ value: currentCity, label: currentCity });
    }
    list.push({ value: 'Other', label: '+ Add New City' });
    return list;
  };

  const handleCreateDepotSubmit = async (e) => {
    e.preventDefault();
    if (!newDepotForm.name.trim()) {
      if (onShowToast) onShowToast('Depot / Station Name is required.');
      return;
    }

    let finalState = newDepotForm.state === 'Other' ? newDepotForm.customState.trim() : newDepotForm.state.trim();
    let finalCity = (newDepotForm.state === 'Other' || newDepotForm.city === 'Other') 
      ? newDepotForm.customCity.trim() 
      : newDepotForm.city.trim();

    if (!finalState) {
      if (onShowToast) onShowToast('Please select or specify a State.');
      return;
    }
    if (!finalCity) {
      if (onShowToast) onShowToast('Please select or specify a City / Hub.');
      return;
    }

    try {
      // Save territory if new
      if ((newDepotForm.state === 'Other' && finalState) || (newDepotForm.city === 'Other' && finalCity)) {
        try {
          await TerritoryAPI.create(finalState, finalCity);
          await loadTerritories();
        } catch {
          // ignore duplicate
        }
      }

      await InventoryAPI.createLocation({
        name: newDepotForm.name.trim(),
        city: finalCity,
        state: finalState,
        address: newDepotForm.address.trim(),
        phone: newDepotForm.phone.trim()
      });

      if (onShowToast) onShowToast(`Depot "${newDepotForm.name}" created and saved to database!`);
      setNewDepotForm({ name: '', city: '', state: '', customState: '', customCity: '', address: '', phone: '' });
      await loadDatabaseLocations();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error saving depot to database.');
    }
  };

  const handleOpenEditDepot = (depot) => {
    setEditingDepot({
      id: depot.id,
      name: depot.name || '',
      city: depot.city || '',
      state: depot.state || '',
      customState: '',
      customCity: '',
      address: depot.address || '',
      phone: depot.contact_phone || depot.phone || '',
      isActive: Boolean(depot.is_active)
    });
    setIsEditDepotModalOpen(true);
  };

  const handleSaveDepotEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDepot.name.trim()) {
      if (onShowToast) onShowToast('Depot Name is required.');
      return;
    }

    let finalState = editingDepot.state === 'Other' ? editingDepot.customState.trim() : editingDepot.state.trim();
    let finalCity = (editingDepot.state === 'Other' || editingDepot.city === 'Other') 
      ? editingDepot.customCity.trim() 
      : editingDepot.city.trim();

    if (!finalState) {
      if (onShowToast) onShowToast('Please select or enter a State.');
      return;
    }
    if (!finalCity) {
      if (onShowToast) onShowToast('Please select or enter a City.');
      return;
    }

    try {
      if ((editingDepot.state === 'Other' && finalState) || (editingDepot.city === 'Other' && finalCity)) {
        try {
          await TerritoryAPI.create(finalState, finalCity);
          await loadTerritories();
        } catch {
          // ignore duplicate
        }
      }

      await InventoryAPI.updateLocation(editingDepot.id, {
        name: editingDepot.name.trim(),
        city: finalCity,
        state: finalState,
        address: editingDepot.address.trim(),
        phone: editingDepot.phone.trim(),
        isActive: editingDepot.isActive
      });

      if (onShowToast) onShowToast(`Depot "${editingDepot.name}" updated successfully!`);
      setIsEditDepotModalOpen(false);
      await loadDatabaseLocations();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating depot.');
    }
  };

  const handleToggleDepotStatus = async (depot) => {
    try {
      const res = await InventoryAPI.toggleLocationStatus(depot.id);
      if (onShowToast) onShowToast(res.message || `Depot "${depot.name}" status updated.`);
      await loadDatabaseLocations();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error toggling depot status.');
    }
  };

  const handleDeleteDepot = async (depot) => {
    if (!window.confirm(`Are you sure you want to permanently delete depot "${depot.name}" from the database?`)) {
      return;
    }
    try {
      await InventoryAPI.deleteLocation(depot.id);
      if (onShowToast) onShowToast(`Depot "${depot.name}" deleted from database.`);
      await loadDatabaseLocations();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error deleting depot.');
    }
  };

  const handleCreateOperatorSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const finalDepot = newOperatorForm.assignedDepot === 'Other' 
      ? newOperatorForm.customDepotName.trim() 
      : newOperatorForm.assignedDepot.trim();

    const errName = validateName(newOperatorForm.name);
    if (errName) errors.name = errName;

    const errEmail = validateEmail(newOperatorForm.email);
    if (errEmail) errors.email = errEmail;

    const errPhone = validatePhone(newOperatorForm.phone);
    if (errPhone) errors.phone = errPhone;

    if (!finalDepot) {
      errors.assignedDepot = 'Please select or specify an assigned Depot.';
    }

    const errPin = validatePin(newOperatorForm.password);
    if (errPin) errors.password = errPin;

    if (Object.keys(errors).length > 0) {
      setOperatorErrors(errors);
      const firstMsg = Object.values(errors)[0];
      if (onShowToast) onShowToast(firstMsg);
      return;
    }
    setOperatorErrors({});

    try {
      if (newOperatorForm.assignedDepot === 'Other' && newOperatorForm.customDepotName.trim()) {
        try {
          const customState = newOperatorForm.customDepotState === 'Other' ? 'Odisha' : (newOperatorForm.customDepotState || 'Odisha');
          const customCity = newOperatorForm.customDepotCity || 'Hub';
          await InventoryAPI.createLocation({
            name: newOperatorForm.customDepotName.trim(),
            city: customCity,
            state: customState
          });
          await loadDatabaseLocations();
        } catch {
          // ignore duplicate
        }
      }

      await OperatorAPI.create({
        name: newOperatorForm.name.trim(),
        email: newOperatorForm.email.trim().toLowerCase(),
        phone: newOperatorForm.phone.trim().replace(/\D/g, ''),
        assigned_depot: finalDepot,
        password: newOperatorForm.password,
        role: 'operator'
      });

      if (onShowToast) onShowToast(`Sales Operator "${newOperatorForm.name}" created and assigned to ${finalDepot}!`);
      setIsAddOperatorModalOpen(false);
      setNewOperatorForm({
        name: '',
        email: '',
        phone: '',
        assignedDepot: '',
        customDepotName: '',
        customDepotCity: '',
        customDepotState: '',
        password: ''
      });
      setOperatorErrors({});
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
    setNewDepotValue(op.assignedDepot || (activeLocations[0] && activeLocations[0].name) || '');
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
            Manage station operators, terminal credentials, database-configured dispensing depots, and live retail shift throughput.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button size="sm" variant="secondary" icon={Building2} onClick={() => {
            loadDatabaseLocations();
            loadTerritories();
            setIsManageDepotsModalOpen(true);
          }}>
            Manage Depots in DB
          </Button>
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
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-blue)' }}>
                {String(val || 'Operator').toUpperCase()}
              </span>
            )
          },
          {
            header: 'Assigned Station Depot (DB)',
            accessor: 'assignedDepot',
            render: (val) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--brand-cyan)" />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{val || 'General Plant Depot'}</span>
              </div>
            )
          },
          {
            header: 'Terminal Status',
            accessor: 'status',
            render: (val) => <StatusBadge status={val} />
          },
          {
            header: 'Actions',
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
        onClose={() => {
          setIsAddOperatorModalOpen(false);
          setOperatorErrors({});
        }}
        title="Create New Sales Operator Terminal Account"
      >
        <form noValidate onSubmit={handleCreateOperatorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Operator Full Name *</label>
            <Input 
              value={newOperatorForm.name} 
              onChange={e => {
                setNewOperatorForm({ ...newOperatorForm, name: e.target.value });
                if (operatorErrors.name) setOperatorErrors(prev => ({ ...prev, name: null }));
              }} 
              onBlur={() => setOperatorErrors(prev => ({ ...prev, name: validateName(newOperatorForm.name) }))}
              placeholder="e.g. Ramesh Nayak" 
              error={operatorErrors.name}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Email (Login ID) *</label>
              <Input 
                type="email" 
                value={newOperatorForm.email} 
                onChange={e => {
                  setNewOperatorForm({ ...newOperatorForm, email: e.target.value });
                  if (operatorErrors.email) setOperatorErrors(prev => ({ ...prev, email: null }));
                }} 
                onBlur={() => setOperatorErrors(prev => ({ ...prev, email: validateEmail(newOperatorForm.email) }))}
                placeholder="operator@ultrablueplus.com" 
                error={operatorErrors.email}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Mobile Number *</label>
              <Input 
                value={newOperatorForm.phone} 
                maxLength={10}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewOperatorForm({ ...newOperatorForm, phone: val });
                  if (operatorErrors.phone) setOperatorErrors(prev => ({ ...prev, phone: null }));
                }} 
                onBlur={() => setOperatorErrors(prev => ({ ...prev, phone: validatePhone(newOperatorForm.phone) }))}
                placeholder="10-digit mobile number" 
                error={operatorErrors.phone}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Assigned Depot / Dispenser Station (Stored in DB) *</label>
            <Select
              value={newOperatorForm.assignedDepot}
              onChange={e => {
                setNewOperatorForm({ ...newOperatorForm, assignedDepot: e.target.value });
                if (operatorErrors.assignedDepot) setOperatorErrors(prev => ({ ...prev, assignedDepot: null }));
              }}
              options={depotOptions}
              error={operatorErrors.assignedDepot}
            />
          </div>

          {newOperatorForm.assignedDepot === 'Other' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>New Depot / Station Name *</label>
                <Input
                  value={newOperatorForm.customDepotName}
                  onChange={e => setNewOperatorForm({ ...newOperatorForm, customDepotName: e.target.value })}
                  placeholder="e.g. Sambalpur Highway Dispenser Hub"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>State (from DB) *</label>
                  <Select
                    value={newOperatorForm.customDepotState}
                    onChange={e => {
                      const st = e.target.value;
                      const firstCity = (databaseTerritories[st] || [])[0];
                      const defaultCity = typeof firstCity === 'string' ? firstCity : (firstCity?.city || '');
                      setNewOperatorForm({ ...newOperatorForm, customDepotState: st, customDepotCity: defaultCity });
                    }}
                    options={stateOptions}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>City / Hub (from DB) *</label>
                  <Select
                    value={newOperatorForm.customDepotCity}
                    onChange={e => setNewOperatorForm({ ...newOperatorForm, customDepotCity: e.target.value })}
                    options={getCityOptions(newOperatorForm.customDepotState, newOperatorForm.customDepotCity)}
                    disabled={!newOperatorForm.customDepotState || newOperatorForm.customDepotState === 'Other'}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Terminal Login PIN / Password *</label>
            <Input 
              type="password" 
              value={newOperatorForm.password} 
              onChange={e => {
                setNewOperatorForm({ ...newOperatorForm, password: e.target.value });
                if (operatorErrors.password) setOperatorErrors(prev => ({ ...prev, password: null }));
              }} 
              onBlur={() => setOperatorErrors(prev => ({ ...prev, password: validatePin(newOperatorForm.password) }))}
              placeholder="Set 4+ digit PIN / Password" 
              error={operatorErrors.password}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => {
              setIsAddOperatorModalOpen(false);
              setOperatorErrors({});
            }}>Cancel</Button>
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Assigned Station Location (from DB)</label>
            <Select
              value={newDepotValue}
              onChange={e => setNewDepotValue(e.target.value)}
              options={activeLocations.map(l => ({ label: `${l.name} (${l.city || l.state || ''})`, value: l.name }))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsReassignDepotModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>Confirm Assignment</Button>
          </div>
        </form>
      </Modal>

      {/* MANAGE DATABASE DEPOTS MODAL */}
      <Modal
        isOpen={isManageDepotsModalOpen}
        onClose={() => setIsManageDepotsModalOpen(false)}
        title="Manage Database Depots & Dispenser Stations"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
          <form onSubmit={handleCreateDepotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <strong style={{ fontSize: '13px' }}>Add New Depot / Station Location to DB</strong>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Depot / Dispenser Station Name *</label>
              <Input
                value={newDepotForm.name}
                onChange={e => setNewDepotForm({ ...newDepotForm, name: e.target.value })}
                placeholder="e.g. Sambalpur Heavy Haul Highway Hub"
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>State (from DB) *</label>
                <Select
                  value={newDepotForm.state}
                  onChange={e => {
                    const st = e.target.value;
                    const firstCity = (databaseTerritories[st] || [])[0];
                    const defaultCity = typeof firstCity === 'string' ? firstCity : (firstCity?.city || '');
                    setNewDepotForm({ ...newDepotForm, state: st, city: defaultCity, customState: '', customCity: '' });
                  }}
                  options={stateOptions}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>City / Location Hub (from DB) *</label>
                <Select
                  value={newDepotForm.city}
                  onChange={e => setNewDepotForm({ ...newDepotForm, city: e.target.value })}
                  options={getCityOptions(newDepotForm.state, newDepotForm.city)}
                  disabled={!newDepotForm.state || newDepotForm.state === 'Other'}
                  required={newDepotForm.state !== 'Other'}
                />
              </div>
            </div>

            {newDepotForm.state === 'Other' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New State Name *</label>
                  <Input
                    value={newDepotForm.customState}
                    onChange={e => setNewDepotForm({ ...newDepotForm, customState: e.target.value })}
                    placeholder="e.g. Telangana, Jharkhand"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter City Name *</label>
                  <Input
                    value={newDepotForm.customCity}
                    onChange={e => setNewDepotForm({ ...newDepotForm, customCity: e.target.value })}
                    placeholder="e.g. Ranchi, Jamshedpur"
                    required
                  />
                </div>
              </div>
            )}

            {newDepotForm.state !== 'Other' && newDepotForm.city === 'Other' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New City Name for {newDepotForm.state} *</label>
                <Input
                  value={newDepotForm.customCity}
                  onChange={e => setNewDepotForm({ ...newDepotForm, customCity: e.target.value })}
                  placeholder={`Enter city in ${newDepotForm.state}`}
                  required
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Address Details</label>
                <Input
                  value={newDepotForm.address}
                  onChange={e => setNewDepotForm({ ...newDepotForm, address: e.target.value })}
                  placeholder="e.g. NH-53 Industrial Area"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Contact Phone</label>
                <Input
                  value={newDepotForm.phone}
                  onChange={e => setNewDepotForm({ ...newDepotForm, phone: e.target.value })}
                  placeholder="e.g. 9853675971"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" icon={Plus} size="sm">
                Save Depot to Database
              </Button>
            </div>
          </form>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
              Registered Depots in Database ({databaseLocations.length} Stations):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', padding: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
              {databaseLocations.map(loc => {
                const isActive = loc.is_active !== false && loc.is_active !== 0;
                return (
                  <div 
                    key={loc.id || loc.code || loc.name}
                    style={{
                      padding: '10px 14px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: isActive ? 1 : 0.6
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={15} color={isActive ? "var(--brand-cyan)" : "var(--text-muted)"} />
                        <strong>{loc.name}</strong>
                        <span 
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isActive ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                            color: isActive ? 'var(--status-success)' : 'var(--status-danger)'
                          }}
                        >
                          {isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '23px' }}>
                        {loc.city || 'Hub'}, {loc.state || 'Odisha'} {loc.contact_phone ? `• ${loc.contact_phone}` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Active/Deactivate Toggle Button */}
                      <Button
                        size="sm"
                        variant={isActive ? 'ghost' : 'gold'}
                        style={{ color: isActive ? 'var(--status-danger)' : undefined, fontSize: '11px', padding: '4px 8px' }}
                        icon={isActive ? Power : CheckCircle2}
                        onClick={() => handleToggleDepotStatus(loc)}
                        title={isActive ? 'Deactivate Depot' : 'Activate Depot'}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        style={{ padding: '4px 8px' }}
                        icon={Edit2}
                        onClick={() => handleOpenEditDepot(loc)}
                        title="Edit Depot Details"
                      >
                        Edit
                      </Button>

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: 'var(--status-danger)', padding: '4px 8px' }}
                        icon={Trash2}
                        onClick={() => handleDeleteDepot(loc)}
                        title="Delete Depot from Database"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsManageDepotsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT DEPOT MODAL */}
      <Modal
        isOpen={isEditDepotModalOpen}
        onClose={() => setIsEditDepotModalOpen(false)}
        title={`Edit Depot Station: ${editingDepot.name || 'Station'}`}
      >
        <form onSubmit={handleSaveDepotEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Depot / Dispenser Station Name *</label>
            <Input
              value={editingDepot.name}
              onChange={e => setEditingDepot({ ...editingDepot, name: e.target.value })}
              placeholder="e.g. Sambalpur Heavy Haul Highway Hub"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>State (from DB) *</label>
              <Select
                value={editingDepot.state}
                onChange={e => {
                  const st = e.target.value;
                  const firstCity = (databaseTerritories[st] || [])[0];
                  const defaultCity = typeof firstCity === 'string' ? firstCity : (firstCity?.city || '');
                  setEditingDepot({ ...editingDepot, state: st, city: defaultCity, customState: '', customCity: '' });
                }}
                options={stateOptions}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>City / Hub (from DB) *</label>
              <Select
                value={editingDepot.city}
                onChange={e => setEditingDepot({ ...editingDepot, city: e.target.value })}
                options={getCityOptions(editingDepot.state, editingDepot.city)}
                disabled={!editingDepot.state || editingDepot.state === 'Other'}
                required={editingDepot.state !== 'Other'}
              />
            </div>
          </div>

          {editingDepot.state === 'Other' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New State Name *</label>
                <Input
                  value={editingDepot.customState}
                  onChange={e => setEditingDepot({ ...editingDepot, customState: e.target.value })}
                  placeholder="e.g. Telangana, Jharkhand"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter City Name *</label>
                <Input
                  value={editingDepot.customCity}
                  onChange={e => setEditingDepot({ ...editingDepot, customCity: e.target.value })}
                  placeholder="e.g. Ranchi, Jamshedpur"
                  required
                />
              </div>
            </div>
          )}

          {editingDepot.state !== 'Other' && editingDepot.city === 'Other' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Enter New City Name for {editingDepot.state} *</label>
              <Input
                value={editingDepot.customCity}
                onChange={e => setEditingDepot({ ...editingDepot, customCity: e.target.value })}
                placeholder={`Enter city in ${editingDepot.state}`}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Address Details</label>
            <Input
              value={editingDepot.address}
              onChange={e => setEditingDepot({ ...editingDepot, address: e.target.value })}
              placeholder="e.g. NH-53 Industrial Corridor"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Contact Phone</label>
            <Input
              value={editingDepot.phone}
              onChange={e => setEditingDepot({ ...editingDepot, phone: e.target.value })}
              placeholder="e.g. 9853675971"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsEditDepotModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={CheckCircle2}>
              Save Depot Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
