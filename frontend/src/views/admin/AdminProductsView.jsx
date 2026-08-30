import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  BadgePercent,
  Warehouse,
  Award,
  Check,
  Download,
  Truck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { KPICard } from '../../components/ui/KPICard';
import { ProductAPI, ComplianceAPI } from '../../services/api';

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

  // 1. Dynamic Category Master Registry State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', hsn: '31021000', gst: 18, standard: '', description: '' });

  // 2. Dynamic Pack Sizes Master Registry State
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [packSizesList, setPackSizesList] = useState([]);
  const [packForm, setPackForm] = useState({ name: '', volume: 20, type: '', tareWeight: '', nozzle: '', barcodePrefix: '' });

  // 3. Compliance Parameters State
  const [isComplianceParamModalOpen, setIsComplianceParamModalOpen] = useState(false);
  const [complianceParams, setComplianceParams] = useState([]);
  const [paramForm, setParamForm] = useState({ prop: '', unit: '%', limit: '', batch: '', method: '' });

  // 4. OEM Approvals State
  const [isOemModalOpen, setIsOemModalOpen] = useState(false);
  const [oemApprovalsList, setOemApprovalsList] = useState([]);
  const [oemForm, setOemForm] = useState({ oem: '', approvalNo: '', engineStandard: '', validDate: '31-Dec-2027' });

  // 5. Batch Certificates State
  const [isBatchCertModalOpen, setIsBatchCertModalOpen] = useState(false);
  const [batchCertificates, setBatchCertificates] = useState([]);
  const [batchCertForm, setBatchCertForm] = useState({ certNo: `UBP-QA-2026-${Date.now().toString().slice(-3)}`, batchNo: 'UB-26H-992', location: 'Bhadrak Mother Plant', purity: '32.5% Urea', density: '1.0895 g/cm³', chemist: 'Dr. A. K. Mohapatra' });

  // Initial Data Fetching from Database API
  useEffect(() => {
    const loadComplianceAndCategories = async () => {
      try {
        const [paramsData, oemsData, packsData, certsData, catsData] = await Promise.all([
          ComplianceAPI.getParameters(),
          ComplianceAPI.getOemApprovals(),
          ComplianceAPI.getPackSizes(),
          ComplianceAPI.getBatchCertificates(),
          ProductAPI.getCategories()
        ]);
        if (paramsData && paramsData.length > 0) setComplianceParams(paramsData);
        if (oemsData && oemsData.length > 0) setOemApprovalsList(oemsData);
        if (packsData && packsData.length > 0) setPackSizesList(packsData);
        if (certsData && certsData.length > 0) setBatchCertificates(certsData);
        if (catsData && catsData.length > 0) setCategoriesList(catsData);
      } catch (err) {
        console.error('Error fetching compliance & categories database records:', err);
      }
    };
    loadComplianceAndCategories();
  }, []);

  // Simple Product Form State
  const defaultCategory = categoriesList[0]?.name || '';
  const defaultPack = packSizesList[0] || { name: 'Standard Pack', volume: 20, barcodePrefix: 'UBP' };

  const initialProductFormState = {
    name: '',
    category_name: defaultCategory,
    description: '',
    hsn_code: '31021000',
    gst_rate: 18,
    is_gst_inclusive: true,
    pack_variants: [
      { 
        pack_size: defaultPack.name, 
        sku: `${defaultPack.barcodePrefix || 'UBP'}-01`, 
        volume_in_litres: defaultPack.volume || 20, 
        standard_mrp: 1150, 
        distributor_base_price: 880, 
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SUB-MENU NAVIGATION PILLS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'master', label: 'Product Master', icon: Package, count: products.length },
            { id: 'categories', label: 'Product Categories', icon: Layers, count: categoriesList.length },
            { id: 'packsizes', label: 'Pack Sizes & Variants', icon: Warehouse, count: packSizesList.length },
            { id: 'compliance', label: 'ISO / BIS Compliance', icon: ShieldCheck, badge: 'Verified' }
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

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {subTab === 'master' && (
            <Button size="sm" variant="gold" icon={Plus} onClick={handleOpenAddProduct}>
              Add Product
            </Button>
          )}
          {subTab === 'categories' && (
            <Button size="sm" variant="primary" icon={Plus} onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', code: '', hsn: '31021000', gst: 18, standard: '', description: '' });
              setIsCategoryModalOpen(true);
            }}>
              Add Category
            </Button>
          )}
          {subTab === 'packsizes' && (
            <Button size="sm" variant="primary" icon={Plus} onClick={() => {
              setPackForm({ name: '', volume: 20, type: '', tareWeight: '', nozzle: '', barcodePrefix: '' });
              setIsPackModalOpen(true);
            }}>
              Add Pack Size
            </Button>
          )}
          {subTab === 'compliance' && (
            <>
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => {
                setParamForm({ prop: '', unit: '%', limit: '', batch: '', method: '' });
                setIsComplianceParamModalOpen(true);
              }}>
                Add Parameter
              </Button>
              <Button size="sm" variant="primary" icon={Plus} onClick={() => {
                setOemForm({ oem: '', approvalNo: '', engineStandard: '', validDate: '31-Dec-2027' });
                setIsOemModalOpen(true);
              }}>
                Add OEM Approval
              </Button>
            </>
          )}
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
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
      {/* 2. SUB-VIEW: PRODUCT CATEGORIES */}
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

          {/* Category Table */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Product Categories & HSN Codes</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Categories created here appear dynamically in the Add Product form.
                </p>
              </div>
              <Button size="sm" variant="gold" icon={Plus} onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', code: '', hsn: '31021000', gst: 18, standard: '', description: '' });
                setIsCategoryModalOpen(true);
              }}>
                Add Category
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Category Name</th>
                    <th style={{ padding: '12px 16px' }}>Category Code</th>
                    <th style={{ padding: '12px 16px' }}>HSN Code</th>
                    <th style={{ padding: '12px 16px' }}>Default GST</th>
                    <th style={{ padding: '12px 16px' }}>Industry Standard</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesList.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{cat.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat.description}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {cat.code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{cat.hsn}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--brand-blue)' }}>{cat.gst}%</td>
                      <td style={{ padding: '14px 16px' }}>{cat.standard}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <Button size="sm" variant="ghost" icon={Edit3} onClick={() => {
                            setEditingCategory(cat);
                            setCategoryForm({ name: cat.name, code: cat.code || `CAT-${cat.name.slice(0, 3).toUpperCase()}`, hsn: cat.hsn || '31021000', gst: cat.gst || 18, standard: cat.standard || 'ISO / BIS', description: cat.description || '' });
                            setIsCategoryModalOpen(true);
                          }}>
                            Edit
                          </Button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px' }}
                            title={`Delete category ${cat.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: PACK SIZES & VARIANTS */}
      {/* ========================================================================= */}
      {subTab === 'packsizes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Warehouse size={20} color="var(--brand-cyan)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Master Pack Sizes Registry</h3>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Packaging sizes configured here automatically populate in the product packaging dropdown.
              </p>
            </div>
            
            <Button size="sm" variant="gold" icon={Plus} onClick={() => {
              setPackForm({ name: '', volume: 20, type: '', tareWeight: '', nozzle: '', barcodePrefix: '' });
              setIsPackModalOpen(true);
            }}>
              Add Master Pack Size
            </Button>
          </div>

          {/* Packaging Grid Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {packSizesList.map(pack => (
              <div key={pack.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{pack.name}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 700 }}>{pack.volume} Litres Net</span>
                    </div>
                    <span style={{ backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      {pack.barcodePrefix}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Material:</span> <strong>{pack.type || 'Standard Poly'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Tare Weight:</span> <strong>{pack.tareWeight || 'Standard'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Dispensing:</span> <strong>{pack.nozzle || 'Integrated Nozzle'}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--status-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Active Master Size
                  </span>
                  <button
                    onClick={() => handleDeletePackSize(pack.id, pack.name)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }}
                    title={`Delete ${pack.name}`}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-VIEW: TECHNICAL SPECS & ISO / BIS COMPLIANCE */}
      {/* ========================================================================= */}
      {subTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          {/* Chemical Analysis Matrix Table */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>UltraBlue+ DEF ISO 22241 Quality Standard Limit Table</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Standard laboratory limits vs UltraBlue+ verified batch average.
                </p>
              </div>
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
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 16px' }}>Parameter Property</th>
                    <th style={{ padding: '10px 16px' }}>Unit</th>
                    <th style={{ padding: '10px 16px' }}>ISO 22241-1 Standard Limits</th>
                    <th style={{ padding: '10px 16px' }}>UltraBlue+ Batch Average</th>
                    <th style={{ padding: '10px 16px' }}>Test Method</th>
                    <th style={{ padding: '10px 16px' }}>Status</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceParams.map((row, rIdx) => (
                    <tr key={row.id || rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.prop}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{row.unit}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.limit}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--brand-blue)' }}>{row.batch}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{row.method}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--status-success)', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                          <Check size={12} /> Compliant
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteParam(row.id, row.prop)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          title={`Delete parameter ${row.prop}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* OEM Approvals Directory */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>OEM Manufacturer Approvals</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Approvals from leading commercial vehicle manufacturers.
                </p>
              </div>
              <Button size="sm" variant="primary" icon={Plus} onClick={() => {
                setOemForm({ oem: '', approvalNo: '', engineStandard: '', validDate: '31-Dec-2027' });
                setIsOemModalOpen(true);
              }}>
                Add OEM Approval
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 16px' }}>Vehicle Manufacturer (OEM)</th>
                    <th style={{ padding: '10px 16px' }}>Approval Ref No.</th>
                    <th style={{ padding: '10px 16px' }}>Engine Standard / System</th>
                    <th style={{ padding: '10px 16px' }}>Validity</th>
                    <th style={{ padding: '10px 16px' }}>Status</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {oemApprovalsList.map(oem => (
                    <tr key={oem.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{oem.oem}</strong>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: 'rgba(0, 86, 210, 0.08)', color: 'var(--brand-blue)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {oem.approvalNo || oem.approval_no}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{oem.engineStandard || oem.engine_standard}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{oem.validDate || oem.valid_date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--status-success)', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                          <Check size={12} /> {oem.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteOem(oem.id, oem.oem)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          title={`Delete OEM approval for ${oem.oem}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default AdminProductsView;
