import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  Printer,
  Download,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Truck,
  Warehouse,
  Sparkles,
  CreditCard,
  Phone,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Package,
  ShieldCheck,
  DollarSign,
  Tag,
  Percent,
  X,
  Minus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { KPICard } from '../components/ui/KPICard';
import { InvoiceModal, WhatsAppIcon } from '../components/ui/InvoiceModal';
import { Modal } from '../components/ui/Modal';
import {
  InventoryAPI,
  SalesAPI,
  ProductAPI,
  PromotionAPI,
  DistributorOrderAPI,
  DistributorAPI
} from '../services/api';
import { ROLES } from '../config/roles';
import { toast } from '../context/ToastContext';

export const SalesOperatorTerminal = ({ authUser, activeTab: externalTab, onTabChange }) => {
  const [currentTab, setCurrentTab] = useState(() => {
    if (externalTab === 'stock_check') return 'stock_check';
    if (externalTab === 'sales_history') return 'sales_history';
    if (externalTab === 'shift_summary') return 'shift_summary';
    return 'pos_billing';
  });

  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  const currentOperatorName = authUser?.name || '';

  // Helper to extract assigned depot for sales operator
  const getOperatorAssignedDepot = () => {
    return authUser?.assignedDepot || authUser?.assigned_depot || authUser?.stationDepot || authUser?.organization || '';
  };

  const assignedDepotName = getOperatorAssignedDepot();
  const isOperator = authUser?.role === ROLES.OPERATOR;

  const filterLocationsForUser = (allLocs) => {
    if (!isOperator || !assignedDepotName) {
      return allLocs;
    }
    return allLocs.filter(l =>
      l.name.toLowerCase().trim() === assignedDepotName.toLowerCase().trim() ||
      l.name.toLowerCase().includes(assignedDepotName.toLowerCase()) ||
      assignedDepotName.toLowerCase().includes(l.name.toLowerCase())
    );
  };

  // Sync external tab prop from sidebar
  useEffect(() => {
    if (externalTab) {
      if (externalTab === 'stock_check') setCurrentTab('stock_check');
      else if (externalTab === 'sales_history') setCurrentTab('sales_history');
      else if (externalTab === 'shift_summary') setCurrentTab('shift_summary');
      else setCurrentTab('pos_billing');
    }
  }, [externalTab]);

  const handleTabSwitch = (tabId) => {
    setCurrentTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [partPaymentMethod, setPartPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');

  // Approved B2B Distributor Orders State
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [selectedDistributorOrder, setSelectedDistributorOrder] = useState(null);
  const [isB2BModalOpen, setIsB2BModalOpen] = useState(false);
  const [b2bPaymentMode, setB2bPaymentMode] = useState('FULL_CREDIT'); // 'FULL_PAID' | 'FULL_CREDIT' | 'PART_CREDIT'
  const [partPaymentAmount, setPartPaymentAmount] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [posError, setPosError] = useState('');
  const [posSuccess, setPosSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Product Search State for POS Billing Terminal
  const [billingProductSearch, setBillingProductSearch] = useState('');

  // Discount & Coupon State
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'percent' | 'amount' | 'coupon'
  const [discountValue, setDiscountValue] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCouponByCode = (codeToApply) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      toast.warning('Please enter a coupon code.');
      setCouponError('Please enter a coupon code.');
      return;
    }
    const found = availableCoupons.find(p => (p.promo_code || '').trim().toUpperCase() === code);
    if (!found) {
      toast.error(`Coupon code "${code}" is not valid or expired.`);
      setCouponError(`Coupon code "${code}" is not valid or expired.`);
      return;
    }
    setAppliedCoupon(found);
    setDiscountType('coupon');
    setCouponCodeInput('');
    setCouponError('');
    toast.success(`Coupon code "${code}" applied successfully!`);
  };

  const handleRemoveDiscount = () => {
    setDiscountType('none');
    setDiscountValue('');
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  // Strict Validation Rules
  const validateCustomerName = (val) => {
    if (!val || !val.trim()) return 'Customer / Fleet Name is required.';
    if (val.trim().length < 3) return 'Customer Name must be at least 3 characters.';
    if (!/^[a-zA-Z0-9\s\.\,\-\&]{3,100}$/.test(val.trim())) {
      return 'Customer Name contains invalid characters (letters, numbers, spaces, dots, &, - only).';
    }
    return '';
  };

  const validateCustomerPhone = (val) => {
    if (!val || !val.trim()) return 'Customer Mobile is required for SMS receipt.';
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length === 10 && /^[6-9]\d{9}$/.test(cleanDigits)) {
      return '';
    }
    if (cleanDigits.length === 12 && cleanDigits.startsWith('91') && /^[6-9]/.test(cleanDigits.slice(2))) {
      return '';
    }
    return 'Enter a valid 10-digit Indian mobile number starting with 6-9 (e.g. 9853675971).';
  };

  const validateVehicleNo = (val) => {
    if (!val || !val.trim()) return ''; // Optional
    const clean = val.trim().toUpperCase().replace(/[\s\-]/g, '');
    // Standard Indian vehicle plate: 2 letters (state) + 1-2 digits (RTO) + optional 0-3 letters (series) + 4 digits
    const standardPlate = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
    // Bharat Series (BH): e.g. 22BH1234AA
    const bharatPlate = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
    // Counter sale alias
    const counterKeyword = /^(COUNTER|WALKIN|DIRECT)$/i;

    if (!standardPlate.test(clean) && !bharatPlate.test(clean) && !counterKeyword.test(clean)) {
      return 'Invalid vehicle registration format (e.g. OD05AX4892, 22BH1234AA, or leave blank).';
    }
    return '';
  };

  const validatePaymentRef = (method, ref) => {
    if (method === 'Cash') return '';
    const trimmed = (ref || '').trim();
    if (!trimmed) {
      return method.includes('UPI')
        ? 'UPI UTR / Reference number is required.'
        : 'Bank UTR / Transaction Reference number is required.';
    }
    if (trimmed.length < 4) {
      return 'Reference / UTR must be at least 4 characters.';
    }
    return '';
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCustomerName(val);
    setFieldErrors(prev => ({ ...prev, customerName: validateCustomerName(val) }));
  };

  const handlePhoneChange = (e) => {
    // Strictly sanitize: permit only digits and leading +
    const raw = e.target.value;
    const sanitized = raw.replace(/[^\d\+\s\-]/g, '');
    setCustomerPhone(sanitized);
    setFieldErrors(prev => ({ ...prev, customerPhone: validateCustomerPhone(sanitized) }));
  };

  const handleVehicleChange = (e) => {
    // Strictly sanitize: auto uppercase and remove invalid punctuation
    const raw = e.target.value.toUpperCase();
    const sanitized = raw.replace(/[^A-Z0-9\s\-]/g, '');
    setVehicleNo(sanitized);
    if (sanitized.trim()) {
      setFieldErrors(prev => ({ ...prev, vehicleNo: validateVehicleNo(sanitized) }));
    } else {
      setFieldErrors(prev => ({ ...prev, vehicleNo: '' }));
    }
  };

  const loadData = async () => {
    if (!authUser) return;
    try {
      setLoading(true);
      if (currentTab === 'pos_billing') {
        const [inv, prods, locs, promos, invs, appOrders] = await Promise.all([
          InventoryAPI.getAll().catch(() => []),
          ProductAPI.getAll().catch(() => []),
          InventoryAPI.getLocations().catch(() => []),
          PromotionAPI.getAll().catch(() => []),
          SalesAPI.getAllInvoices().catch(() => []),
          DistributorOrderAPI.getAll({ status: 'APPROVED' }).catch(() => [])
        ]);
        setInventory(inv || []);
        setProducts(prods || []);
        setAvailableCoupons(promos || []);
        setInvoices(invs || []);
        setApprovedOrders(appOrders || []);
        if (locs && locs.length > 0) {
          const userLocs = filterLocationsForUser(locs);
          setLocations(userLocs);
          if (userLocs.length > 0) {
            if (!selectedLocation || !userLocs.some(l => l.id === selectedLocation)) {
              setSelectedLocation(userLocs[0].id);
            }
          }
        }
      } else if (currentTab === 'stock_check') {
        const [inv, locs] = await Promise.all([
          InventoryAPI.getAll().catch(() => []),
          InventoryAPI.getLocations().catch(() => [])
        ]);
        setInventory(inv || []);
        if (locs && locs.length > 0) {
          const userLocs = filterLocationsForUser(locs);
          setLocations(userLocs);
          if (userLocs.length > 0) {
            if (!selectedLocation || !userLocs.some(l => l.id === selectedLocation)) {
              setSelectedLocation(userLocs[0].id);
            }
          }
        }
      } else if (currentTab === 'sales_history' || currentTab === 'shift_summary') {
        const invs = await SalesAPI.getAllInvoices().catch(() => []);
        setInvoices(invs || []);
      }
    } catch (e) {
      console.error('Error fetching terminal data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      loadData();
    }
  }, [currentTab, authUser]);

  const locationInventory = inventory.filter(i => {
    if (selectedLocation) {
      return i.locationId === selectedLocation;
    }
    if (assignedDepotName) {
      return (
        i.locationName?.toLowerCase().trim() === assignedDepotName.toLowerCase().trim() ||
        (i.locationName && i.locationName.toLowerCase().includes(assignedDepotName.toLowerCase())) ||
        (i.locationName && assignedDepotName.toLowerCase().includes(i.locationName.toLowerCase()))
      );
    }
    return true;
  });

  const getStockForSku = (sku) => {
    const item = locationInventory.find(i => i.sku === sku);
    return item ? item.availableStock : 0;
  };

  const handleAddToCart = (product, pack) => {
    setPosError('');
    const availableStock = getStockForSku(pack.sku);

    if (availableStock <= 0) {
      toast.error(`Cannot add ${pack.size}: Item is OUT OF STOCK at this location.`);
      setPosError(`Cannot add ${pack.size}: Item is OUT OF STOCK at this location.`);
      return;
    }

    const existingIndex = cartItems.findIndex(i => i.sku === pack.sku);
    if (existingIndex >= 0) {
      const currentQty = cartItems[existingIndex].qty;
      if (currentQty + 1 > availableStock) {
        toast.warning(`Cannot increase quantity: Only ${availableStock} units available in stock!`);
        setPosError(`Cannot increase quantity: Only ${availableStock} units available in stock!`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex].qty += 1;
      setCartItems(updated);
      toast.info(`Updated "${product.name} (${pack.size})" quantity to ${updated[existingIndex].qty}`);
    } else {
      const batchItem = locationInventory.find(i => i.sku === pack.sku);
      const currentBatchNo = batchItem?.batchNo || '';

      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          sku: pack.sku,
          name: `${product.name} (${pack.size})`,
          packSize: pack.size,
          unitPrice: pack.mrp,
          gstRate: pack.gstRate || product.gstRate || 18,
          isGstInclusive: pack.isGstInclusive !== undefined ? pack.isGstInclusive : (product.isGstInclusive !== undefined ? product.isGstInclusive : true),
          qty: 1,
          batchNo: currentBatchNo
        }
      ]);
      toast.success(`Added "${product.name} (${pack.size})" to billing cart`);
    }
  };

  // Flattened active product variants for instant billing search & quick-add
  const allProductVariants = useMemo(() => {
    return (products || []).filter(p => p.isActive !== false).flatMap(prod => 
      (prod.packOptions || []).map(pack => ({
        product: prod,
        pack: pack,
        sku: pack.sku,
        name: `${prod.name} (${pack.size})`,
        productName: prod.name,
        size: pack.size,
        category: prod.category,
        mrp: pack.mrp,
        availableStock: getStockForSku(pack.sku)
      }))
    );
  }, [products, locationInventory]);

  // Quick-add popular packaging variants (sorted: in-stock first, up to 8 packaging options)
  const quickAddVariants = useMemo(() => {
    return [...allProductVariants].sort((a, b) => (b.availableStock > 0 ? 1 : 0) - (a.availableStock > 0 ? 1 : 0)).slice(0, 8);
  }, [allProductVariants]);

  // Real-time matching variants for billing search
  const matchingBillingVariants = useMemo(() => {
    const q = billingProductSearch.trim().toLowerCase();
    if (!q) return [];
    return allProductVariants.filter(item => 
      item.name.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [allProductVariants, billingProductSearch]);

  const handleLoadDistributorOrder = (order) => {
    setSelectedDistributorOrder(order);
    setCustomerName(order.distributorCompany || order.distributorName || '');
    setCustomerPhone(order.distributorPhone || '');
    setVehicleNo('DEPOT DISPATCH');
    setPaymentMethod('Credit');
    setB2bPaymentMode('FULL_CREDIT');
    setPartPaymentAmount('');
    setPartPaymentMethod('UPI');
    setPaymentRef('');
    setPosError('');
    setFieldErrors({});

    // Load items at wholesale distributor base rates
    const newCart = (order.items || []).map(it => {
      const batchItem = locationInventory.find(i => i.sku === it.sku);
      return {
        sku: it.sku,
        name: `${it.productName} (${it.packSize})`,
        packSize: it.packSize,
        qty: parseInt(it.quantity, 10),
        unitPrice: parseFloat(it.unitPrice || 0),
        gstRate: 18,
        isGstInclusive: true,
        batchNo: batchItem?.batchNo || '',
        availableStock: batchItem?.availableStock ?? 0
      };
    });

    setCartItems(newCart);
    setIsB2BModalOpen(false);
    toast.success(`Loaded approved B2B Order #${order.orderNumber} for ${order.distributorCompany}!`);
    setPosSuccess(`Loaded approved B2B Order #${order.orderNumber} for ${order.distributorCompany}!`);
  };

  const handleClearDistributorOrder = () => {
    setSelectedDistributorOrder(null);
    setPaymentMethod('UPI');
    setB2bPaymentMode('FULL_CREDIT');
    setPartPaymentAmount('');
    setPartPaymentMethod('UPI');
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setVehicleNo('');
    setPaymentRef('');
    setFieldErrors({});
    setPosError('');
    setPosSuccess('');
  };

  const handleUpdateQtyRaw = (index, newQty) => {
    setPosError('');
    const item = cartItems[index];
    if (!item) return;

    if (newQty === '') {
      const updated = [...cartItems];
      updated[index].qty = '';
      setCartItems(updated);
      return;
    }

    const availableStock = getStockForSku(item.sku);
    if (newQty > availableStock) {
      toast.warning(`Anti-Overbilling Protection: Only ${availableStock} units physically in stock.`);
      setPosError(`Anti-Overbilling Protection: Cannot bill ${newQty} units. Only ${availableStock} units physically in stock.`);
      const updated = [...cartItems];
      updated[index].qty = availableStock;
      setCartItems(updated);
      return;
    }

    const updated = [...cartItems];
    updated[index].qty = Math.max(0, newQty);
    setCartItems(updated);
  };

  const handleDecrementQty = (index) => {
    const item = cartItems[index];
    const current = parseInt(item.qty, 10) || 1;
    if (current <= 1) {
      handleRemoveItem(index);
    } else {
      handleUpdateQtyRaw(index, current - 1);
    }
  };

  const handleIncrementQty = (index) => {
    const item = cartItems[index];
    const current = parseInt(item.qty, 10) || 0;
    handleUpdateQtyRaw(index, current + 1);
  };

  const handleRemoveItem = (index) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
  };

  // Dynamic Product-Wise Billing Totals with Discount Support
  const subtotal = cartItems.reduce((acc, i) => acc + (i.unitPrice * (parseInt(i.qty, 10) || 0)), 0);

  // Calculate discount
  let calculatedDiscount = 0;
  let discountLabel = '';

  if (discountType === 'percent') {
    const pct = Math.max(0, Math.min(100, parseFloat(discountValue) || 0));
    calculatedDiscount = (subtotal * pct) / 100;
    discountLabel = `${pct}% OFF`;
  } else if (discountType === 'amount') {
    const amt = Math.max(0, parseFloat(discountValue) || 0);
    calculatedDiscount = Math.min(subtotal, amt);
    discountLabel = `₹ ${amt} OFF`;
  } else if (discountType === 'coupon' && appliedCoupon) {
    const text = appliedCoupon.discount_percent || '';
    const matchPct = text.match(/(\d+(\.\d+)?)\s*%/);
    const matchAmt = text.match(/₹\s*(\d+(\.\d+)?)/);
    if (matchPct) {
      const pct = parseFloat(matchPct[1]);
      calculatedDiscount = (subtotal * pct) / 100;
      discountLabel = `Coupon ${appliedCoupon.promo_code} (${pct}%)`;
    } else if (matchAmt) {
      const amt = parseFloat(matchAmt[1]);
      calculatedDiscount = Math.min(subtotal, amt);
      discountLabel = `Coupon ${appliedCoupon.promo_code} (₹${amt})`;
    } else {
      calculatedDiscount = (subtotal * 10) / 100;
      discountLabel = `Coupon ${appliedCoupon.promo_code} (10%)`;
    }
  }
  calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

  const discountRatio = subtotal > 0 ? (calculatedDiscount / subtotal) : 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let calculatedGrandTotal = 0;

  cartItems.forEach(item => {
    const numQty = parseInt(item.qty, 10) || 0;
    const rawLine = item.unitPrice * numQty;
    const lineDiscount = rawLine * discountRatio;
    const lineNet = Math.max(0, rawLine - lineDiscount);
    const rate = item.gstRate || 18;
    const isIncl = item.isGstInclusive !== false;

    if (isIncl) {
      const lineTaxable = lineNet / (1 + (rate / 100));
      const lineTax = lineNet - lineTaxable;
      totalTaxable += lineTaxable;
      totalCgst += (lineTax / 2);
      totalSgst += (lineTax / 2);
      calculatedGrandTotal += lineNet;
    } else {
      const lineTax = lineNet * (rate / 100);
      totalTaxable += lineNet;
      totalCgst += (lineTax / 2);
      totalSgst += (lineTax / 2);
      calculatedGrandTotal += (lineNet + lineTax);
    }
  });

  const taxable = Math.round(totalTaxable * 100) / 100;
  const cgst = Math.round(totalCgst * 100) / 100;
  const sgst = Math.round(totalSgst * 100) / 100;
  const grandTotal = Math.round(calculatedGrandTotal * 100) / 100;

  // Real Laravel Invoice Generation
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    setPosError('');
    setPosSuccess('');

    if (cartItems.length === 0) {
      toast.warning('Cart is empty. Please select at least one product.');
      setPosError('Cart is empty. Please select at least one product.');
      return;
    }

    const invalidQtyItem = cartItems.find(i => !i.qty || parseInt(i.qty, 10) <= 0);
    if (invalidQtyItem) {
      toast.warning(`Please specify a valid quantity for "${invalidQtyItem.name}".`);
      setPosError(`Please specify a valid quantity for "${invalidQtyItem.name}".`);
      return;
    }

    const nameErr = validateCustomerName(customerName);
    const phoneErr = validateCustomerPhone(customerPhone);
    const vehicleErr = validateVehicleNo(vehicleNo);

    // UTR validation based on Mode of Payment
    const isCredit = paymentMethod === 'Credit';
    const isFullCredit = isCredit && b2bPaymentMode === 'FULL_CREDIT';
    const activeRefMethod = isCredit
      ? (b2bPaymentMode === 'PART_CREDIT' ? partPaymentMethod : null)
      : paymentMethod;
    const refErr = (isFullCredit || !activeRefMethod || activeRefMethod === 'Cash')
      ? ''
      : validatePaymentRef(activeRefMethod, paymentRef);

    if (nameErr || phoneErr || vehicleErr || refErr) {
      const firstErr = nameErr || phoneErr || vehicleErr || refErr;
      setFieldErrors({
        customerName: nameErr,
        customerPhone: phoneErr,
        vehicleNo: vehicleErr,
        paymentRef: refErr
      });
      toast.error(firstErr);
      setPosError(firstErr);
      return;
    }

    // Clean phone number for database / SMS dispatch
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    }
    const finalPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : customerPhone.trim();
    const finalVehicle = vehicleNo.trim() ? vehicleNo.trim().toUpperCase().replace(/\s+/g, '-') : '';

    // Payment Settlement & Credit Calculations
    let paidAmt = grandTotal;
    let creditAmt = 0;
    let effectivePaymentMethod = paymentMethod;

    if (isCredit) {
      if (b2bPaymentMode === 'FULL_CREDIT') {
        paidAmt = 0;
        creditAmt = grandTotal;
        effectivePaymentMethod = 'Revolving Credit (30 Days)';
      } else if (b2bPaymentMode === 'PART_CREDIT') {
        const inputPaid = parseFloat(partPaymentAmount || 0);
        if (isNaN(inputPaid) || inputPaid <= 0) {
          toast.warning('Please enter a valid upfront payment amount for partial credit billing.');
          setPosError('Please enter a valid upfront payment amount for partial credit billing.');
          return;
        }
        if (inputPaid >= grandTotal) {
          toast.warning('Upfront payment is equal to or greater than the grand total. Please choose Direct Cash/UPI for 100% upfront payment.');
          setPosError('Upfront payment is equal to or greater than the grand total. Please choose Direct Cash/UPI for 100% upfront payment.');
          return;
        }
        paidAmt = inputPaid;
        creditAmt = Math.round((grandTotal - inputPaid) * 100) / 100;
        effectivePaymentMethod = `${partPaymentMethod} (₹${paidAmt.toLocaleString('en-IN')}) + Credit (₹${creditAmt.toLocaleString('en-IN')})`;
      }

      // Check Available Credit Limit
      if (creditAmt > 0 && selectedDistributorOrder) {
        const availableLimit = selectedDistributorOrder.availableCredit != null ? selectedDistributorOrder.availableCredit : 0;
        if (creditAmt > availableLimit) {
          const limitMsg = `Credit limit exceeded: Required credit ₹${creditAmt.toLocaleString('en-IN')} exceeds distributor's available limit ₹${availableLimit.toLocaleString('en-IN')}. Please collect an upfront payment of at least ₹${(creditAmt - availableLimit).toLocaleString('en-IN')}.`;
          toast.error(limitMsg);
          setPosError(limitMsg);
          return;
        }
      }
    } else {
      paidAmt = grandTotal;
      creditAmt = 0;
      effectivePaymentMethod = paymentMethod;
    }

    try {
      const result = await SalesAPI.createInvoice({
        customerName: customerName.trim(),
        customerPhone: finalPhone,
        vehicleNo: finalVehicle,
        locationId: selectedLocation,
        operatorName: currentOperatorName,
        items: cartItems,
        discountAmount: calculatedDiscount,
        discountType: discountType,
        couponCode: appliedCoupon?.promo_code || null,
        paymentMethod: effectivePaymentMethod,
        paymentRef: (isFullCredit || !activeRefMethod || activeRefMethod === 'Cash') ? '' : paymentRef.trim(),
        distributorId: selectedDistributorOrder?.distributorId || null,
        distributorOrderId: selectedDistributorOrder?.id || null,
        paymentMode: isCredit ? b2bPaymentMode : 'FULL_PAID',
        paidAmount: paidAmt,
        creditAmount: creditAmt
      });

      if (result.success) {
        const createdInv = {
          id: result.invoice_number,
          customerName: customerName.trim(),
          customerPhone: finalPhone,
          vehicleNo: finalVehicle,
          location: locations.find(l => l.id === selectedLocation)?.name || '',
          operatorName: currentOperatorName,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          items: cartItems.map(item => {
            const price = parseFloat(item.unitPrice || 0);
            const q = parseInt(item.qty, 10) || 1;
            return {
              name: item.name,
              sku: item.sku,
              batchNo: item.batchNo || '',
              qty: q,
              unitPrice: price,
              amount: price * q,
              total: price * q
            };
          }),
          subtotal,
          discount: calculatedDiscount,
          taxable,
          cgst,
          sgst,
          grandTotal: result.grand_total || grandTotal,
          paymentMethod: effectivePaymentMethod,
          paymentStatus: creditAmt > 0 ? (paidAmt > 0 ? 'PART_CREDIT' : 'ON_CREDIT') : 'PAID',
          smsSent: true,
          pdfGenerated: true
        };

        // Reset form & B2B mode
        setSelectedDistributorOrder(null);
        setB2bPaymentMode('FULL_CREDIT');
        setPartPaymentAmount('');
        setCartItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setVehicleNo('');
        setPaymentRef('');
        handleRemoveDiscount();
        setFieldErrors({});
        setActiveInvoiceForModal(createdInv);
        toast.success(`Invoice #${createdInv.id} created successfully! Depot stock decremented and B2B order updated.`);
        setPosSuccess(`Invoice #${createdInv.id} created successfully. Depot stock decremented and B2B order updated!`);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Error generating invoice on backend.');
      setPosError(err.message || 'Error generating invoice on backend.');
    }
  };

  // Scoped Invoices for Operator
  const operatorInvoices = isOperator
    ? invoices.filter(inv => {
      const matchesLoc = assignedDepotName && (
        (inv.location && inv.location.toLowerCase().includes(assignedDepotName.toLowerCase())) ||
        (inv.location && assignedDepotName.toLowerCase().includes(inv.location.toLowerCase()))
      );
      const matchesOp = inv.operatorName && inv.operatorName.toLowerCase() === currentOperatorName.toLowerCase();
      return matchesLoc || matchesOp;
    })
    : invoices;

  // Shift Calculations
  const shiftInvoicesCount = operatorInvoices.length;
  const shiftRevenue = operatorInvoices.reduce((acc, inv) => acc + (parseFloat(inv.grandTotal) || 0), 0);
  const shiftTaxCollected = operatorInvoices.reduce((acc, inv) => acc + ((parseFloat(inv.cgst) || 0) + (parseFloat(inv.sgst) || 0)), 0);
  const upiTotal = operatorInvoices.filter(i => (i.paymentMethod || '').toLowerCase().includes('upi')).reduce((acc, i) => acc + (parseFloat(i.grandTotal) || 0), 0);
  const cashTotal = operatorInvoices.filter(i => (i.paymentMethod || '').toLowerCase().includes('cash')).reduce((acc, i) => acc + (parseFloat(i.grandTotal) || 0), 0);

  const filteredStock = locationInventory.filter(item =>
    !stockSearchQuery ||
    item.productName.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );

  if (!authUser) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Sleek Integrated POS Command Bar */}
      <div
        className="ub-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'linear-gradient(135deg, rgba(14, 29, 62, 0.85) 0%, rgba(9, 20, 44, 0.95) 100%)',
          border: '1px solid rgba(0, 200, 245, 0.22)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Top Info Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 143, 224, 0.25) 0%, rgba(0, 200, 245, 0.35) 100%)',
              border: '1.5px solid var(--brand-cyan)',
              color: 'var(--brand-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 200, 245, 0.25)',
              flexShrink: 0
            }}>
              <ShoppingCart size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', margin: 0, fontWeight: 800, fontFamily: 'var(--font-family-heading)', letterSpacing: '-0.01em' }}>
                  Sales Operator Direct POS Terminal
                </h2>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  Live Station Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span>Operator: <strong style={{ color: '#FFFFFF' }}>{currentOperatorName}</strong></span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Warehouse size={13} color="var(--brand-cyan)" />
                  <span>Depot: <strong style={{ color: 'var(--brand-cyan)' }}>{locations.find(l => l.id === selectedLocation)?.name || assignedDepotName || 'Assigned Station'}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: B2B Order Pill & Depot Switcher if admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {!isOperator && (
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPosError('');
                }}
                className="ub-select"
                style={{ width: 'min(100%, 240px)', height: '36px', fontSize: '12px' }}
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.state || 'Depot'})
                  </option>
                ))}
              </select>
            )}

            {approvedOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsB2BModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 180, 0, 0.15) 0%, rgba(245, 180, 0, 0.28) 100%)',
                  border: '1.5px solid var(--brand-gold)',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 14px rgba(245, 180, 0, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Package size={14} color="var(--brand-gold)" />
                <span>{approvedOrders.length} B2B Orders Approved</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tab Pills Row */}
        <div style={{
          display: 'flex',
          gap: '6px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { id: 'pos_billing', label: 'Fast Sales POS', icon: ShoppingCart },
            { id: 'stock_check', label: 'Live Stock Check', icon: Warehouse },
            { id: 'sales_history', label: `Invoice Records (${invoices.length})`, icon: FileText },
            { id: 'shift_summary', label: 'Shift Summary', icon: TrendingUp }
          ].map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSwitch(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid var(--brand-cyan)' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(0, 200, 245, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 0 12px rgba(0, 200, 245, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <tab.icon size={15} color={isActive ? 'var(--brand-cyan)' : 'var(--text-muted)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FAST SALES POS BILLING (High-Performance Ergonomic Workstation) */}
      {/* ========================================================================= */}
      {currentTab === 'pos_billing' && (
        <div style={{ width: '100%' }}>
          <style>{`
            .pos-split-grid {
              display: grid;
              grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
              gap: 22px;
              align-items: start;
            }
            .pos-sticky-panel {
              position: sticky;
              top: 16px;
            }
            .pos-product-card {
              transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .pos-product-card:hover:not(:disabled) {
              transform: translateY(-2px);
              border-color: var(--brand-cyan) !important;
              box-shadow: 0 8px 20px rgba(0, 200, 245, 0.22);
            }
            .pos-payment-chip {
              transition: all 0.15s ease;
            }
            .pos-payment-chip:hover {
              border-color: var(--brand-cyan) !important;
            }
            @media (max-width: 1040px) {
              .pos-split-grid {
                grid-template-columns: 1fr;
                gap: 16px;
              }
              .pos-sticky-panel {
                position: static !important;
                top: auto !important;
              }
            }
          `}</style>

          <form onSubmit={handleGenerateInvoice} className="pos-split-grid">
            {/* LEFT COLUMN: Customer Details & Product Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Card 1: Customer Information & Payment */}
              <div 
                className="ub-card" 
                style={{ 
                  padding: 'clamp(16px, 2.5vw, 24px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  background: 'linear-gradient(135deg, rgba(14, 29, 62, 0.8) 0%, rgba(9, 20, 44, 0.95) 100%)',
                  border: '1px solid rgba(0, 200, 245, 0.2)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        Customer & Fleet Information
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Terminal Station: <strong style={{ color: 'var(--brand-cyan)' }}>{locations.find(l => l.id === selectedLocation)?.name || assignedDepotName || 'Depot'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active B2B Distributor Order Banner */}
                {selectedDistributorOrder && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(6, 182, 212, 0.12)',
                    border: '1.5px solid #06B6D4',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Authorized B2B Distributor Dispatch Mode
                      </div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {selectedDistributorOrder.orderNumber}: {selectedDistributorOrder.distributorCompany}
                      </strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Contact: {selectedDistributorOrder.distributorName} ({selectedDistributorOrder.distributorPhone}) • Avail Credit: <strong style={{ color: 'var(--brand-blue)' }}>₹{(selectedDistributorOrder.availableCredit ?? 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                    <Button size="xs" variant="secondary" onClick={handleClearDistributorOrder}>
                      Cancel B2B Mode
                    </Button>
                  </div>
                )}

                {/* Customer Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
                  <Input
                    label="Customer / Fleet Name *"
                    placeholder="e.g. Maharathi Express Cargo"
                    value={customerName}
                    onChange={handleNameChange}
                    onBlur={() => setFieldErrors(prev => ({ ...prev, customerName: validateCustomerName(customerName) }))}
                    error={fieldErrors.customerName}
                    required
                    style={{ marginBottom: 0 }}
                  />
                  <Input
                    label="Customer Mobile (SMS Receipt) *"
                    placeholder="e.g. 9437099881 or +91 9437099881"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    onBlur={() => setFieldErrors(prev => ({ ...prev, customerPhone: validateCustomerPhone(customerPhone) }))}
                    error={fieldErrors.customerPhone}
                    maxLength={15}
                    required
                    style={{ marginBottom: 0 }}
                  />
                </div>

                {/* Vehicle No & Mode of Payment */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <Input
                      label="Vehicle / Fleet Reg. No"
                      placeholder="e.g. OD-05-AX-4892 (or leave blank)"
                      value={vehicleNo}
                      onChange={handleVehicleChange}
                      onBlur={() => setFieldErrors(prev => ({ ...prev, vehicleNo: validateVehicleNo(vehicleNo) }))}
                      error={fieldErrors.vehicleNo}
                      maxLength={20}
                      style={{ marginBottom: 0 }}
                    />
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                        Mode of Payment
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                        {[
                          { value: 'UPI', label: 'UPI / QR', icon: Sparkles },
                          { value: 'Cash', label: 'Direct Cash', icon: DollarSign },
                          { value: 'Bank Transfer', label: 'Bank Transfer', icon: Warehouse },
                          { value: 'Credit', label: 'Revolving Credit', icon: CreditCard }
                        ].map(m => {
                          const isSel = paymentMethod === m.value;
                          return (
                            <button
                              key={m.value}
                              type="button"
                              className="pos-payment-chip"
                              onClick={() => {
                                setPaymentMethod(m.value);
                                if (m.value === 'Credit') {
                                  setB2bPaymentMode('FULL_CREDIT');
                                } else {
                                  setB2bPaymentMode('FULL_PAID');
                                }
                                setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                                setPosError('');
                              }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: isSel ? '1.5px solid var(--brand-cyan)' : '1px solid var(--border-medium)',
                                backgroundColor: isSel ? 'rgba(0, 200, 245, 0.15)' : 'var(--bg-surface)',
                                color: isSel ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                                fontWeight: isSel ? 800 : 500,
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: isSel ? '0 0 10px rgba(0, 200, 245, 0.2)' : 'none'
                              }}
                            >
                              <m.icon size={13} color={isSel ? 'var(--brand-cyan)' : 'var(--text-muted)'} />
                              <span>{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credit Settlement Options - Shown only when Mode of Payment is Credit */}
                {paymentMethod === 'Credit' && (
                  <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Credit Settlement Options
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '8px', marginBottom: b2bPaymentMode === 'PART_CREDIT' ? '10px' : 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setB2bPaymentMode('FULL_CREDIT');
                          setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                          setPosError('');
                        }}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: b2bPaymentMode === 'FULL_CREDIT' ? '2px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                          backgroundColor: b2bPaymentMode === 'FULL_CREDIT' ? 'rgba(0, 143, 224, 0.12)' : 'var(--bg-surface)',
                          color: b2bPaymentMode === 'FULL_CREDIT' ? 'var(--text-link)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        100% Revolving Credit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setB2bPaymentMode('PART_CREDIT');
                          setPosError('');
                        }}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: b2bPaymentMode === 'PART_CREDIT' ? '2px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                          backgroundColor: b2bPaymentMode === 'PART_CREDIT' ? 'rgba(0, 143, 224, 0.12)' : 'var(--bg-surface)',
                          color: b2bPaymentMode === 'PART_CREDIT' ? 'var(--text-link)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        Split Part Payment
                      </button>
                    </div>

                    {b2bPaymentMode === 'PART_CREDIT' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-medium)', alignItems: 'flex-start' }}>
                        <Input
                          label="Upfront Paid (₹) *"
                          type="number"
                          min="1"
                          step="any"
                          placeholder="e.g. 15000"
                          value={partPaymentAmount}
                          onChange={e => setPartPaymentAmount(e.target.value)}
                          required
                          style={{ marginBottom: 0 }}
                        />
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                            Upfront Mode *
                          </label>
                          <Select
                            value={partPaymentMethod}
                            onChange={e => {
                              setPartPaymentMethod(e.target.value);
                              setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                            }}
                            options={[
                              { label: 'UPI / QR', value: 'UPI' },
                              { label: 'Bank Transfer', value: 'Bank Transfer' },
                              { label: 'Direct Cash', value: 'Cash' }
                            ]}
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            Remaining on Credit
                          </span>
                          <strong style={{ fontSize: '14px', color: '#EF4444', display: 'block', paddingTop: '6px' }}>
                            ₹ {Math.max(0, grandTotal - (parseFloat(partPaymentAmount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic UTR / Payment Ref Input for Digital / Bank Payments */}
                {((paymentMethod !== 'Cash' && paymentMethod !== 'Credit') || (paymentMethod === 'Credit' && b2bPaymentMode === 'PART_CREDIT' && partPaymentMethod !== 'Cash')) && (
                  <div>
                    <Input
                      label={
                        paymentMethod === 'Credit'
                          ? (partPaymentMethod.includes('UPI') ? 'Upfront UPI UTR / Transaction Ref No *' : 'Upfront Bank UTR / IMPS Reference No *')
                          : (paymentMethod.includes('UPI') ? 'UPI UTR / Transaction Ref No *' : 'Bank UTR / IMPS Reference No *')
                      }
                      placeholder={
                        (paymentMethod === 'Credit' ? partPaymentMethod : paymentMethod).includes('UPI')
                          ? 'e.g. 423456789012 (12-digit UPI UTR)'
                          : 'e.g. HDFCR5202609021234'
                      }
                      value={paymentRef}
                      onChange={(e) => {
                        setPaymentRef(e.target.value);
                        if (fieldErrors.paymentRef) {
                          setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                        }
                      }}
                      onBlur={() => {
                        const refMethod = paymentMethod === 'Credit' ? partPaymentMethod : paymentMethod;
                        setFieldErrors(prev => ({ ...prev, paymentRef: validatePaymentRef(refMethod, paymentRef) }));
                      }}
                      error={fieldErrors.paymentRef}
                      required
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                )}
              </div>

              {/* Card 2: Product Search & Quick Add Section */}
              <div
                className="ub-card"
                style={{
                  padding: 'clamp(16px, 2.5vw, 24px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  background: 'linear-gradient(135deg, rgba(14, 29, 62, 0.8) 0%, rgba(9, 20, 44, 0.95) 100%)',
                  border: '1px solid rgba(0, 200, 245, 0.2)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        Product Entry & Quick Add
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Live inventory reflects {locations.find(l => l.id === selectedLocation)?.name || 'Depot'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Search Bar with Autocomplete Dropdown */}
                <div style={{ position: 'relative' }}>
                  <Input
                    placeholder="Search product by name, SKU, or pack size (e.g. Smart Bucket, 5L, 210L Barrel)..."
                    value={billingProductSearch}
                    onChange={(e) => setBillingProductSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const firstInStock = matchingBillingVariants.find(v => v.availableStock > 0);
                        if (firstInStock) {
                          handleAddToCart(firstInStock.product, firstInStock.pack);
                          setBillingProductSearch('');
                        } else if (matchingBillingVariants.length > 0) {
                          toast.error(`"${matchingBillingVariants[0].name}" is currently OUT OF STOCK.`);
                          setPosError(`"${matchingBillingVariants[0].name}" is currently OUT OF STOCK.`);
                        }
                      } else if (e.key === 'Escape') {
                        setBillingProductSearch('');
                      }
                    }}
                    icon={Search}
                    style={{ marginBottom: 0 }}
                  />
                  {billingProductSearch && (
                    <button
                      type="button"
                      onClick={() => setBillingProductSearch('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}

                  {/* Autocomplete Dropdown */}
                  {billingProductSearch.trim() && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 60,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1.5px solid var(--brand-blue)',
                      borderRadius: '8px',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45), 0 0 14px rgba(0, 200, 245, 0.15)',
                      marginTop: '4px',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}>
                      {matchingBillingVariants.length === 0 ? (
                        <div style={{ padding: '14px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          No products found matching "<strong>{billingProductSearch}</strong>"
                        </div>
                      ) : (
                        matchingBillingVariants.map((item, idx) => {
                          const isOutOfStock = item.availableStock <= 0;
                          return (
                            <div
                              key={item.sku || idx}
                              onClick={() => {
                                if (!isOutOfStock) {
                                  handleAddToCart(item.product, item.pack);
                                  setBillingProductSearch('');
                                } else {
                                  toast.error(`"${item.name}" is OUT OF STOCK at this location.`);
                                  setPosError(`"${item.name}" is OUT OF STOCK at this location.`);
                                }
                              }}
                              style={{
                                padding: '10px 14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid var(--border-light)',
                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isOutOfStock) e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isOutOfStock) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                                  {item.name}
                                </strong>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {item.category} • SKU: {item.sku}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <strong style={{ fontSize: '14px', color: 'var(--brand-blue)', display: 'block' }}>
                                  ₹ {item.mrp?.toLocaleString('en-IN')}
                                </strong>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: isOutOfStock ? '#EF4444' : '#10B981' }}>
                                  {isOutOfStock ? '0 in stock' : `${item.availableStock} in stock`}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Popular Packaging Variants Grid (Tap to Add) */}
                {quickAddVariants.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={13} color="var(--brand-cyan)" />
                        <span>Quick 1-Tap Catalog Packs:</span>
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Tap any pack to add
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
                      gap: '8px'
                    }}>
                      {quickAddVariants.map(v => {
                        const isOutOfStock = v.availableStock <= 0;
                        const isLow = v.availableStock > 0 && v.availableStock <= 15;
                        return (
                          <button
                            key={v.sku}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(v.product, v.pack)}
                            className="pos-product-card"
                            style={{
                              padding: '10px 12px',
                              backgroundColor: isOutOfStock ? 'rgba(14, 29, 62, 0.4)' : 'rgba(14, 29, 62, 0.85)',
                              border: isOutOfStock
                                ? '1px dashed var(--border-medium)'
                                : isLow
                                ? '1.5px solid var(--status-warning)'
                                : '1.5px solid rgba(0, 200, 245, 0.25)',
                              borderRadius: '8px',
                              textAlign: 'left',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '6px',
                              opacity: isOutOfStock ? 0.6 : 1
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                              <strong style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {v.productName}
                              </strong>
                              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', flexShrink: 0 }}>
                                {v.size}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <strong style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                                ₹ {v.mrp?.toLocaleString('en-IN')}
                              </strong>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.15)' : isLow ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: isOutOfStock ? '#EF4444' : isLow ? '#F59E0B' : '#10B981',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isOutOfStock ? '#EF4444' : isLow ? '#F59E0B' : '#10B981' }} />
                                {isOutOfStock ? '0 stock' : `${v.availableStock}`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Live Tax Invoice Draft Slip (Sticky on Desktop) */}
            <div
              className="ub-card pos-sticky-panel"
              style={{
                padding: 'clamp(16px, 2.5vw, 24px)',
                background: 'linear-gradient(145deg, rgba(14, 29, 62, 0.92) 0%, rgba(7, 16, 36, 0.98) 100%)',
                border: '1.5px solid rgba(0, 200, 245, 0.3)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Slip Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(0, 200, 245, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(0, 200, 245, 0.12)', color: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      Live Invoice Draft
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} • {cartItems.reduce((acc, i) => acc + (parseInt(i.qty, 10) || 0), 0)} units total
                    </span>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Clear invoice cart"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Cart Items Container */}
              {cartItems.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', borderRadius: '10px', border: '1.5px dashed rgba(0, 200, 245, 0.2)', backgroundColor: 'rgba(14, 29, 62, 0.4)' }}>
                  <ShoppingCart size={36} color="var(--brand-cyan)" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Invoice Cart is Empty
                  </strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    Search products or tap quick-add packs on the left to start billing.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                  {cartItems.map((item, index) => (
                    <div
                      key={item.sku || index}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(14, 29, 62, 0.7)',
                        border: '1px solid rgba(0, 200, 245, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 600 }}>
                          ₹ {item.unitPrice} each • {item.gstRate || 18}% GST
                        </span>
                      </div>

                      {/* Stepper */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
                        <button
                          type="button"
                          onClick={() => handleDecrementQty(index)}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            backgroundColor: 'var(--bg-surface-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.qty}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            handleUpdateQtyRaw(index, val === '' ? '' : parseInt(val, 10));
                          }}
                          onBlur={() => {
                            if (!item.qty || parseInt(item.qty, 10) < 1) handleUpdateQtyRaw(index, 1);
                          }}
                          style={{
                            width: '36px',
                            height: '28px',
                            textAlign: 'center',
                            border: 'none',
                            borderLeft: '1px solid var(--border-light)',
                            borderRight: '1px solid var(--border-light)',
                            fontWeight: 800,
                            fontSize: '13px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrementQty(index)}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            backgroundColor: 'var(--bg-surface-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Item Total */}
                      <strong style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--brand-cyan)', minWidth: '65px', textAlign: 'right' }}>
                        ₹ {(item.unitPrice * (parseInt(item.qty, 10) || 0)).toLocaleString('en-IN')}
                      </strong>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Counter Discounts & Coupons */}
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(14, 29, 62, 0.65)',
                borderRadius: '8px',
                border: '1px solid rgba(0, 200, 245, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={13} color="var(--brand-cyan)" />
                    <strong style={{ fontSize: '12px', color: '#FFFFFF' }}>
                      Counter Discount & Coupon
                    </strong>
                  </div>
                  {discountType !== 'none' && (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--status-danger)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>

                {/* Discount Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px', backgroundColor: 'var(--bg-surface)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'percent', label: 'Percent %' },
                    { id: 'amount', label: 'Fixed ₹' },
                    { id: 'coupon', label: 'Coupon' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setDiscountType(mode.id);
                        if (mode.id === 'none') {
                          setDiscountValue('');
                          setAppliedCoupon(null);
                        }
                      }}
                      style={{
                        padding: '5px 2px',
                        fontSize: '10.5px',
                        fontWeight: discountType === mode.id ? 800 : 500,
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: discountType === mode.id ? 'var(--brand-blue)' : 'transparent',
                        color: discountType === mode.id ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'center'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Percent Mode */}
                {discountType === 'percent' && (
                  <div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Discount % (e.g. 10)"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-medium)',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-cyan)' }}>% OFF</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[5, 10, 15, 20].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountValue(pct)}
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: Number(discountValue) === pct ? '1.5px solid var(--brand-cyan)' : '1px solid var(--border-light)',
                            backgroundColor: Number(discountValue) === pct ? 'rgba(0, 200, 245, 0.2)' : 'var(--bg-surface)',
                            color: Number(discountValue) === pct ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amount Mode */}
                {discountType === 'amount' && (
                  <div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        placeholder="Discount in ₹ (e.g. 100)"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-cyan)' }}>₹ OFF</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[50, 100, 200, 500].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDiscountValue(amt)}
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: Number(discountValue) === amt ? '1.5px solid var(--brand-cyan)' : '1px solid var(--border-light)',
                            backgroundColor: Number(discountValue) === amt ? 'rgba(0, 200, 245, 0.2)' : 'var(--bg-surface)',
                            color: Number(discountValue) === amt ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coupon Mode */}
                {discountType === 'coupon' && (
                  <div>
                    {appliedCoupon ? (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid #10B981',
                        padding: '8px 10px',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <strong style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={13} /> {appliedCoupon.promo_code}
                          </strong>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                            {appliedCoupon.title}
                          </span>
                        </div>
                        <button type="button" onClick={handleRemoveDiscount} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                          <input
                            type="text"
                            placeholder="PROMO CODE (e.g. FESTIVE10)"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-medium)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCouponByCode()}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--brand-blue)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && (
                          <span style={{ fontSize: '10.5px', color: 'var(--status-danger)', display: 'block', marginBottom: '4px' }}>
                            {couponError}
                          </span>
                        )}
                        {availableCoupons.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {availableCoupons.map(promo => (
                              <button
                                key={promo.id}
                                type="button"
                                onClick={() => handleApplyCouponByCode(promo.promo_code)}
                                style={{
                                  padding: '3px 6px',
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px dashed var(--brand-blue)',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  color: 'var(--brand-cyan)',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                {promo.promo_code}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live Calculations Breakdown */}
              <div style={{ backgroundColor: 'rgba(14, 29, 62, 0.65)', padding: '12px 14px', borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(0, 200, 245, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span>Gross Subtotal:</span>
                  <strong style={{ color: '#FFFFFF' }}>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                {calculatedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#10B981', fontWeight: 700 }}>
                    <span>Discount ({discountLabel}):</span>
                    <span>- ₹ {calculatedDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span>Taxable Base Value:</span>
                  <strong style={{ color: '#FFFFFF' }}>₹ {taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <span>Central GST (CGST):</span>
                  <span style={{ color: 'var(--text-secondary)' }}>₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <span>State GST (SGST):</span>
                  <span style={{ color: 'var(--text-secondary)' }}>₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Total Payable Box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 143, 224, 0.15) 0%, rgba(0, 200, 245, 0.25) 100%)',
                border: '1.5px solid var(--brand-cyan)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0, 200, 245, 0.2)'
              }}>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--brand-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    Grand Total Payable
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    All Taxes Included
                  </span>
                </div>
                <strong style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-family-heading)' }}>
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={cartItems.length === 0}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '8px',
                  border: 'none',
                  background: cartItems.length === 0 ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, #008FE0 0%, #00C8F5 100%)',
                  color: cartItems.length === 0 ? 'var(--text-muted)' : '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: cartItems.length === 0 ? 'none' : '0 4px 20px rgba(0, 200, 245, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Generate Tax Invoice & Send SMS</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE STOCK CHECK */}
      {/* ========================================================================= */}
      {currentTab === 'stock_check' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '320px' }}>
              <Input
                placeholder="Search SKU or fluid variant..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={loadData}>
              Refresh Stock
            </Button>
          </div>

          <DataTable
            title={`Live Inventory Overview (${locations.find(l => l.id === selectedLocation)?.name || 'All Depots'})`}
            data={filteredStock}
            columns={[
              {
                header: 'Product & SKU', accessor: 'productName', render: (val, row) => (
                  <div>
                    <strong>{val}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.sku} • {row.packSize}</div>
                  </div>
                )
              },
              { header: 'Depot Location', accessor: 'locationName' },
              {
                header: 'Available Stock', accessor: 'availableStock', render: (val) => (
                  <strong style={{ fontSize: '14px', color: val > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                    {val} units
                  </strong>
                )
              },
              { header: 'Batch No', accessor: 'batchNo' },
              { header: 'Expiry Date', accessor: 'expDate' },
              { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICE RECORDS */}
      {/* ========================================================================= */}
      {currentTab === 'sales_history' && (
        <DataTable
          title={isOperator ? `Recent Counter Invoices (${locations.find(l => l.id === selectedLocation)?.name || assignedDepotName || 'Assigned Depot'})` : "Recent Counter Invoices from Laravel PostgreSQL DB"}
          data={operatorInvoices}
          columns={[
            { header: 'Invoice No', accessor: 'id', render: (val) => <strong>{val}</strong> },
            {
              header: 'Customer & Vehicle', accessor: 'customerName', render: (val, row) => (
                <div>
                  <strong>{val}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.vehicleNo} • {row.customerPhone}</div>
                </div>
              )
            },
            { header: 'Depot Location', accessor: 'location' },
            { header: 'Date & Time', accessor: 'date' },
            { header: 'Grand Total', accessor: 'grandTotal', render: (val) => <strong style={{ color: 'var(--brand-navy-primary)' }}>₹ {val?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> },
            {
              header: 'SMS Status', accessor: 'smsSent', render: () => (
                <span style={{ color: 'var(--status-success-text)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> SMS Sent
                </span>
              )
            },
            {
              header: 'Actions', accessor: 'id', render: (_, row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={WhatsAppIcon}
                    onClick={() => setActiveInvoiceForModal(row)}
                    style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#FFFFFF' }}
                    title="View & Share via WhatsApp"
                  >
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="secondary" icon={Printer} onClick={() => setActiveInvoiceForModal(row)}>
                    Print
                  </Button>
                  <Button size="sm" variant="primary" icon={FileText} onClick={() => setActiveInvoiceForModal(row)}>
                    View Tax Bill
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHIFT SUMMARY */}
      {/* ========================================================================= */}
      {currentTab === 'shift_summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <KPICard
              title="Shift Total Invoices"
              value={`${shiftInvoicesCount} Bills`}
              icon={ShoppingCart}
              color="blue"
              change="+ Live DB"
              changeType="positive"
            />
            <KPICard
              title="Shift Total Revenue"
              value={`₹ ${shiftRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              color="gold"
              change="Verified Sales"
              changeType="positive"
            />
            <KPICard
              title="GST Tax Collected"
              value={`₹ ${shiftTaxCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon={FileText}
              color="cyan"
              change="CGST + SGST"
              changeType="neutral"
            />
            <KPICard
              title="Digital UPI Collection"
              value={`₹ ${upiTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon={CreditCard}
              color="blue"
              change="QR Direct"
              changeType="positive"
            />
          </div>

          <div className="ub-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: '12px' }}>
              Shift Details & Operator Ledger
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Active Operator</span>
                <strong>{currentOperatorName}</strong>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Current Depot</span>
                <strong>{locations.find(l => l.id === selectedLocation)?.name || 'Central Plant Depot'}</strong>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Cash Collections</span>
                <strong>₹ {cashTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>UPI QR Collections</span>
                <strong>₹ {upiTotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approved B2B Distributor Orders Modal */}
      <Modal
        isOpen={isB2BModalOpen}
        onClose={() => setIsB2BModalOpen(false)}
        title="Approved Distributor Requisitions (Ready for Billing)"
        subtitle="Select an admin-approved B2B order to load items and generate an official GST Tax Invoice."
        maxWidth="840px"
        icon={Package}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {approvedOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <Package size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: '6px' }}>
                No Approved Orders Awaiting Billing
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
                When distributors place purchase orders from their portal and Admin approves them, they will appear here ready to convert to an invoice and deduct depot stock.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {approvedOrders.map((order) => {
                const totalAmt = parseFloat(order.totalAmount || 0);
                const availCredit = parseFloat(order.availableCredit || 0);
                const hasSufficientCredit = availCredit >= totalAmt;

                return (
                  <div
                    key={order.id}
                    style={{
                      border: '1.5px solid var(--border-medium)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '15px', color: 'var(--brand-navy-primary)' }}>
                            {order.orderNumber}
                          </strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669'
                          }}>
                            {order.status || 'APPROVED'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {order.distributorCompany}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Contact: {order.distributorName} ({order.distributorPhone}) • Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : 'Recent'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Order Total
                        </div>
                        <strong style={{ fontSize: '18px', color: 'var(--brand-blue)' }}>
                          ₹ {totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                        <div style={{ fontSize: '11px', color: hasSufficientCredit ? '#059669' : '#EF4444', fontWeight: 600, marginTop: '2px' }}>
                          Credit Avail: ₹ {availCredit.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Items table preview */}
                    <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '6px', padding: '8px 12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Requested Requisition Items ({(order.items || []).length}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-medium)', paddingBottom: '4px' }}>
                            <span style={{ color: 'var(--text-primary)' }}>
                              <strong>{it.quantity}x</strong> {it.productName} ({it.packSize})
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                              @ ₹{parseFloat(it.unitPrice || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.deliveryAddress && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong>Dispatch Address:</strong> {order.deliveryAddress}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={ShoppingCart}
                        onClick={() => handleLoadDistributorOrder(order)}
                      >
                        Convert to Bill & Dispense
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(activeInvoiceForModal)}
        onClose={() => setActiveInvoiceForModal(null)}
        invoice={activeInvoiceForModal}
      />
    </div>
  );
};
