import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Edit2,
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  BadgePercent, 
  Warehouse, 
  Award, 
  Check, 
  Download, 
  Truck,
  Globe,
  Building2,
  Power,
  MapPin,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { ProductAPI, ComplianceAPI, TerritoryAPI, InventoryAPI } from '../../services/api';

// Form Validation Utilities
const validatePhone = (phone, isRequired = false) => {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean) {
    return isRequired ? 'Contact phone number is required.' : '';
  }
  if (clean.length !== 10) {
    return `Phone number must be exactly 10 digits (currently ${clean.length}).`;
  }
  if (!/^[6-9]/.test(clean)) {
    return 'Phone number must start with 6, 7, 8, or 9.';
  }
  return '';
};

const validateRequiredText = (text, fieldName = 'Field', minLength = 2) => {
  if (!text || !String(text).trim()) {
    return `${fieldName} is required.`;
  }
  if (String(text).trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters.`;
  }
  return '';
};

const validateRegionCode = (code) => {
  if (!code || !String(code).trim()) return '';
  const clean = String(code).trim().toUpperCase();
  if (clean.length < 2 || clean.length > 6) {
    return 'Region code should be 2 to 6 characters (e.g. ODI, WBE, GOA).';
  }
  if (!/^[A-Z0-9]+$/.test(clean)) {
    return 'Region code must contain letters/numbers only.';
  }
  return '';
};

export const AdminProductsView = ({ 
  products = [], 
  subTab = 'master',
  onSubTabChange,
  onRefresh, 
  onShowToast, 
  onNavigateToPricing 
}) => {
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  // Loaded Tabs Cache Tracker to prevent redundant network calls
  const loadedTabsRef = useRef({});

  // Form Validation Errors States
  const [depotErrors, setDepotErrors] = useState({});
  const [editDepotErrors, setEditDepotErrors] = useState({});
  const [territoryErrors, setTerritoryErrors] = useState({});
  const [editTerritoryErrors, setEditTerritoryErrors] = useState({});
  const [categoryErrors, setCategoryErrors] = useState({});
  const [packErrors, setPackErrors] = useState({});

  // 1. Dynamic Category Master Registry State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', hsn: '', gst: 18, standard: '', description: '' });

  // 2. Dynamic Pack Sizes Master Registry State
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [packSizesList, setPackSizesList] = useState([]);
  const [packForm, setPackForm] = useState({ name: '', volume: '', type: '', tareWeight: '', nozzle: '', barcodePrefix: '' });

  // 3. Compliance Parameters State
  const [isComplianceParamModalOpen, setIsComplianceParamModalOpen] = useState(false);
  const [complianceParams, setComplianceParams] = useState([]);
  const [paramForm, setParamForm] = useState({ prop: '', unit: '', limit: '', batch: '', method: '' });

  // 4. OEM Approvals State
  const [isOemModalOpen, setIsOemModalOpen] = useState(false);
  const [oemApprovalsList, setOemApprovalsList] = useState([]);
  const [oemForm, setOemForm] = useState({ oem: '', approvalNo: '', engineStandard: '', validDate: '' });

  // 5. Batch Certificates State
  const [isBatchCertModalOpen, setIsBatchCertModalOpen] = useState(false);
  const [batchCertificates, setBatchCertificates] = useState([]);
  const [batchCertForm, setBatchCertForm] = useState({ certNo: '', batchNo: '', location: '', purity: '', density: '', chemist: '' });

  // 6. Dynamic Territories State (States & Cities DB Registry)
  const [databaseTerritories, setDatabaseTerritories] = useState({});
  const [territoriesList, setTerritoriesList] = useState([]);
  const [selectedTerritoryStateFilter, setSelectedTerritoryStateFilter] = useState('ALL');
  const [territoryForm, setTerritoryForm] = useState({ state: '', city: '', customState: '', regionCode: '' });
  const [editingTerritory, setEditingTerritory] = useState({ id: '', state: '', city: '', customState: '', regionCode: '' });
  const [territorySearchQuery, setTerritorySearchQuery] = useState('');
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false);
  const [isEditTerritoryModalOpen, setIsEditTerritoryModalOpen] = useState(false);

  // 7. Dynamic Depots State (Depots & Dispenser Stations DB Registry)
  const [databaseDepots, setDatabaseDepots] = useState([]);
  const [depotStatusFilter, setDepotStatusFilter] = useState('ALL');
  const [isDepotModalOpen, setIsDepotModalOpen] = useState(false);
  const [isEditDepotModalOpen, setIsEditDepotModalOpen] = useState(false);
  const [depotSearchQuery, setDepotSearchQuery] = useState('');
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

  const loadTerritories = async () => {
    try {
      const listData = await TerritoryAPI.getAllList().catch(() => []);
      const list = Array.isArray(listData) ? listData : [];
      const grouped = {};
      list.forEach(item => {
        const st = item.state || 'Other';
        if (!grouped[st]) grouped[st] = [];
        grouped[st].push(item);
      });
      setDatabaseTerritories(grouped);
      setTerritoriesList(list);
      const firstState = Object.keys(grouped)[0] || '';
      const firstCity = firstState && grouped[firstState] ? (typeof grouped[firstState][0] === 'string' ? grouped[firstState][0] : grouped[firstState][0]?.city) : '';
      setNewDepotForm(prev => ({
        ...prev,
        state: prev.state || firstState,
        city: prev.city || firstCity || ''
      }));
    } catch (err) {
      console.error('Error fetching territories:', err);
    }
  };

  const loadDepots = async () => {
    try {
      const data = await InventoryAPI.getLocations(true).catch(() => []);
      if (Array.isArray(data)) {
        setDatabaseDepots(data);
      }
    } catch (err) {
      console.error('Error fetching depots:', err);
    }
  };

  // Targeted, Cached On-Demand Data Fetching per Active SubTab
  useEffect(() => {
    const loadSubTabData = async () => {
      // If data for this specific subTab has already been fetched, skip duplicate network call
      if (loadedTabsRef.current[subTab]) return;

      try {
        switch (subTab) {
          case 'master': {
            const [catsData, packsData] = await Promise.all([
              ProductAPI.getCategories().catch(() => []),
              ComplianceAPI.getPackSizes().catch(() => [])
            ]);
            if (catsData) setCategoriesList(catsData);
            if (packsData) setPackSizesList(packsData);
            loadedTabsRef.current['master'] = true;
            break;
          }
          case 'categories': {
            const catsData = await ProductAPI.getCategories().catch(() => []);
            if (catsData) setCategoriesList(catsData);
            loadedTabsRef.current['categories'] = true;
            break;
          }
          case 'packsizes': {
            const packsData = await ComplianceAPI.getPackSizes().catch(() => []);
            if (packsData) setPackSizesList(packsData);
            loadedTabsRef.current['packsizes'] = true;
            break;
          }
          case 'compliance': {
            const [paramsData, oemsData, certsData] = await Promise.all([
              ComplianceAPI.getParameters().catch(() => []),
              ComplianceAPI.getOemApprovals().catch(() => []),
              ComplianceAPI.getBatchCertificates().catch(() => [])
            ]);
            if (paramsData) setComplianceParams(paramsData);
            if (oemsData) setOemApprovalsList(oemsData);
            if (certsData) setBatchCertificates(certsData);
            loadedTabsRef.current['compliance'] = true;
            break;
          }
          case 'territories': {
            await loadTerritories();
            loadedTabsRef.current['territories'] = true;
            break;
          }
          case 'depots': {
            await Promise.all([
              loadDepots(),
              loadTerritories()
            ]);
            loadedTabsRef.current['depots'] = true;
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error('Error fetching tab-specific database records:', err);
      }
    };

    loadSubTabData();
  }, [subTab]);

  // Simple Product Form State
  const defaultCategory = categoriesList[0]?.name || '';
  const defaultPack = packSizesList[0] || { name: '', volume: '', barcodePrefix: '' };

  const initialProductFormState = {
    name: '',
    category_name: defaultCategory,
    description: '',
    hsn_code: '',
    gst_rate: 18,
    is_gst_inclusive: true,
    pack_variants: [
      { 
        pack_size: defaultPack.name || '', 
        sku: defaultPack.barcodePrefix ? `${defaultPack.barcodePrefix}-01` : '', 
        volume_in_litres: defaultPack.volume || '', 
        standard_mrp: '', 
        distributor_base_price: '', 
        is_popular: true 
      }
    ]
  };

  const [productForm, setProductForm] = useState(initialProductFormState);

  // Sub-menu switcher
  const handleSubSwitch = (key) => {
    if (onSubTabChange) {
      onSubTabChange(key);
    }
  };

  // Category Change Handler with Dynamic HSN & GST Auto-population
  const handleCategorySelect = (catName) => {
    if (catName === '__ADD_NEW__') {
      setIsCustomCategory(true);
      return;
    }
    const matchedCategory = categoriesList.find(c => c.name === catName);
    setProductForm(prev => ({
      ...prev,
      category_name: catName,
      hsn_code: matchedCategory?.hsn || prev.hsn_code,
      gst_rate: matchedCategory?.gst !== undefined ? matchedCategory.gst : prev.gst_rate
    }));
  };

  // Dynamic Pack Variant Handlers
  const handleAddPackVariant = () => {
    // Pick next available pack size from master registry
    const usedNames = (productForm.pack_variants || []).map(pv => pv.pack_size);
    const unusedPack = packSizesList.find(p => !usedNames.includes(p.name)) || packSizesList[0];
    
    const randSku = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newVariant = {
      pack_size: unusedPack.name,
      sku: `${unusedPack.barcodePrefix || 'UBP'}-${randSku}`,
      volume_in_litres: unusedPack.volume || 20,
      standard_mrp: unusedPack.volume * 55 || 1000,
      distributor_base_price: unusedPack.volume * 42 || 780,
      is_popular: false
    };

    setProductForm(prev => ({
      ...prev,
      pack_variants: [...(prev.pack_variants || []), newVariant]
    }));
  };

  const handleSelectPackSize = (index, selectedPackName) => {
    const matchedPack = packSizesList.find(p => p.name === selectedPackName);
    const randSku = Math.random().toString(36).substring(2, 6).toUpperCase();
    setProductForm(prev => {
      const updated = [...(prev.pack_variants || [])];
      updated[index] = {
        ...updated[index],
        pack_size: selectedPackName,
        volume_in_litres: matchedPack ? matchedPack.volume : updated[index].volume_in_litres,
        sku: matchedPack ? `${matchedPack.barcodePrefix}-${randSku}` : updated[index].sku
      };
      return { ...prev, pack_variants: updated };
    });
  };

  const handleRemovePackVariant = (index) => {
    if ((productForm.pack_variants || []).length <= 1) {
      if (onShowToast) onShowToast('A product must have at least one pack size.');
      return;
    }
    setProductForm(prev => ({
      ...prev,
      pack_variants: prev.pack_variants.filter((_, idx) => idx !== index)
    }));
  };

  const handlePackVariantPriceChange = (index, field, value) => {
    setProductForm(prev => {
      const updated = [...(prev.pack_variants || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, pack_variants: updated };
    });
  };

  // Product Open / Edit Handlers
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setIsCustomCategory(false);
    setCustomCategoryText('');
    const firstCat = categoriesList[0];
    const defaultPacks = packSizesList.slice(0, 3).map((p) => {
      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      return {
        pack_size: p.name,
        sku: `${p.barcodePrefix || 'UBP'}-${randSuffix}`,
        volume_in_litres: p.volume,
        standard_mrp: p.volume === 5 ? 340 : p.volume === 20 ? 1150 : p.volume * 50,
        distributor_base_price: p.volume === 5 ? 260 : p.volume === 20 ? 880 : p.volume * 38,
        is_popular: p.volume === 20
      };
    });

    setProductForm({
      name: '',
      category_name: firstCat?.name || '',
      description: '',
      hsn_code: firstCat?.hsn || '31021000',
      gst_rate: firstCat?.gst || 18,
      is_gst_inclusive: true,
      pack_variants: defaultPacks.length > 0 ? defaultPacks : initialProductFormState.pack_variants
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProductId(prod.id);
    setIsCustomCategory(false);
    setCustomCategoryText('');
    
    // Map existing product pack options or fallback to master pack sizes
    const existingVariants = (prod.packOptions && prod.packOptions.length > 0)
      ? prod.packOptions.map((po, idx) => ({
          id: po.id,
          pack_size: po.size || `${po.volume || 20}L Pack`,
          sku: po.sku || `UB-${po.size || 'PACK'}-${idx + 1}`,
          volume_in_litres: po.volume || 20,
          standard_mrp: po.mrp || 1000,
          distributor_base_price: po.distributorBasePrice || (po.mrp ? po.mrp * 0.75 : 800),
          is_popular: Boolean(po.isBestSeller)
        }))
      : [
          { pack_size: '20L Bucket / Canister', sku: `UBP-20L-01`, volume_in_litres: 20, standard_mrp: 1150, distributor_base_price: 880, is_popular: true }
        ];

    setProductForm({
      name: prod.name || '',
      category_name: prod.category || defaultCategory,
      description: prod.description || '',
      hsn_code: prod.hsnCode || '31021000',
      gst_rate: prod.gstRate !== undefined ? prod.gstRate : 18,
      is_gst_inclusive: prod.isGstInclusive !== undefined ? prod.isGstInclusive : true,
      pack_variants: existingVariants
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name) {
      if (onShowToast) onShowToast('Please enter a product title.');
      return;
    }
    const finalCategory = isCustomCategory ? customCategoryText.trim() : productForm.category_name;
    if (!finalCategory) {
      if (onShowToast) onShowToast('Please select a product category.');
      return;
    }

    try {
      const payload = {
        name: productForm.name,
        category_name: finalCategory,
        description: productForm.description || `${finalCategory} manufactured to highest quality standards.`,
        image_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
        badge: `${finalCategory.split(' ')[0]} • High Quality`,
        offer_tag: 'Factory Direct Deal',
        offer_discount: '10% OFF',
        hsn_code: productForm.hsn_code || '31021000',
        gst_rate: parseFloat(productForm.gst_rate) || 18,
        is_gst_inclusive: Boolean(productForm.is_gst_inclusive),
        iso_standard: 'ISO 22241-1 / IS 17042',
        is_isi_marked: true,
        is_bis_compliant: true,
        isi_number: 'IS 17042:2018 (CM/L-84001923)',
        bis_licence: 'CM/L-84001923',
        features: [
          'High purity formulation meeting strict industrial tolerances',
          'Protects equipment systems from premature crystallization & wear',
          'Direct from Bhadrak mother plant with verified lab test batch report'
        ],
        pack_variants: (productForm.pack_variants || []).map(pv => ({
          id: pv.id,
          sku: pv.sku || `UB-${Date.now()}`,
          pack_size: pv.pack_size,
          volume_in_litres: parseFloat(pv.volume_in_litres) || 20,
          standard_mrp: parseFloat(pv.standard_mrp) || 0,
          distributor_base_price: parseFloat(pv.distributor_base_price) || 0,
          is_popular: Boolean(pv.is_popular)
        }))
      };

      if (editingProductId) {
        await ProductAPI.update(editingProductId, payload);
        if (onShowToast) onShowToast(`Product "${payload.name}" updated successfully!`);
      } else {
        await ProductAPI.create(payload);
        if (onShowToast) onShowToast(`Product "${payload.name}" created and saved!`);
      }
      setIsProductModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error saving product.');
    }
  };

  const handleDeleteProduct = async (prodId, prodName) => {
    if (!window.confirm(`Are you sure you want to delete "${prodName}"?`)) return;
    try {
      await ProductAPI.delete(prodId);
      if (onShowToast) onShowToast(`Product "${prodName}" deleted.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error deleting product.');
    }
  };

  // Category Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) return;
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || ''
      };
      const res = await ProductAPI.createCategory(payload);
      if (res.data) {
        setCategoriesList(prev => [...prev, res.data]);
      }
      if (onShowToast) onShowToast(`Category "${categoryForm.name}" created in database.`);
      setIsCategoryModalOpen(false);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to create category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await ProductAPI.deleteCategory(id);
      setCategoriesList(prev => prev.filter(c => c.id !== id));
      if (onShowToast) onShowToast(`Category "${name}" deleted.`);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to delete category: ${err.message}`);
    }
  };

  // Pack Size Save
  const handleSavePackSize = async (e) => {
    e.preventDefault();
    if (!packForm.name) return;
    try {
      const payload = {
        name: packForm.name,
        volume: parseFloat(packForm.volume) || 20,
        type: packForm.type || '',
        handle: packForm.handle || '',
        tare_weight: packForm.tareWeight || '',
        nozzle: packForm.nozzle || '',
        barcode_prefix: packForm.barcodePrefix || 'UBP'
      };
      const res = await ComplianceAPI.createPackSize(payload);
      if (res.data) {
        setPackSizesList(prev => [...prev, res.data]);
      }
      if (onShowToast) onShowToast(`Pack size "${packForm.name}" added to database registry.`);
      setIsPackModalOpen(false);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to add pack size: ${err.message}`);
    }
  };

  const handleDeletePackSize = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete pack size "${name}"?`)) return;
    try {
      await ComplianceAPI.deletePackSize(id);
      setPackSizesList(prev => prev.filter(p => p.id !== id));
      if (onShowToast) onShowToast(`Pack size "${name}" deleted from database.`);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to delete pack size: ${err.message}`);
    }
  };

  // Compliance Parameter Save
  const handleSaveParam = async (e) => {
    e.preventDefault();
    if (!paramForm.prop) return;
    try {
      const payload = {
        prop: paramForm.prop,
        unit: paramForm.unit || '%',
        limit: paramForm.limit || 'Standard Limit',
        batch: paramForm.batch || 'Verified',
        method: paramForm.method || 'ISO Standard Testing'
      };
      const res = await ComplianceAPI.createParameter(payload);
      if (res.data) {
        setComplianceParams(prev => [...prev, res.data]);
      }
      if (onShowToast) onShowToast(`Compliance parameter "${paramForm.prop}" saved to database.`);
      setIsComplianceParamModalOpen(false);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to save parameter: ${err.message}`);
    }
  };

  const handleDeleteParam = async (id, propName) => {
    if (!window.confirm(`Are you sure you want to remove compliance parameter "${propName}"?`)) return;
    try {
      await ComplianceAPI.deleteParameter(id);
      setComplianceParams(prev => prev.filter(p => p.id !== id));
      if (onShowToast) onShowToast(`Compliance parameter "${propName}" removed from database.`);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to delete parameter: ${err.message}`);
    }
  };

  // OEM Approval Save
  const handleSaveOem = async (e) => {
    e.preventDefault();
    if (!oemForm.oem) return;
    try {
      const payload = {
        oem: oemForm.oem,
        approval_no: oemForm.approvalNo,
        engine_standard: oemForm.engineStandard || 'BS-VI SCR Platform',
        valid_date: oemForm.validDate || '31-Dec-2027',
        status: 'APPROVED'
      };
      const res = await ComplianceAPI.createOemApproval(payload);
      if (res.data) {
        setOemApprovalsList(prev => [...prev, res.data]);
      }
      if (onShowToast) onShowToast(`OEM approval for "${oemForm.oem}" saved to database.`);
      setIsOemModalOpen(false);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to save OEM approval: ${err.message}`);
    }
  };

  const handleDeleteOem = async (id, oemName) => {
    if (!window.confirm(`Are you sure you want to delete OEM approval for "${oemName}"?`)) return;
    try {
      await ComplianceAPI.deleteOemApproval(id);
      setOemApprovalsList(prev => prev.filter(o => o.id !== id));
      if (onShowToast) onShowToast(`OEM approval for "${oemName}" removed from database.`);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to delete OEM approval: ${err.message}`);
    }
  };

  // Batch Certificate Save
  const handleSaveBatchCert = async (e) => {
    e.preventDefault();
    if (!batchCertForm.certNo) return;
    try {
      const payload = {
        cert_no: batchCertForm.certNo,
        batch_no: batchCertForm.batchNo,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        location: batchCertForm.location || 'Bhadrak Mother Plant',
        purity: batchCertForm.purity || '32.5% Urea',
        density: batchCertForm.density || '1.0895 g/cm³',
        chemist: batchCertForm.chemist || 'Dr. A. K. Mohapatra',
        status: 'PASSED'
      };
      const res = await ComplianceAPI.createBatchCertificate(payload);
      if (res.data) {
        setBatchCertificates(prev => [res.data, ...prev]);
      }
      if (onShowToast) onShowToast(`Quality certificate "${batchCertForm.certNo}" issued & saved in database.`);
      setIsBatchCertModalOpen(false);
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to issue batch certificate: ${err.message}`);
    }
  };

  // Territories handlers with Validation
  const handleSaveTerritory = async (e) => {
    e.preventDefault();
    const finalState = territoryForm.state === 'Other' ? territoryForm.customState.trim() : territoryForm.state.trim();
    const finalCity = territoryForm.city.trim();

    const errors = {};
    const stateErr = validateRequiredText(finalState, 'State Name', 2);
    if (stateErr) errors.state = stateErr;

    const cityErr = validateRequiredText(finalCity, 'City Name', 2);
    if (cityErr) errors.city = cityErr;

    const codeErr = validateRegionCode(territoryForm.regionCode);
    if (codeErr) errors.regionCode = codeErr;

    if (Object.keys(errors).length > 0) {
      setTerritoryErrors(errors);
      if (onShowToast) onShowToast('Please correct the highlighted territory errors.');
      return;
    }

    try {
      await TerritoryAPI.create(finalState, finalCity);
      if (onShowToast) onShowToast(`Territory "${finalCity}, ${finalState}" added to database.`);
      setTerritoryForm({ state: '', city: '', customState: '', regionCode: '' });
      setTerritoryErrors({});
      setIsTerritoryModalOpen(false);
      await loadTerritories();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error saving territory to database.');
    }
  };

  const handleDeleteTerritoryCity = async (cityItem, stateName) => {
    const cityName = typeof cityItem === 'string' ? cityItem : (cityItem.city || '');
    const cityId = typeof cityItem === 'object' ? cityItem.id : (territoriesList.find(t => t.city === cityName && (!stateName || t.state === stateName))?.id);
    if (!window.confirm(`Are you sure you want to remove "${cityName}${stateName ? `, ${stateName}` : ''}" from the database?`)) return;
    try {
      if (cityId) {
        await TerritoryAPI.delete(cityId);
      } else {
        const list = databaseTerritories[stateName] || [];
        const found = list.find(item => (typeof item === 'object' && item.city === cityName));
        if (found?.id) await TerritoryAPI.delete(found.id);
      }
      if (onShowToast) onShowToast(`City "${cityName}" removed from database.`);
      await loadTerritories();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error deleting territory.');
    }
  };

  const handleOpenEditTerritory = (t) => {
    setEditingTerritory({
      id: t.id,
      state: t.state || '',
      city: t.city || '',
      customState: '',
      regionCode: t.region_code || ''
    });
    setEditTerritoryErrors({});
    setIsEditTerritoryModalOpen(true);
  };

  const handleSaveEditTerritory = async (e) => {
    e.preventDefault();
    const finalState = editingTerritory.state === 'Other' ? editingTerritory.customState.trim() : editingTerritory.state.trim();
    const finalCity = editingTerritory.city.trim();

    const errors = {};
    const stateErr = validateRequiredText(finalState, 'State Name', 2);
    if (stateErr) errors.state = stateErr;

    const cityErr = validateRequiredText(finalCity, 'City Name', 2);
    if (cityErr) errors.city = cityErr;

    const codeErr = validateRegionCode(editingTerritory.regionCode);
    if (codeErr) errors.regionCode = codeErr;

    if (Object.keys(errors).length > 0) {
      setEditTerritoryErrors(errors);
      if (onShowToast) onShowToast('Please correct the highlighted territory errors.');
      return;
    }

    try {
      await TerritoryAPI.update(editingTerritory.id, {
        state: finalState,
        city: finalCity,
        region_code: editingTerritory.regionCode ? editingTerritory.regionCode.trim() : undefined
      });
      if (onShowToast) onShowToast(`Territory "${finalCity}, ${finalState}" updated in database.`);
      setEditTerritoryErrors({});
      setIsEditTerritoryModalOpen(false);
      await loadTerritories();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating territory.');
    }
  };

  // Depots handlers with Validation
  const handleCreateDepotSubmit = async (e) => {
    e.preventDefault();
    const finalState = newDepotForm.state === 'Other' ? newDepotForm.customState.trim() : newDepotForm.state.trim();
    const finalCity = (newDepotForm.state === 'Other' || newDepotForm.city === 'Other') ? newDepotForm.customCity.trim() : newDepotForm.city.trim();

    const errors = {};
    const nameErr = validateRequiredText(newDepotForm.name, 'Depot / Station Name', 3);
    if (nameErr) errors.name = nameErr;

    const stateErr = validateRequiredText(finalState, 'State', 2);
    if (stateErr) errors.state = stateErr;

    const cityErr = validateRequiredText(finalCity, 'City Hub', 2);
    if (cityErr) errors.city = cityErr;

    const phoneErr = validatePhone(newDepotForm.phone, false);
    if (phoneErr) errors.phone = phoneErr;

    if (Object.keys(errors).length > 0) {
      setDepotErrors(errors);
      if (onShowToast) onShowToast('Please resolve the highlighted validation errors.');
      return;
    }

    try {
      if ((newDepotForm.state === 'Other' && finalState) || (newDepotForm.city === 'Other' && finalCity)) {
        try {
          await TerritoryAPI.create(finalState, finalCity);
          await loadTerritories();
        } catch {}
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
      setDepotErrors({});
      setIsDepotModalOpen(false);
      await loadDepots();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error saving depot.');
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
    setEditDepotErrors({});
    setIsEditDepotModalOpen(true);
  };

  const handleSaveDepotEditSubmit = async (e) => {
    e.preventDefault();
    const finalState = editingDepot.state === 'Other' ? editingDepot.customState.trim() : editingDepot.state.trim();
    const finalCity = (editingDepot.state === 'Other' || editingDepot.city === 'Other') ? editingDepot.customCity.trim() : editingDepot.city.trim();

    const errors = {};
    const nameErr = validateRequiredText(editingDepot.name, 'Depot Name', 3);
    if (nameErr) errors.name = nameErr;

    const stateErr = validateRequiredText(finalState, 'State', 2);
    if (stateErr) errors.state = stateErr;

    const cityErr = validateRequiredText(finalCity, 'City Hub', 2);
    if (cityErr) errors.city = cityErr;

    const phoneErr = validatePhone(editingDepot.phone, false);
    if (phoneErr) errors.phone = phoneErr;

    if (Object.keys(errors).length > 0) {
      setEditDepotErrors(errors);
      if (onShowToast) onShowToast('Please resolve the highlighted validation errors.');
      return;
    }

    try {
      if ((editingDepot.state === 'Other' && finalState) || (editingDepot.city === 'Other' && finalCity)) {
        try {
          await TerritoryAPI.create(finalState, finalCity);
          await loadTerritories();
        } catch {}
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
      setEditDepotErrors({});
      setIsEditDepotModalOpen(false);
      await loadDepots();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating depot.');
    }
  };

  const handleToggleDepotStatus = async (depot) => {
    try {
      const res = await InventoryAPI.toggleLocationStatus(depot.id);
      if (onShowToast) onShowToast(res.message || `Depot status updated.`);
      await loadDepots();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error toggling status.');
    }
  };

  const handleDeleteDepot = async (depot) => {
    if (!window.confirm(`Are you sure you want to permanently delete depot "${depot.name}" from database?`)) return;
    try {
      await InventoryAPI.deleteLocation(depot.id);
      if (onShowToast) onShowToast(`Depot "${depot.name}" deleted.`);
      await loadDepots();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error deleting depot.');
    }
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SUB-MENU NAVIGATION PILLS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'master', label: 'Product Master', icon: Package, count: products.length },
            { id: 'categories', label: 'Product Categories', icon: Layers, count: categoriesList.length },
            { id: 'packsizes', label: 'Pack Sizes & Variants', icon: Warehouse, count: packSizesList.length },
            { id: 'compliance', label: 'ISO / BIS Compliance', icon: ShieldCheck, badge: 'Verified' },
            { id: 'territories', label: 'States & Territories', icon: Globe, count: Object.keys(databaseTerritories).length },
            { id: 'depots', label: 'Depots & Stations', icon: Building2, count: databaseDepots.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSubSwitch(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid var(--brand-blue)' : '1px solid var(--border-subtle)',
                  backgroundColor: isActive ? 'var(--brand-blue)' : 'var(--bg-app)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={15} color={isActive ? '#FFFFFF' : 'var(--brand-cyan)'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card)',
                    color: isActive ? '#FFFFFF' : 'var(--text-muted)'
                  }}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(0, 200, 245, 0.2)', color: isActive ? '#FFFFFF' : 'var(--brand-cyan)' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-VIEW: PRODUCT MASTER CATALOGUE */}
      {/* ========================================================================= */}
      {subTab === 'master' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Action & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--brand-blue)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Master Products Catalogue</h3>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Products linked with master dynamic categories and standard packaging specifications.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search products, SKU, category..."
                  style={{
                    padding: '8px 12px 8px 30px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    width: '240px'
                  }}
                />
              </div>

              <Button size="sm" variant="gold" icon={Plus} onClick={handleOpenAddProduct}>
                Add Product
              </Button>
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>Category:</span>
            {['ALL', ...categoriesList.map(c => c.name)].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setProductCategoryFilter(cat)}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: productCategoryFilter === cat ? 'var(--brand-blue)' : 'var(--border-medium)',
                  backgroundColor: productCategoryFilter === cat ? 'var(--brand-blue)' : 'var(--bg-card)',
                  color: productCategoryFilter === cat ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {products
              .filter(prod => {
                const matchCat = productCategoryFilter === 'ALL' || prod.category === productCategoryFilter || (productCategoryFilter.includes('DEF') && prod.category?.includes('DEF'));
                const q = productSearchQuery.toLowerCase();
                const matchSearch = !q || prod.name?.toLowerCase().includes(q) || prod.category?.toLowerCase().includes(q) || prod.hsnCode?.toLowerCase().includes(q) || (prod.packOptions || []).some(po => po.sku?.toLowerCase().includes(q) || po.size?.toLowerCase().includes(q));
                return matchCat && matchSearch;
              })
              .map(prod => (
                <div key={prod.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
                  {/* Card Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to right, rgba(0, 86, 210, 0.05), transparent)' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                        {prod.category}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{prod.name}</h4>
                    </div>
                    {prod.badge && (
                      <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', border: '1px solid rgba(0, 200, 245, 0.3)', padding: '3px 8px', borderRadius: '4px' }}>
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {prod.description || 'Premium grade chemical & fluid engineered for high performance operations.'}
                    </p>

                    {/* Tax & HSN Strip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', backgroundColor: 'var(--bg-app)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>HSN:</span> <strong>{prod.hsnCode || '31021000'}</strong></div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>GST:</span>{' '}
                        <strong style={{ color: 'var(--brand-blue)' }}>{prod.gstRate || 18}%</strong>
                      </div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Quality:</span> <strong>{prod.isoStandard || 'ISO Verified'}</strong></div>
                    </div>

                    {/* Configured Pack Sizes */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Available Packaging Variants ({(prod.packOptions || []).length}):</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(prod.packOptions || []).map((po, idx) => {
                          const basePrice = po.distributorBasePrice || (po.mrp * 0.75);
                          const mrp = po.mrp || 0;
                          return (
                            <div
                              key={po.id || idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                backgroundColor: 'var(--bg-app)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '11px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Warehouse size={13} color="var(--brand-cyan)" />
                                <strong style={{ color: 'var(--text-primary)' }}>{po.size}</strong>
                                {po.isBestSeller && (
                                  <span style={{ backgroundColor: 'var(--brand-gold)', color: '#000', fontSize: '9px', fontWeight: 800, padding: '1px 4px', borderRadius: '3px' }}>
                                    Popular
                                  </span>
                                )}
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--brand-blue)', marginRight: '8px' }}>
                                  MRP: ₹{mrp.toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  Dist: ₹{basePrice.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button size="sm" variant="secondary" icon={Edit3} onClick={() => handleOpenEditProduct(prod)}>
                      Edit Product
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px' }}
                      title="Delete product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. SUB-VIEW: PRODUCT CATEGORIES (DATATABLE) */}
      {/* ========================================================================= */}
      {subTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Category Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <KPICard
              title="Configured Categories"
              value={`${categoriesList.length} Groups`}
              subtext="Dynamic master category registry"
              icon={Layers}
              delta="Live"
              isPositive={true}
            />
            <KPICard
              title="Assigned Products"
              value={`${products.length} Products`}
              subtext="Catalogued across categories"
              icon={Package}
              isPositive={true}
            />
            <KPICard
              title="Standard Tax Matrix"
              value="18% Standard GST"
              subtext="Auto-populated in products"
              icon={BadgePercent}
              isPositive={true}
            />
          </div>

          <DataTable
            title="Product Categories & HSN Codes"
            subtitle="Categories created here appear dynamically across all product creation forms."
            data={categoriesList}
            searchPlaceholder="Search category name, code, HSN..."
            pageSize={10}
            pageSizeOptions={[5, 10, 25, 50]}
            actions={
              <Button size="sm" variant="gold" icon={Plus} onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', code: '', hsn: '31021000', gst: 18, standard: '', description: '' });
                setIsCategoryModalOpen(true);
              }}>
                Add Category
              </Button>
            }
            columns={[
              {
                header: '#',
                accessor: 'id',
                width: '50px',
                render: (_, __, rowIdx) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{rowIdx + 1}</span>
              },
              {
                header: 'Category Name',
                accessor: 'name',
                render: (val, row) => (
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{val}</strong>
                    {row.description && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.description}</span>}
                  </div>
                )
              },
              {
                header: 'Category Code',
                accessor: 'code',
                render: (val) => (
                  <span style={{ backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>
                    {val}
                  </span>
                )
              },
              {
                header: 'HSN Code',
                accessor: 'hsn',
                render: (val) => <span style={{ fontWeight: 600 }}>{val || '31021000'}</span>
              },
              {
                header: 'Default GST',
                accessor: 'gst',
                render: (val) => <span style={{ fontWeight: 700, color: 'var(--brand-blue)' }}>{val || 18}%</span>
              },
              {
                header: 'Industry Standard',
                accessor: 'standard',
                render: (val) => <span>{val || 'ISO / BIS'}</span>
              },
              {
                header: 'Actions',
                accessor: 'actions',
                align: 'right',
                render: (_, row) => (
                  <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                    <Button size="sm" variant="ghost" icon={Edit3} onClick={() => {
                      setEditingCategory(row);
                      setCategoryForm({ name: row.name, code: row.code || `CAT-${row.name.slice(0, 3).toUpperCase()}`, hsn: row.hsn || '31021000', gst: row.gst || 18, standard: row.standard || 'ISO / BIS', description: row.description || '' });
                      setIsCategoryModalOpen(true);
                    }}>
                      Edit
                    </Button>
                    <button
                      onClick={() => handleDeleteCategory(row.id, row.name)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px' }}
                      title={`Delete category ${row.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: PACK SIZES & VARIANTS (DATATABLE) */}
      {/* ========================================================================= */}
      {subTab === 'packsizes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <DataTable
            title="Master Pack Sizes & Variants Registry"
            subtitle="Packaging sizes configured here automatically populate across packaging dropdowns."
            data={packSizesList}
            searchPlaceholder="Search pack name, volume, material..."
            pageSize={10}
            pageSizeOptions={[5, 10, 25, 50]}
            actions={
              <Button size="sm" variant="gold" icon={Plus} onClick={() => {
                setPackForm({ name: '', volume: 20, type: '', tareWeight: '', nozzle: '', barcodePrefix: '' });
                setIsPackModalOpen(true);
              }}>
                Add Master Pack Size
              </Button>
            }
            columns={[
              {
                header: '#',
                accessor: 'id',
                width: '50px',
                render: (_, __, rowIdx) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{rowIdx + 1}</span>
              },
              {
                header: 'Packaging Variant',
                accessor: 'name',
                render: (val, row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Warehouse size={16} color="var(--brand-cyan)" />
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 700 }}>{row.volume} Litres Net</div>
                    </div>
                  </div>
                )
              },
              {
                header: 'Barcode Prefix',
                accessor: 'barcodePrefix',
                render: (val) => (
                  <span style={{ backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {val || 'UBP'}
                  </span>
                )
              },
              {
                header: 'Container Material',
                accessor: 'type',
                render: (val) => <span>{val || 'Standard Poly HDPE'}</span>
              },
              {
                header: 'Tare Weight',
                accessor: 'tareWeight',
                render: (val) => <span>{val || 'Standard Weight'}</span>
              },
              {
                header: 'Dispensing Mechanism',
                accessor: 'nozzle',
                render: (val) => <span>{val || 'Integrated Spout Nozzle'}</span>
              },
              {
                header: 'Status',
                accessor: 'status',
                render: () => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'var(--status-success)', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <Check size={11} /> ACTIVE
                  </span>
                )
              },
              {
                header: 'Actions',
                accessor: 'actions',
                align: 'right',
                render: (_, row) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    style={{ color: 'var(--status-danger)', padding: '4px 8px' }}
                    icon={Trash2}
                    onClick={() => handleDeletePackSize(row.id, row.name)}
                    title={`Delete ${row.name}`}
                  />
                )
              }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-VIEW: TECHNICAL SPECS & ISO / BIS COMPLIANCE (DATATABLES) */}
      {/* ========================================================================= */}
      {subTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Banner */}
          <div style={{ background: 'linear-gradient(135deg, #040D1E 0%, #06142F 100%)', color: '#FFFFFF', padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--brand-navy-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-gold)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              <Award size={16} />
              <span>Ayush Green Energy • Quality Assurance & Certification Matrix</span>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              ISO 22241-1 / IS 17042:2018 Technical Parameter Registry
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-on-dark-secondary)', maxWidth: '780px', lineHeight: 1.5 }}>
              Batch allocation limits, closed-loop de-ionized EDI blending criteria, and BIS CM/L-84001923 verified testing standards.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <KPICard
              title="BIS Mark License"
              value="CM/L-84001923"
              subtext="IS 17042:2018 Official Certification"
              icon={ShieldCheck}
              delta="Active License"
              isPositive={true}
            />
            <KPICard
              title="Active OEM Approvals"
              value={`${oemApprovalsList.length} Manufacturers`}
              subtext="Tata, Ashok Leyland, BharatBenz..."
              icon={Truck}
              isPositive={true}
            />
            <KPICard
              title="Lab Test Purity Average"
              value="32.5% Urea AUS 32"
              subtext="EDI Water base <0.08 µS/cm"
              icon={Award}
              isPositive={true}
            />
          </div>

          {/* ISO 22241 Parameters DataTable */}
          <DataTable
            title="UltraBlue+ DEF ISO 22241 Quality Standard Limit Table"
            subtitle="Standard laboratory testing limits vs UltraBlue+ verified batch average."
            data={complianceParams}
            searchPlaceholder="Search parameter, unit, test method..."
            pageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="gold" icon={Plus} onClick={() => {
                  setParamForm({ prop: '', unit: '%', limit: '', batch: '', method: '' });
                  setIsComplianceParamModalOpen(true);
                }}>
                  Add Parameter
                </Button>
                <Button size="sm" variant="secondary" icon={Download} onClick={() => {
                  if (onShowToast) onShowToast('Downloaded Quality Specification Sheet (PDF).');
                }}>
                  Download Lab Sheet
                </Button>
              </div>
            }
            columns={[
              {
                header: '#',
                accessor: 'id',
                width: '50px',
                render: (_, __, rowIdx) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{rowIdx + 1}</span>
              },
              {
                header: 'Parameter Property',
                accessor: 'prop',
                render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
              },
              {
                header: 'Unit',
                accessor: 'unit',
                render: (val) => <span style={{ color: 'var(--text-muted)' }}>{val}</span>
              },
              {
                header: 'ISO Standard Limits',
                accessor: 'limit',
                render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>
              },
              {
                header: 'UltraBlue+ Batch Avg',
                accessor: 'batch',
                render: (val) => <span style={{ fontWeight: 700, color: 'var(--brand-blue)' }}>{val}</span>
              },
              {
                header: 'Test Method',
                accessor: 'method',
                render: (val) => <span style={{ color: 'var(--text-muted)' }}>{val}</span>
              },
              {
                header: 'Status',
                accessor: 'status',
                render: () => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--status-success)', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                    <Check size={12} /> Compliant
                  </span>
                )
              },
              {
                header: 'Action',
                accessor: 'action',
                align: 'right',
                render: (_, row) => (
                  <button
                    onClick={() => handleDeleteParam(row.id, row.prop)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    title={`Delete parameter ${row.prop}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )
              }
            ]}
          />

          {/* OEM Approvals Directory DataTable */}
          <DataTable
            title="OEM Manufacturer Approvals Directory"
            subtitle="Approvals from leading commercial vehicle manufacturers and engine builders."
            data={oemApprovalsList}
            searchPlaceholder="Search vehicle manufacturer, approval no, engine standard..."
            pageSize={10}
            pageSizeOptions={[5, 10, 20]}
            actions={
              <Button size="sm" variant="primary" icon={Plus} onClick={() => {
                setOemForm({ oem: '', approvalNo: '', engineStandard: '', validDate: '31-Dec-2027' });
                setIsOemModalOpen(true);
              }}>
                Add OEM Approval
              </Button>
            }
            columns={[
              {
                header: '#',
                accessor: 'id',
                width: '50px',
                render: (_, __, rowIdx) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{rowIdx + 1}</span>
              },
              {
                header: 'Vehicle Manufacturer (OEM)',
                accessor: 'oem',
                render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
              },
              {
                header: 'Approval Ref No.',
                accessor: 'approvalNo',
                render: (val, row) => (
                  <span style={{ backgroundColor: 'rgba(0, 86, 210, 0.08)', color: 'var(--brand-blue)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>
                    {val || row.approval_no}
                  </span>
                )
              },
              {
                header: 'Engine Standard / System',
                accessor: 'engineStandard',
                render: (val, row) => <span style={{ color: 'var(--text-secondary)' }}>{val || row.engine_standard}</span>
              },
              {
                header: 'Validity',
                accessor: 'validDate',
                render: (val, row) => <span style={{ color: 'var(--text-muted)' }}>{val || row.valid_date}</span>
              },
              {
                header: 'Status',
                accessor: 'status',
                render: (val) => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--status-success)', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                    <Check size={12} /> {val || 'APPROVED'}
                  </span>
                )
              },
              {
                header: 'Action',
                accessor: 'action',
                align: 'right',
                render: (_, row) => (
                  <button
                    onClick={() => handleDeleteOem(row.id, row.oem)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    title={`Delete OEM approval for ${row.oem}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )
              }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-VIEW: MASTER STATES & REGIONAL TERRITORIES (DB) - DATATABLE */}
      {/* ========================================================================= */}
      {subTab === 'territories' && (() => {
        const stateListOptions = [
          { value: 'ALL', label: `All States (${Object.keys(databaseTerritories).length})` },
          ...Object.keys(databaseTerritories).sort().map(s => ({
            value: s,
            label: `${s} (${(databaseTerritories[s] || []).length} hubs)`
          }))
        ];

        const filteredTerritories = territoriesList.filter(t => {
          if (selectedTerritoryStateFilter !== 'ALL' && t.state !== selectedTerritoryStateFilter) return false;
          return true;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Registered Hubs</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{territoriesList.length}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>Active States</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-cyan)', marginTop: '4px' }}>{Object.keys(databaseTerritories).length}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 600, textTransform: 'uppercase' }}>Database Status</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-success)', marginTop: '4px' }}>Synced (Live DB)</div>
              </div>
            </div>

            {/* Enhanced DataTable with Pagination, Page Size Selector, State Filter, and Search */}
            <DataTable
              title="Master States & Regional Territories (DB)"
              subtitle="Database-persisted geographical territories for distributor allocation, depot mapping, and supply logistics."
              data={filteredTerritories}
              searchPlaceholder="Search city, state, code..."
              pageSize={10}
              pageSizeOptions={[5, 10, 25, 50, 100]}
              filterComponent={
                <div style={{ minWidth: '180px' }}>
                  <Select
                    value={selectedTerritoryStateFilter}
                    onChange={e => setSelectedTerritoryStateFilter(e.target.value)}
                    options={stateListOptions}
                  />
                </div>
              }
              actions={
                <Button size="sm" variant="primary" icon={Plus} onClick={() => { setTerritoryForm({ state: '', city: '', customState: '', regionCode: '' }); setIsTerritoryModalOpen(true); }}>
                  Add State / City
                </Button>
              }
              columns={[
                {
                  header: '#',
                  accessor: 'id',
                  width: '50px',
                  render: (_, __, rowIdx) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{rowIdx + 1}</span>
                },
                {
                  header: 'State / Territory',
                  accessor: 'state',
                  render: (val) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: 'rgba(0, 102, 204, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)', fontWeight: 800, fontSize: '11px' }}>
                        {(val || 'IN').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
                    </div>
                  )
                },
                {
                  header: 'City / Commercial Hub',
                  accessor: 'city',
                  render: (val) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--brand-cyan)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{val}</span>
                    </div>
                  )
                },
                {
                  header: 'Region Code',
                  accessor: 'region_code',
                  render: (val, row) => (
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                      {val || `${(row.state || 'IN').slice(0, 3).toUpperCase()}`}
                    </span>
                  )
                },
                {
                  header: 'Status',
                  accessor: 'is_active',
                  render: () => (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'var(--status-success)', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <Check size={11} /> ACTIVE
                    </span>
                  )
                },
                {
                  header: 'Actions',
                  accessor: 'actions',
                  align: 'right',
                  render: (_, row) => (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        icon={Edit2}
                        onClick={() => handleOpenEditTerritory(row)}
                        title="Edit State / City"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: 'var(--status-danger)', padding: '4px 8px' }}
                        icon={Trash2}
                        onClick={() => handleDeleteTerritoryCity(row, row.state)}
                        title="Delete Territory from DB"
                      />
                    </div>
                  )
                }
              ]}
            />
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 6. SUB-VIEW: MASTER DEPOTS & DISPENSER STATIONS (DB) - DATATABLE */}
      {/* ========================================================================= */}
      {subTab === 'depots' && (() => {
        const activeCount = databaseDepots.filter(d => Boolean(d.is_active)).length;
        const deactivatedCount = databaseDepots.filter(d => !Boolean(d.is_active)).length;

        const filteredDepots = databaseDepots.filter(depot => {
          if (depotStatusFilter === 'ACTIVE' && !Boolean(depot.is_active)) return false;
          if (depotStatusFilter === 'DEACTIVATED' && Boolean(depot.is_active)) return false;
          return true;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Registered Depots</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{databaseDepots.length}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 600, textTransform: 'uppercase' }}>Active Hubs</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-success)', marginTop: '4px' }}>{activeCount}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '11px', color: 'var(--status-danger)', fontWeight: 600, textTransform: 'uppercase' }}>Deactivated Hubs (Can Activate)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-danger)', marginTop: '4px' }}>{deactivatedCount}</div>
              </div>
            </div>

            {/* Enhanced Depots DataTable with Pagination, Search, Status Filter */}
            <DataTable
              title="Master Dispensing Depots & Hub Stations Registry (DB)"
              subtitle="Configure all factory mother plants, regional depots, and highway dispenser hubs."
              data={filteredDepots}
              searchPlaceholder="Search depot name, city, state, phone..."
              pageSize={10}
              pageSizeOptions={[5, 10, 25, 50, 100]}
              filterComponent={
                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                  {[
                    { id: 'ALL', label: `All (${databaseDepots.length})` },
                    { id: 'ACTIVE', label: `Active (${activeCount})` },
                    { id: 'DEACTIVATED', label: `Deactivated (${deactivatedCount})` }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setDepotStatusFilter(filter.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: depotStatusFilter === filter.id ? 'var(--brand-blue)' : 'transparent',
                        color: depotStatusFilter === filter.id ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              }
              actions={
                <Button size="sm" variant="gold" icon={Plus} onClick={() => { setNewDepotForm({ name: '', city: '', state: '', customState: '', customCity: '', address: '', phone: '' }); setIsDepotModalOpen(true); }}>
                  Add Depot Station
                </Button>
              }
              columns={[
                {
                  header: '#',
                  accessor: 'id',
                  width: '50px',
                  render: (_, __, rowIdx) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{rowIdx + 1}</span>
                },
                {
                  header: 'Depot / Dispenser Station',
                  accessor: 'name',
                  render: (val, row) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color={Boolean(row.is_active) ? 'var(--brand-blue)' : 'var(--text-muted)'} />
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
                        {row.address && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.address}</div>}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'State & City Hub',
                  accessor: 'city',
                  render: (_, row) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="var(--brand-cyan)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {row.city || 'Hub'}, {row.state || 'Odisha'}
                      </span>
                    </div>
                  )
                },
                {
                  header: 'Contact Phone',
                  accessor: 'contact_phone',
                  render: (val, row) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{val || row.phone || '—'}</span>
                },
                {
                  header: 'Status',
                  accessor: 'is_active',
                  render: (val) => {
                    const isActive = Boolean(val);
                    return (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isActive ? 'var(--status-success)' : 'var(--status-danger)',
                          border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                      >
                        {isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    );
                  }
                },
                {
                  header: 'Actions',
                  accessor: 'actions',
                  align: 'right',
                  render: (_, row) => {
                    const isActive = Boolean(row.is_active);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {/* Activate / Deactivate Toggle Button */}
                        <Button
                          size="sm"
                          variant={isActive ? 'ghost' : 'gold'}
                          style={{
                            color: isActive ? 'var(--status-danger)' : undefined,
                            fontSize: '11px',
                            padding: '4px 8px',
                            fontWeight: 700
                          }}
                          icon={isActive ? Power : CheckCircle2}
                          onClick={() => handleToggleDepotStatus(row)}
                          title={isActive ? 'Deactivate Depot' : 'Activate Depot'}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          icon={Edit2}
                          onClick={() => handleOpenEditDepot(row)}
                          title="Edit Depot Details"
                        >
                          Edit
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{ color: 'var(--status-danger)', padding: '4px 6px' }}
                          icon={Trash2}
                          onClick={() => handleDeleteDepot(row)}
                          title="Delete Depot from Database"
                        />
                      </div>
                    );
                  }
                }
              ]}
            />
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 1. SIMPLE & DYNAMIC MASTER PRODUCT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProductId ? 'Edit Product' : 'Add New Product'}
        subtitle="Quick dynamic product and packaging configurator"
        icon={Package}
        size="md"
      >
        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Product Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Product Title *</label>
            <Input
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. UltraBlue+ Genuine DEF Bucket"
              required
              autoFocus
            />
          </div>

          {/* Dynamic Category Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Product Category *</label>
            {!isCustomCategory ? (
              <Select
                value={productForm.category_name}
                onChange={e => handleCategorySelect(e.target.value)}
                options={[
                  ...categoriesList.map(c => ({ value: c.name, label: `${c.name} (HSN: ${c.hsn})` })),
                  { value: '__ADD_NEW__', label: '➕ + Add Custom Category...' }
                ]}
              />
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <Input
                  value={customCategoryText}
                  onChange={e => setCustomCategoryText(e.target.value)}
                  placeholder="Type custom category name..."
                  autoFocus
                />
                <Button type="button" size="sm" variant="secondary" onClick={() => setIsCustomCategory(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Dynamic Packaging & Pricing Options */}
          <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Warehouse size={15} /> Pack Sizes & Pricing ({productForm.pack_variants.length})
              </span>
              <Button type="button" size="sm" variant="primary" icon={Plus} onClick={handleAddPackVariant}>
                Add Pack Size
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {productForm.pack_variants.map((pv, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 32px', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  {/* Dynamic Pack Size Dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Pack Size</label>
                    <Select
                      value={pv.pack_size}
                      onChange={e => handleSelectPackSize(idx, e.target.value)}
                      options={packSizesList.map(ps => ({
                        value: ps.name,
                        label: `${ps.name} (${ps.volume}L)`
                      }))}
                    />
                  </div>

                  {/* MRP */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>MRP (₹) *</label>
                    <Input
                      type="number"
                      value={pv.standard_mrp}
                      onChange={e => handlePackVariantPriceChange(idx, 'standard_mrp', e.target.value)}
                      placeholder="1150"
                      required
                    />
                  </div>

                  {/* Distributor Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Dist. Base (₹)</label>
                    <Input
                      type="number"
                      value={pv.distributor_base_price}
                      onChange={e => handlePackVariantPriceChange(idx, 'distributor_base_price', e.target.value)}
                      placeholder="880"
                    />
                  </div>

                  {/* Remove Button */}
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemovePackVariant(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Strip (HSN & GST) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>HSN Code</label>
              <Input
                value={productForm.hsn_code}
                onChange={e => setProductForm({ ...productForm, hsn_code: e.target.value })}
                placeholder="31021000"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>GST Rate (%)</label>
              <Select
                value={productForm.gst_rate}
                onChange={e => setProductForm({ ...productForm, gst_rate: parseFloat(e.target.value) })}
                options={[
                  { value: 18, label: '18% GST (Standard)' },
                  { value: 28, label: '28% GST' },
                  { value: 12, label: '12% GST' },
                  { value: 5, label: '5% GST' },
                  { value: 0, label: '0% Nil GST' }
                ]}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Description / Notes (Optional)</label>
            <Input
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="e.g. ISO 22241-1 certified diesel exhaust fluid"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>
              {editingProductId ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. CATEGORY ADD/EDIT MODAL */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Product Category' : 'Add New Master Product Category'}
        subtitle="Industry Classification & HSN Matrix"
        icon={Layers}
      >
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category Name *</label>
            <Input
              value={categoryForm.name}
              onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="e.g. Industrial Transmission Fluids"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category Code</label>
              <Input
                value={categoryForm.code}
                onChange={e => setCategoryForm({ ...categoryForm, code: e.target.value })}
                placeholder="CAT-TRN"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>HSN Code</label>
              <Input
                value={categoryForm.hsn}
                onChange={e => setCategoryForm({ ...categoryForm, hsn: e.target.value })}
                placeholder="27101982"
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Industry / Quality Standard</label>
            <Input
              value={categoryForm.standard}
              onChange={e => setCategoryForm({ ...categoryForm, standard: e.target.value })}
              placeholder="e.g. ISO 22241-1 / IS 17042"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Description</label>
            <Input
              value={categoryForm.description}
              onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Category scope and application..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Category</Button>
          </div>
        </form>
      </Modal>

      {/* 3. PACK SIZE ADD MODAL */}
      <Modal
        isOpen={isPackModalOpen}
        onClose={() => setIsPackModalOpen(false)}
        title="Add Master Pack Size & Container"
        subtitle="Standard Packaging Registry"
        icon={Warehouse}
      >
        <form onSubmit={handleSavePackSize} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Pack Size Title *</label>
            <Input
              value={packForm.name}
              onChange={e => setPackForm({ ...packForm, name: e.target.value })}
              placeholder="e.g. 26L Industrial Heavy Pail"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Volume (Litres) *</label>
              <Input
                type="number"
                value={packForm.volume}
                onChange={e => setPackForm({ ...packForm, volume: e.target.value })}
                placeholder="26"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>SKU Prefix</label>
              <Input
                value={packForm.barcodePrefix}
                onChange={e => setPackForm({ ...packForm, barcodePrefix: e.target.value })}
                placeholder="UBP-26L"
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Packaging Material / Type</label>
            <Input
              value={packForm.type}
              onChange={e => setPackForm({ ...packForm, type: e.target.value })}
              placeholder="e.g. Injection Moulded HDPE Bucket"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPackModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Pack Size</Button>
          </div>
        </form>
      </Modal>

      {/* 4. COMPLIANCE PARAMETER ADD MODAL */}
      <Modal
        isOpen={isComplianceParamModalOpen}
        onClose={() => setIsComplianceParamModalOpen(false)}
        title="Add Compliance Parameter"
        subtitle="Standard Chemical & Physical Testing Limits"
        icon={ShieldCheck}
      >
        <form onSubmit={handleSaveParam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Parameter Property Name *</label>
            <Input
              value={paramForm.prop}
              onChange={e => setParamForm({ ...paramForm, prop: e.target.value })}
              placeholder="e.g. Kinematic Viscosity at 40°C"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Unit of Measure</label>
              <Input
                value={paramForm.unit}
                onChange={e => setParamForm({ ...paramForm, unit: e.target.value })}
                placeholder="e.g. cSt, %, mg/kg, g/cm³"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Standard Limit</label>
              <Input
                value={paramForm.limit}
                onChange={e => setParamForm({ ...paramForm, limit: e.target.value })}
                placeholder="e.g. 61.2 – 74.8 cSt"
                required
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Batch Average</label>
              <Input
                value={paramForm.batch}
                onChange={e => setParamForm({ ...paramForm, batch: e.target.value })}
                placeholder="e.g. 68.4 cSt"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Test Method Standard</label>
              <Input
                value={paramForm.method}
                onChange={e => setParamForm({ ...paramForm, method: e.target.value })}
                placeholder="e.g. ASTM D445 / ISO 3104"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsComplianceParamModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold">Save Parameter</Button>
          </div>
        </form>
      </Modal>

      {/* 5. OEM APPROVAL ADD MODAL */}
      <Modal
        isOpen={isOemModalOpen}
        onClose={() => setIsOemModalOpen(false)}
        title="Add OEM Approval"
        subtitle="Vehicle Manufacturer Platform Compliance"
        icon={Truck}
      >
        <form onSubmit={handleSaveOem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Vehicle Manufacturer (OEM) Name *</label>
            <Input
              value={oemForm.oem}
              onChange={e => setOemForm({ ...oemForm, oem: e.target.value })}
              placeholder="e.g. Mahindra Truck & Bus Division"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Approval Reference Number *</label>
              <Input
                value={oemForm.approvalNo}
                onChange={e => setOemForm({ ...oemForm, approvalNo: e.target.value })}
                placeholder="MTBD-DEF-2026-X4"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Approval Validity Date</label>
              <Input
                value={oemForm.validDate}
                onChange={e => setOemForm({ ...oemForm, validDate: e.target.value })}
                placeholder="31-Dec-2027"
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Engine Standard / SCR Platform</label>
            <Input
              value={oemForm.engineStandard}
              onChange={e => setOemForm({ ...oemForm, engineStandard: e.target.value })}
              placeholder="e.g. mPower FuelSmart BS-VI SCR System"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsOemModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save OEM Approval</Button>
          </div>
        </form>
      </Modal>

      {/* 6. TERRITORY STATE / CITY ADD MODAL */}
      <Modal
        isOpen={isTerritoryModalOpen}
        onClose={() => {
          setIsTerritoryModalOpen(false);
          setTerritoryErrors({});
        }}
        title="Add Master Territory (State & City)"
        subtitle="Persist geographical region in database"
        icon={Globe}
      >
        <form noValidate onSubmit={handleSaveTerritory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Select State (from DB) *</label>
            <Select
              value={territoryForm.state}
              onChange={e => {
                setTerritoryForm({ ...territoryForm, state: e.target.value });
                if (territoryErrors.state) setTerritoryErrors(prev => ({ ...prev, state: null }));
              }}
              options={stateOptions}
              error={territoryErrors.state}
              required
            />
          </div>

          {territoryForm.state === 'Other' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>New State Name *</label>
              <Input
                value={territoryForm.customState}
                onChange={e => {
                  setTerritoryForm({ ...territoryForm, customState: e.target.value });
                  if (territoryErrors.state) setTerritoryErrors(prev => ({ ...prev, state: null }));
                }}
                onBlur={() => setTerritoryErrors(prev => ({ ...prev, state: validateRequiredText(territoryForm.customState, 'State Name', 2) }))}
                placeholder="e.g. Telangana, Jharkhand"
                error={territoryErrors.state}
                required
                autoFocus
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>City / Hub Name *</label>
            <Input
              value={territoryForm.city}
              onChange={e => {
                setTerritoryForm({ ...territoryForm, city: e.target.value });
                if (territoryErrors.city) setTerritoryErrors(prev => ({ ...prev, city: null }));
              }}
              onBlur={() => setTerritoryErrors(prev => ({ ...prev, city: validateRequiredText(territoryForm.city, 'City Name', 2) }))}
              placeholder="e.g. Hyderabad, Ranchi, Jamshedpur"
              error={territoryErrors.city}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Region / State Code (Optional)</label>
            <Input
              value={territoryForm.regionCode || ''}
              maxLength={6}
              onChange={e => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                setTerritoryForm({ ...territoryForm, regionCode: val });
                if (territoryErrors.regionCode) setTerritoryErrors(prev => ({ ...prev, regionCode: null }));
              }}
              onBlur={() => setTerritoryErrors(prev => ({ ...prev, regionCode: validateRegionCode(territoryForm.regionCode) }))}
              placeholder="e.g. ODI, WBE, JHK, TEL"
              error={territoryErrors.regionCode}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => {
              setIsTerritoryModalOpen(false);
              setTerritoryErrors({});
            }}>Cancel</Button>
            <Button type="submit" variant="primary" icon={CheckCircle2}>Save Territory</Button>
          </div>
        </form>
      </Modal>

      {/* 6B. EDIT TERRITORY STATE / CITY MODAL */}
      <Modal
        isOpen={isEditTerritoryModalOpen}
        onClose={() => {
          setIsEditTerritoryModalOpen(false);
          setEditTerritoryErrors({});
        }}
        title="Edit Master Territory"
        subtitle="Update registered state and city in database"
        icon={Globe}
      >
        <form noValidate onSubmit={handleSaveEditTerritory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>State Name *</label>
            <Input
              value={editingTerritory.state}
              onChange={e => {
                setEditingTerritory({ ...editingTerritory, state: e.target.value });
                if (editTerritoryErrors.state) setEditTerritoryErrors(prev => ({ ...prev, state: null }));
              }}
              onBlur={() => setEditTerritoryErrors(prev => ({ ...prev, state: validateRequiredText(editingTerritory.state, 'State Name', 2) }))}
              placeholder="e.g. Odisha, West Bengal"
              error={editTerritoryErrors.state}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>City / Commercial Hub Name *</label>
            <Input
              value={editingTerritory.city}
              onChange={e => {
                setEditingTerritory({ ...editingTerritory, city: e.target.value });
                if (editTerritoryErrors.city) setEditTerritoryErrors(prev => ({ ...prev, city: null }));
              }}
              onBlur={() => setEditTerritoryErrors(prev => ({ ...prev, city: validateRequiredText(editingTerritory.city, 'City Name', 2) }))}
              placeholder="e.g. Bhubaneswar, Cuttack, Kolkata"
              error={editTerritoryErrors.city}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Region Code</label>
            <Input
              value={editingTerritory.regionCode || ''}
              maxLength={6}
              onChange={e => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                setEditingTerritory({ ...editingTerritory, regionCode: val });
                if (editTerritoryErrors.regionCode) setEditTerritoryErrors(prev => ({ ...prev, regionCode: null }));
              }}
              onBlur={() => setEditTerritoryErrors(prev => ({ ...prev, regionCode: validateRegionCode(editingTerritory.regionCode) }))}
              placeholder="e.g. ODI, WBE, JHK"
              error={editTerritoryErrors.regionCode}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => {
              setIsEditTerritoryModalOpen(false);
              setEditTerritoryErrors({});
            }}>Cancel</Button>
            <Button type="submit" variant="primary" icon={CheckCircle2}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* 7. DEPOT STATION ADD MODAL */}
      <Modal
        isOpen={isDepotModalOpen}
        onClose={() => {
          setIsDepotModalOpen(false);
          setDepotErrors({});
        }}
        title="Add Master Dispenser Depot / Station"
        subtitle="Register location in inventory_locations table"
        icon={Building2}
      >
        <form noValidate onSubmit={handleCreateDepotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Depot / Station Name *</label>
            <Input
              value={newDepotForm.name}
              onChange={e => {
                setNewDepotForm({ ...newDepotForm, name: e.target.value });
                if (depotErrors.name) setDepotErrors(prev => ({ ...prev, name: null }));
              }}
              onBlur={() => setDepotErrors(prev => ({ ...prev, name: validateRequiredText(newDepotForm.name, 'Depot / Station Name', 3) }))}
              placeholder="e.g. Sambalpur Heavy Haul Highway Hub"
              error={depotErrors.name}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>State (from DB) *</label>
              <Select
                value={newDepotForm.state}
                onChange={e => {
                  const val = e.target.value;
                  const cList = (databaseTerritories[val] || []).map(item => (typeof item === 'string' ? item : item.city));
                  setNewDepotForm({
                    ...newDepotForm,
                    state: val,
                    city: cList[0] || (val === 'Other' ? 'Other' : ''),
                    customState: '',
                    customCity: ''
                  });
                  if (depotErrors.state) setDepotErrors(prev => ({ ...prev, state: null }));
                }}
                options={stateOptions}
                error={depotErrors.state}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>City / Hub (from DB) *</label>
              <Select
                value={newDepotForm.city}
                onChange={e => {
                  setNewDepotForm({ ...newDepotForm, city: e.target.value });
                  if (depotErrors.city) setDepotErrors(prev => ({ ...prev, city: null }));
                }}
                options={getCityOptions(newDepotForm.state, newDepotForm.city)}
                error={depotErrors.city}
                required
              />
            </div>
          </div>

          {newDepotForm.state === 'Other' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Enter New State Name *</label>
                <Input
                  value={newDepotForm.customState}
                  onChange={e => {
                    setNewDepotForm({ ...newDepotForm, customState: e.target.value });
                    if (depotErrors.state) setDepotErrors(prev => ({ ...prev, state: null }));
                  }}
                  onBlur={() => setDepotErrors(prev => ({ ...prev, state: validateRequiredText(newDepotForm.customState, 'State Name', 2) }))}
                  placeholder="e.g. Telangana, Jharkhand"
                  error={depotErrors.state}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Enter City Name *</label>
                <Input
                  value={newDepotForm.customCity}
                  onChange={e => {
                    setNewDepotForm({ ...newDepotForm, customCity: e.target.value });
                    if (depotErrors.city) setDepotErrors(prev => ({ ...prev, city: null }));
                  }}
                  onBlur={() => setDepotErrors(prev => ({ ...prev, city: validateRequiredText(newDepotForm.customCity, 'City Name', 2) }))}
                  placeholder="e.g. Ranchi, Jamshedpur"
                  error={depotErrors.city}
                  required
                />
              </div>
            </div>
          )}

          {newDepotForm.state !== 'Other' && newDepotForm.city === 'Other' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Enter New City Name for {newDepotForm.state} *</label>
              <Input
                value={newDepotForm.customCity}
                onChange={e => {
                  setNewDepotForm({ ...newDepotForm, customCity: e.target.value });
                  if (depotErrors.city) setDepotErrors(prev => ({ ...prev, city: null }));
                }}
                onBlur={() => setDepotErrors(prev => ({ ...prev, city: validateRequiredText(newDepotForm.customCity, 'City Name', 2) }))}
                placeholder={`Enter city in ${newDepotForm.state}`}
                error={depotErrors.city}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Address Details</label>
            <Input
              value={newDepotForm.address}
              onChange={e => setNewDepotForm({ ...newDepotForm, address: e.target.value })}
              placeholder="e.g. NH-53 Industrial Area"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Contact Phone</label>
            <Input
              value={newDepotForm.phone}
              maxLength={10}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setNewDepotForm({ ...newDepotForm, phone: val });
                if (depotErrors.phone) setDepotErrors(prev => ({ ...prev, phone: null }));
              }}
              onBlur={() => setDepotErrors(prev => ({ ...prev, phone: validatePhone(newDepotForm.phone, false) }))}
              placeholder="10-digit mobile number (e.g. 9853675971)"
              error={depotErrors.phone}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => {
              setIsDepotModalOpen(false);
              setDepotErrors({});
            }}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>Save Depot Station</Button>
          </div>
        </form>
      </Modal>

      {/* 8. DEPOT STATION EDIT MODAL */}
      <Modal
        isOpen={isEditDepotModalOpen}
        onClose={() => {
          setIsEditDepotModalOpen(false);
          setEditDepotErrors({});
        }}
        title="Edit Dispenser Depot / Station"
        subtitle="Update registered hub parameters in database"
        icon={Building2}
      >
        <form noValidate onSubmit={handleSaveDepotEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Depot / Station Name *</label>
            <Input
              value={editingDepot.name}
              onChange={e => {
                setEditingDepot({ ...editingDepot, name: e.target.value });
                if (editDepotErrors.name) setEditDepotErrors(prev => ({ ...prev, name: null }));
              }}
              onBlur={() => setEditDepotErrors(prev => ({ ...prev, name: validateRequiredText(editingDepot.name, 'Depot Name', 3) }))}
              error={editDepotErrors.name}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>State (from DB) *</label>
              <Select
                value={editingDepot.state}
                onChange={e => {
                  const val = e.target.value;
                  const cList = (databaseTerritories[val] || []).map(item => (typeof item === 'string' ? item : item.city));
                  setEditingDepot({
                    ...editingDepot,
                    state: val,
                    city: cList[0] || (val === 'Other' ? 'Other' : ''),
                    customState: '',
                    customCity: ''
                  });
                  if (editDepotErrors.state) setEditDepotErrors(prev => ({ ...prev, state: null }));
                }}
                options={stateOptions}
                error={editDepotErrors.state}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>City / Hub (from DB) *</label>
              <Select
                value={editingDepot.city}
                onChange={e => {
                  setEditingDepot({ ...editingDepot, city: e.target.value });
                  if (editDepotErrors.city) setEditDepotErrors(prev => ({ ...prev, city: null }));
                }}
                options={getCityOptions(editingDepot.state, editingDepot.city)}
                error={editDepotErrors.city}
                required
              />
            </div>
          </div>

          {editingDepot.state === 'Other' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Enter New State Name *</label>
                <Input
                  value={editingDepot.customState}
                  onChange={e => {
                    setEditingDepot({ ...editingDepot, customState: e.target.value });
                    if (editDepotErrors.state) setEditDepotErrors(prev => ({ ...prev, state: null }));
                  }}
                  onBlur={() => setEditDepotErrors(prev => ({ ...prev, state: validateRequiredText(editingDepot.customState, 'State Name', 2) }))}
                  placeholder="e.g. Telangana, Jharkhand"
                  error={editDepotErrors.state}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Enter City Name *</label>
                <Input
                  value={editingDepot.customCity}
                  onChange={e => {
                    setEditingDepot({ ...editingDepot, customCity: e.target.value });
                    if (editDepotErrors.city) setEditDepotErrors(prev => ({ ...prev, city: null }));
                  }}
                  onBlur={() => setEditDepotErrors(prev => ({ ...prev, city: validateRequiredText(editingDepot.customCity, 'City Name', 2) }))}
                  placeholder="e.g. Ranchi, Jamshedpur"
                  error={editDepotErrors.city}
                  required
                />
              </div>
            </div>
          )}

          {editingDepot.state !== 'Other' && editingDepot.city === 'Other' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Enter New City Name for {editingDepot.state} *</label>
              <Input
                value={editingDepot.customCity}
                onChange={e => {
                  setEditingDepot({ ...editingDepot, customCity: e.target.value });
                  if (editDepotErrors.city) setEditDepotErrors(prev => ({ ...prev, city: null }));
                }}
                onBlur={() => setEditDepotErrors(prev => ({ ...prev, city: validateRequiredText(editingDepot.customCity, 'City Name', 2) }))}
                placeholder={`Enter city in ${editingDepot.state}`}
                error={editDepotErrors.city}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Address Details</label>
            <Input
              value={editingDepot.address}
              onChange={e => setEditingDepot({ ...editingDepot, address: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Contact Phone</label>
            <Input
              value={editingDepot.phone}
              maxLength={10}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setEditingDepot({ ...editingDepot, phone: val });
                if (editDepotErrors.phone) setEditDepotErrors(prev => ({ ...prev, phone: null }));
              }}
              onBlur={() => setEditDepotErrors(prev => ({ ...prev, phone: validatePhone(editingDepot.phone, false) }))}
              placeholder="10-digit mobile number (e.g. 9853675971)"
              error={editDepotErrors.phone}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => {
              setIsEditDepotModalOpen(false);
              setEditDepotErrors({});
            }}>Cancel</Button>
            <Button type="submit" variant="primary" icon={CheckCircle2}>Save Depot Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProductsView;

