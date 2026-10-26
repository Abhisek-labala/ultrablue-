import React, { useState, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  DollarSign,
  Truck,
  Sparkles,
  ExternalLink,
  Layers,
  ShoppingBag,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { KPICard } from '../../components/ui/KPICard';
import { ProductAPI } from '../../services/api';
import { compressImageToWebP } from '../../utils/imageCompressor';

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Packaging' },
  { value: 'BUCKETS', label: '20L Buckets' },
  { value: 'CANS', label: '5L / 10L Cans' },
  { value: 'BARRELS', label: '210L Barrels' },
  { value: 'IBC', label: '1000L IBC Tanks' },
  { value: 'BULK', label: 'Bulk Road Tankers' },
  { value: 'OTHER', label: 'Other' }
];

const INITIAL_FORM = {
  name: '',
  shortName: '',
  category: 'BUCKETS',
  capacity: '',
  badge: '',
  bestFor: '',
  featuresText: '',
  imageUrl: '',
  mrp: '',
  distributorPrice: '',
  defaultQty: '',
  isActive: true,
  sortOrder: 1
};

export const AdminProductsView = ({
  products = [],
  onRefresh,
  onShowToast,
  onNavigateToPricing
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  // Field-level Validator
  const validateField = (name, value, currentFormData = formData) => {
    switch (name) {
      case 'name': {
        const val = (value || '').trim();
        if (!val) return 'Product name is required';
        if (val.length < 2) return 'Product name must be at least 2 characters';
        return '';
      }
      case 'capacity': {
        const val = (value || '').trim();
        if (!val) return 'Packaging capacity is required (e.g. 20 Litres, 210 Litres)';
        return '';
      }
      case 'category': {
        if (!value) return 'Please select a packaging category';
        return '';
      }
      case 'mrp': {
        const val = String(value || '').trim();
        if (!val) return 'MRP price is required';
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) return 'MRP must be greater than ₹0';
        return '';
      }
      case 'distributorPrice': {
        const val = String(value || '').trim();
        if (!val) return 'B2B wholesale price is required';
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) return 'B2B price must be greater than ₹0';
        const mrpNum = parseFloat(currentFormData.mrp);
        if (!isNaN(mrpNum) && num > mrpNum) return 'B2B price cannot exceed MRP';
        return '';
      }
      case 'defaultQty': {
        const val = (value || '').trim();
        if (!val) return 'Default quote quantity is required (e.g. 25 Buckets, 1 IBC)';
        return '';
      }
      default:
        return '';
    }
  };

  // Full Form Validator
  const validateProductForm = (values = formData) => {
    const fields = ['name', 'capacity', 'category', 'mrp', 'distributorPrice', 'defaultQty'];
    const errors = {};
    for (const f of fields) {
      const err = validateField(f, values[f], values);
      if (err) errors[f] = err;
    }
    return errors;
  };

  // Direct Image File Upload Handler with Auto-Compression & WebP Conversion
  const handleFileChange = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const err = 'Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG)';
      setUploadError(err);
      onShowToast && onShowToast(err, 'error');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      // If image is large (> 300KB), automatically compress to WebP before uploading
      if (file.type !== 'image/svg+xml' && file.size > 300 * 1024) {
        const originalSizeMb = (file.size / (1024 * 1024)).toFixed(1);
        onShowToast && onShowToast(`Compressing ${originalSizeMb}MB image to WebP...`, 'info');
        file = await compressImageToWebP(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      }

      // 1. Immediate local preview
      const localPreviewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageUrl: localPreviewUrl }));

      // 2. Upload to server
      const res = await ProductAPI.uploadImage(file);
      if (res && res.url) {
        setFormData(prev => ({ ...prev, imageUrl: res.url }));
        setUploadError(null);
        onShowToast && onShowToast('Image optimized & uploaded as WebP!', 'success');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      const errorMsg = err.message || 'Image upload failed on server.';
      setUploadError(errorMsg);
      onShowToast && onShowToast(errorMsg, 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'ALL' || (p.category || '').toUpperCase() === selectedCategory.toUpperCase();
      const matchSearch = !searchQuery ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.capacity && p.capacity.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.bestFor && p.bestFor.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setUploadError(null);
    setFormErrors({});
    setFormData({
      ...INITIAL_FORM,
      sortOrder: (products.length || 0) + 1
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setUploadError(null);
    setFormErrors({});
    const featuresStr = Array.isArray(prod.features) ? prod.features.join('\n') : (prod.features || '');
    setFormData({
      name: prod.name || '',
      shortName: prod.shortName || prod.name || '',
      category: (prod.category || 'BUCKETS').toUpperCase(),
      capacity: prod.capacity || (prod.packOptions?.[0]?.size || ''),
      badge: prod.badge || '',
      bestFor: prod.bestFor || prod.description || '',
      featuresText: featuresStr || '',
      imageUrl: prod.imageUrl || '',
      mrp: prod.mrp !== undefined && prod.mrp !== null ? prod.mrp : '',
      distributorPrice: prod.distributorPrice !== undefined && prod.distributorPrice !== null ? prod.distributorPrice : '',
      defaultQty: prod.defaultQty || '1 Unit',
      isActive: prod.isActive !== false,
      sortOrder: prod.sortOrder || 1
    });
    setIsModalOpen(true);
  };

  // Submit Save or Update
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const errors = validateProductForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0];
      const el = document.getElementById(`prod-input-${firstField}`);
      if (el) el.focus();
      onShowToast && onShowToast('Please fix the highlighted form errors', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const featuresArray = formData.featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        short_name: formData.shortName.trim() || formData.name.trim(),
        category: formData.category,
        capacity: formData.capacity,
        badge: formData.badge,
        best_for: formData.bestFor,
        description: formData.bestFor,
        features: featuresArray,
        image_url: formData.imageUrl,
        mrp: parseFloat(formData.mrp) || 0,
        distributor_price: parseFloat(formData.distributorPrice) || 0,
        default_qty: formData.defaultQty,
        is_active: formData.isActive,
        sort_order: parseInt(formData.sortOrder, 10) || 1
      };

      if (editingProduct) {
        await ProductAPI.update(editingProduct.id, payload);
        onShowToast && onShowToast(`"${formData.name}" updated successfully!`, 'success');
      } else {
        await ProductAPI.create(payload);
        onShowToast && onShowToast(`"${formData.name}" published to storefront!`, 'success');
      }

      setIsModalOpen(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Error saving product:', err);
      if (err.errors && typeof err.errors === 'object') {
        const mappedErrors = {};
        for (const [key, msgs] of Object.entries(err.errors)) {
          const fieldKey = key === 'distributor_price' ? 'distributorPrice' : (key === 'default_qty' ? 'defaultQty' : key);
          mappedErrors[fieldKey] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setFormErrors(mappedErrors);
      }
      onShowToast && onShowToast(err.message || 'Failed to save product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Live Website Status
  const handleToggleStatus = async (prod) => {
    try {
      await ProductAPI.toggleStatus(prod.id);
      const newStatus = prod.isActive === false;
      onShowToast && onShowToast(
        newStatus ? `"${prod.name}" is now LIVE on the storefront!` : `"${prod.name}" hidden from the storefront.`,
        'success'
      );
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Error toggling product status:', err);
      onShowToast && onShowToast('Failed to update status', 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the product catalogue?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await ProductAPI.delete(id);
      onShowToast && onShowToast(`"${name}" deleted.`, 'info');
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Error deleting product:', err);
      onShowToast && onShowToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Parse features for preview
  const previewFeatures = useMemo(() => {
    return formData.featuresText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }, [formData.featuresText]);

  const activeCount = products.filter(p => p.isActive !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-heading)', margin: '6px 0 4px 0', letterSpacing: '-0.02em' }}>
            Products & Storefront Packaging
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onNavigateToPricing && (
            <Button variant="secondary" icon={DollarSign} onClick={onNavigateToPricing}>
              Wholesale Pricing Engine
            </Button>
          )}
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Add New Product
          </Button>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Total Store Products"
          value={products.length}
          icon={Package}
          subtext="Configured in database"
          variant="default"
        />
        <KPICard
          title="Published on Website"
          value={activeCount}
          icon={Eye}
          subtext="Visible to public visitors"
          variant="success"
        />
        <KPICard
          title="Product Categories"
          value={new Set(products.map(p => (p.category || 'DEF').toUpperCase())).size}
          icon={Layers}
          subtext="Cans, Buckets, Barrels, IBC"
          variant="info"
        />
        <KPICard
          title="Dispatched In"
          value="24 Hours"
          icon={Truck}
          subtext="Direct Bhadrak Mother Plant"
          variant="gold"
        />
      </div>

      {/* Filter and Search Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: 'var(--bg-surface)',
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORY_OPTIONS.map(opt => {
            const isSelected = selectedCategory === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedCategory(opt.value)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--brand-blue)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--brand-blue)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--text-body)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(0, 143, 224, 0.35)' : 'none'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div style={{ width: '280px', position: 'relative' }}>
          <Input
            placeholder="Search products, capacity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>
      </div>

      {/* Products Grid (Identical Layout to the Website Cards) */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '20px',
          border: '1px dashed var(--border-color)'
        }}>
          <Package size={48} color="var(--brand-blue)" style={{ margin: '0 auto 14px auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
            No products match this filter
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            Try adjusting your search query or category filter, or click below to configure a new product.
          </p>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Add First Product
          </Button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {filteredProducts.map(prod => {
            const isLive = prod.isActive !== false;
            const features = Array.isArray(prod.features) ? prod.features : [];

            return (
              <div
                key={prod.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '22px',
                  border: isLive ? '1px solid var(--border-color)' : '1px dashed rgba(239, 68, 68, 0.4)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  position: 'relative',
                  opacity: isLive ? 1 : 0.75,
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div>
                  {/* Card Header: Badge & Status Switch */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{
                      backgroundColor: 'rgba(0, 200, 245, 0.15)',
                      color: 'var(--brand-cyan)',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontSize: '11px',
                      fontWeight: 900
                    }}>
                      {prod.badge || 'Storefront'}
                    </span>

                    {/* Published on Website Status Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(prod)}
                      title={isLive ? "Live on website (Click to hide)" : "Hidden from website (Click to publish)"}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isLive ? '#10B981' : '#EF4444'
                      }}
                    >
                      {isLive ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span>{isLive ? 'Published' : 'Hidden'}</span>
                    </button>
                  </div>

                  {/* Product Image Box */}
                  <div style={{
                    width: '100%',
                    height: '190px',
                    backgroundColor: 'rgba(5, 17, 38, 0.7)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    border: '1px solid var(--border-color)',
                    padding: '10px'
                  }}>
                    <img
                      src={prod.imageUrl || '/images/def_bucket_20l.jpg'}
                      alt={prod.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  </div>

                  {/* Product Title & Capacity */}
                  <h3 style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 4px 0' }}>
                    {prod.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--brand-cyan)', fontWeight: 800 }}>
                      Capacity: {prod.capacity || 'Standard'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
                    <span style={{
                      fontSize: '11px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)'
                    }}>
                      {(prod.category || 'DEF').toUpperCase()}
                    </span>
                  </div>

                  {/* Recommended For */}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5, minHeight: '36px' }}>
                    <strong style={{ color: 'var(--text-body)' }}>Recommended:</strong> {prod.bestFor || prod.description || 'All standard commercial fleet operations'}
                  </div>

                  {/* Bullet points features list */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginBottom: '18px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {features.map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.45 }}>
                          <Check size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pricing & Management Actions */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MRP / Unit</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
                        ₹ {parseFloat(prod.mrp || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--brand-cyan)' }}>B2B Wholesale</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                        ₹ {parseFloat(prod.distributorPrice || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit3}
                      onClick={() => handleOpenEdit(prod)}
                      style={{ flex: 1 }}
                    >
                      Edit Product
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      loading={deletingId === prod.id}
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Configure New Storefront Product'}
          maxWidth="900px"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>

            {/* Form Column */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Product Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '6px' }}>
                  Product Name *
                </label>
                <Input
                  id="prod-input-name"
                  required
                  placeholder="e.g. 20L Smart Bucket, 210L Barrel"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  onBlur={(e) => {
                    const err = validateField('name', e.target.value);
                    if (err) setFormErrors(prev => ({ ...prev, name: err }));
                  }}
                  error={formErrors.name}
                />
              </div>

              {/* Category & Capacity Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '6px' }}>
                    Packaging Category *
                  </label>
                  <Select
                    id="prod-input-category"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (formErrors.category) setFormErrors(prev => ({ ...prev, category: undefined }));
                    }}
                    options={[
                      { value: 'BUCKETS', label: 'Buckets (20L)' },
                      { value: 'CANS', label: 'Cans (5L / 10L)' },
                      { value: 'BARRELS', label: 'Barrels (210L)' },
                      { value: 'IBC', label: 'IBC Tanks (1000L)' },
                      { value: 'BULK', label: 'Bulk Road Tankers' },
                      { value: 'OTHER', label: 'Other Packaging' }
                    ]}
                  />
                  {formErrors.category && (
                    <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⚠️</span> {formErrors.category}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '6px' }}>
                    Capacity / Volume *
                  </label>
                  <Input
                    id="prod-input-capacity"
                    required
                    placeholder="e.g. 20 Litres, 210 Litres"
                    value={formData.capacity}
                    onChange={(e) => {
                      setFormData({ ...formData, capacity: e.target.value });
                      if (formErrors.capacity) setFormErrors(prev => ({ ...prev, capacity: undefined }));
                    }}
                    onBlur={(e) => {
                      const err = validateField('capacity', e.target.value);
                      if (err) setFormErrors(prev => ({ ...prev, capacity: err }));
                    }}
                    error={formErrors.capacity}
                  />
                </div>
              </div>

              {/* Badge Text */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '6px' }}>
                  Card Badge Tag
                </label>
                <Input
                  placeholder="e.g. Most Popular • Fleet Choice, LCV & Emergency"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                />
              </div>

              {/* Recommended Audience / Best For */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '6px' }}>
                  Recommended Use / Best For
                </label>
                <textarea
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-heading)',
                    fontSize: '13px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g. Medium & Heavy Commercial Vehicles (M&HCV), Highway Fleets, Retail"
                  value={formData.bestFor}
                  onChange={(e) => setFormData({ ...formData, bestFor: e.target.value })}
                />
              </div>

              {/* Features List (1 per line) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-body)' }}>
                    Key Features (1 per line)
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Appears with green checkmarks</span>
                </div>
                <textarea
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-heading)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Airtight tamper-evident induction heat seal&#10;Integrated flexible retractable pouring spout&#10;Drop-tested reinforced handle&#10;Full batch QR code"
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                />
              </div>

              {/* Direct Product Image Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '8px' }}>
                  Product Image
                </label>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {formData.imageUrl ? (
                  <div style={{
                    position: 'relative',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '14px',
                    backgroundColor: 'rgba(5, 17, 38, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.08)',
                      flexShrink: 0
                    }}>
                      <img
                        src={formData.imageUrl}
                        alt="Uploaded product"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '2px' }}>
                        Image Uploaded
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-cyan)', marginBottom: '10px' }}>
                        Ready for storefront publication
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={Upload}
                          onClick={() => fileInputRef.current?.click()}
                          loading={isUploading}
                        >
                          Change Image
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          icon={X}
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChange({ target: { files: [file] } });
                    }}
                    style={{
                      border: '2px dashed var(--brand-blue)',
                      borderRadius: '14px',
                      padding: '28px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(0, 143, 224, 0.05)',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    <Upload size={32} color="var(--brand-cyan)" style={{ margin: '0 auto 10px auto' }} />
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '4px' }}>
                      {isUploading ? 'Uploading Image...' : 'Click or Drag to Upload Product Image'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Supports PNG, JPG, WEBP, SVG from your computer
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#FCA5A5',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    lineHeight: 1.4
                  }}>
                    <span style={{ fontSize: '15px' }}>⚠️</span>
                    <div>
                      <strong>Server Upload Error:</strong> {uploadError}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Commercials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '4px' }}>
                    MRP (₹) *
                  </label>
                  <Input
                    id="prod-input-mrp"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 1500"
                    value={formData.mrp}
                    onChange={(e) => {
                      setFormData({ ...formData, mrp: e.target.value });
                      if (formErrors.mrp) setFormErrors(prev => ({ ...prev, mrp: undefined }));
                    }}
                    onBlur={(e) => {
                      const err = validateField('mrp', e.target.value, formData);
                      if (err) setFormErrors(prev => ({ ...prev, mrp: err }));
                    }}
                    error={formErrors.mrp}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '4px' }}>
                    B2B Price (₹) *
                  </label>
                  <Input
                    id="prod-input-distributorPrice"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 1100"
                    value={formData.distributorPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, distributorPrice: e.target.value });
                      if (formErrors.distributorPrice) setFormErrors(prev => ({ ...prev, distributorPrice: undefined }));
                    }}
                    onBlur={(e) => {
                      const err = validateField('distributorPrice', e.target.value, formData);
                      if (err) setFormErrors(prev => ({ ...prev, distributorPrice: err }));
                    }}
                    error={formErrors.distributorPrice}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-body)', marginBottom: '4px' }}>
                    Default Quote Qty *
                  </label>
                  <Input
                    id="prod-input-defaultQty"
                    required
                    placeholder="e.g. 25 Buckets, 1 IBC"
                    value={formData.defaultQty}
                    onChange={(e) => {
                      setFormData({ ...formData, defaultQty: e.target.value });
                      if (formErrors.defaultQty) setFormErrors(prev => ({ ...prev, defaultQty: undefined }));
                    }}
                    onBlur={(e) => {
                      const err = validateField('defaultQty', e.target.value, formData);
                      if (err) setFormErrors(prev => ({ ...prev, defaultQty: err }));
                    }}
                    error={formErrors.defaultQty}
                  />
                </div>
              </div>

              {/* Visibility Switch */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-heading)' }}>
                    Published on Public Website
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    When toggled on, visitors will immediately see this card on the homepage
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: formData.isActive ? '#10B981' : '#475569',
                    borderRadius: '24px',
                    transition: '0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}>
                    <span style={{
                      height: '20px',
                      width: '20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transform: formData.isActive ? 'translateX(20px)' : 'translateX(0px)',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" loading={isSubmitting} onClick={handleSubmit}>
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </Button>
              </div>
            </form>

            {/* Live Website Preview Card */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Eye size={15} color="var(--brand-cyan)" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Live Storefront Preview
                </span>
              </div>

              {/* The Live Card Replica */}
              <div style={{
                backgroundColor: '#0A1832',
                borderRadius: '22px',
                border: '2px solid var(--brand-blue)',
                padding: '24px',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <span style={{
                      backgroundColor: 'var(--brand-blue)',
                      color: '#FFFFFF',
                      padding: '5px 12px',
                      borderRadius: '50px',
                      fontSize: '11px',
                      fontWeight: 900
                    }}>
                      {formData.badge || 'Preview Badge'}
                    </span>
                    <Package size={20} color="var(--brand-cyan)" />
                  </div>

                  <div style={{
                    width: '100%',
                    height: '190px',
                    backgroundColor: '#051126',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px'
                  }}>
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt={formData.name || 'Product'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748B' }}>
                        <ImageIcon size={38} color="#475569" style={{ margin: '0 auto 6px auto' }} />
                        <div style={{ fontSize: '11px', fontWeight: 600 }}>Upload image to preview</div>
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', marginBottom: '4px' }}>
                    {formData.name || 'Product Title'}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--brand-cyan)', fontWeight: 800, marginBottom: '12px' }}>
                    Capacity: {formData.capacity || 'Volume'}
                  </div>

                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px', lineHeight: 1.5 }}>
                    <strong style={{ color: '#E2E8F0' }}>Recommended:</strong> {formData.bestFor || 'Target application'}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '18px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {previewFeatures.map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#CBD5E1', lineHeight: 1.45 }}>
                          <Check size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Quote Button Preview */}
                <div style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '50px',
                  backgroundColor: 'var(--brand-blue)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(0, 143, 224, 0.4)',
                  boxSizing: 'border-box'
                }}>
                  <span>Get Quote for {formData.shortName || formData.name || 'Product'}</span>
                  <span>→</span>
                </div>
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
