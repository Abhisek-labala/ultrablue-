import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { OperatorAPI, ProductAPI, Product } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  printOrShareReceipt,
  shareViaWhatsAppDirect,
  InvoiceReceiptData,
} from '../../utils/receiptGenerator';

interface CartItem {
  product: Product;
  sku: string;
  name: string;
  packSize: string;
  qty: number;
  unitPrice: number;
  availableStock: number;
}

export const PosBillingScreen = () => {
  const { user } = useAuth();

  // Data states
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields (identical to web)
  const [customerName, setCustomerName] = useState('Counter Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Credit'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [cashTendered, setCashTendered] = useState('');

  // Cart & Discount
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState('');

  // Invoice Success Modal
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceReceiptData | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locs, prods, inv] = await Promise.all([
        OperatorAPI.getLocations().catch(() => []),
        ProductAPI.getAll().catch(() => []),
        OperatorAPI.getInventory().catch(() => []),
      ]);

      setLocations(locs);
      setProducts(prods);
      setInventory(inv);

      if (locs.length > 0) {
        const assignedName = user?.organization || '';
        const matchingLoc = locs.find(
          (l: any) =>
            l.name?.toLowerCase().includes(assignedName.toLowerCase()) ||
            assignedName.toLowerCase().includes(l.name?.toLowerCase() || '')
        );
        setSelectedLocationId(matchingLoc ? matchingLoc.id : locs[0].id);
      }
    } catch (err) {
      console.warn('POS load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to fetch live available stock for SKU at selected depot
  const getStockForSku = (sku: string): number => {
    const locItem = inventory.find(
      (i: any) =>
        (i.location_id === selectedLocationId || i.locationId === selectedLocationId) &&
        i.sku === sku
    );
    if (locItem) {
      return parseFloat(String(locItem.stock_litres || locItem.stock_units || locItem.availableStock || 0));
    }
    const fallback = inventory.find((i: any) => i.sku === sku);
    return fallback ? parseFloat(String(fallback.stock_litres || fallback.stock_units || 999)) : 999;
  };

  // Add Item to Cart (matching web behavior & anti-overbill)
  const handleAddToCart = (product: Product, sku: string, size: string, price: number) => {
    Haptics.selectionAsync();
    const stock = getStockForSku(sku);

    if (stock <= 0) {
      Alert.alert('Out of Stock', `${product.name} (${size}) is currently out of stock at this location.`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.sku === sku);
      if (existing) {
        if (existing.qty + 1 > stock) {
          Alert.alert('Stock Limit Reached', `Only ${stock} units available physically in stock.`);
          return prev;
        }
        return prev.map((i) => (i.sku === sku ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          product,
          sku,
          name: `${product.name} (${size})`,
          packSize: size,
          qty: 1,
          unitPrice: price,
          availableStock: stock,
        },
      ];
    });
  };

  const handleUpdateQty = (sku: string, delta: number) => {
    Haptics.selectionAsync();
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const next = item.qty + delta;
            if (next > item.availableStock) {
              Alert.alert('Anti-Overbill Protection', `Cannot bill more than physical depot stock (${item.availableStock}).`);
              return item;
            }
            return { ...item, qty: next };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveItem = (sku: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCartItems((prev) => prev.filter((i) => i.sku !== sku));
  };

  // Dynamic Product-Wise Billing Totals with Discount Support (exact web math)
  const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);

  let calculatedDiscount = 0;
  if (discountType === 'percent') {
    const pct = Math.max(0, Math.min(100, parseFloat(discountValue) || 0));
    calculatedDiscount = (subtotal * pct) / 100;
  } else if (discountType === 'amount') {
    const amt = Math.max(0, parseFloat(discountValue) || 0);
    calculatedDiscount = Math.min(subtotal, amt);
  }
  calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

  const netPayable = Math.max(0, subtotal - calculatedDiscount);
  const taxable = Math.round((netPayable / 1.18) * 100) / 100; // 18% inclusive
  const cgst = Math.round(((netPayable - taxable) / 2) * 100) / 100;
  const sgst = Math.round(((netPayable - taxable) / 2) * 100) / 100;
  const grandTotal = netPayable;

  const changeReturn = paymentMethod === 'Cash' && parseFloat(cashTendered) > grandTotal
    ? parseFloat(cashTendered) - grandTotal
    : 0;

  // Real Laravel Invoice Submission (Exact fields as web)
  const handleGenerateInvoice = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one product or pack to bill.');
      return;
    }

    const cleanPhone = customerPhone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit customer mobile number starting with 6-9.');
      return;
    }

    if (!selectedLocationId) {
      Alert.alert('Station Missing', 'Please select a dispensing depot.');
      return;
    }

    setSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const payload = {
        customer_name: customerName.trim() || 'Counter Customer',
        customer_phone: cleanPhone,
        vehicle_number: vehicleNo.trim() ? vehicleNo.trim().toUpperCase() : 'Direct Counter Sale',
        location_id: selectedLocationId,
        operator_name: user?.name || 'Sales Operator',
        payment_method: paymentMethod.toUpperCase(),
        payment_ref: paymentRef.trim() || undefined,
        discount_amount: calculatedDiscount,
        items: cartItems.map((item) => ({
          sku: item.sku,
          product_name: item.name,
          qty: item.qty,
          unit_price: item.unitPrice,
        })),
      };

      const result = await OperatorAPI.createInvoice(payload as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const invNo = result.invoice_number || result.data?.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
      const depotName = locations.find((l) => l.id === selectedLocationId)?.name || 'Central Plant Depot';

      const receiptData: InvoiceReceiptData = {
        invoiceNumber: invNo,
        date: new Date().toLocaleString('en-IN'),
        customerName: payload.customer_name,
        customerPhone: payload.customer_phone,
        vehicleNumber: payload.vehicle_number,
        operatorName: user?.name || 'Duty Operator',
        depotLocation: depotName,
        paymentMethod: paymentMethod,
        paymentStatus: 'PAID (100% SETTLED)',
        discount: calculatedDiscount,
        items: cartItems.map((i) => ({
          name: i.name,
          sku: i.sku,
          hsn: '31021000',
          qty: i.qty,
          unitPrice: i.unitPrice,
          total: i.qty * i.unitPrice,
        })),
        subtotal,
        taxable,
        cgst,
        sgst,
        grandTotal,
      };

      setGeneratedInvoice(receiptData);
      setIsSuccessModalOpen(true);

      // Reset Billing Form for next customer
      setCustomerPhone('');
      setVehicleNo('');
      setCustomerName('Counter Customer');
      setCartItems([]);
      setCashTendered('');
      setPaymentRef('');
      setDiscountType('none');
      setDiscountValue('');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.response?.data?.message || err.message || 'Invoice billing failed.';
      Alert.alert('Billing Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading Terminal Dispenser & Inventory...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* 1. Header & Dispensing Station Selector (Matching Web) */}
      <View style={styles.stationCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stationLabel}>DISPENSING STATION / DEPOT</Text>
          <Text style={styles.stationName}>
            {locations.find((l) => l.id === selectedLocationId)?.name || 'Central Plant Depot'}
          </Text>
          <Text style={styles.operatorText}>Operator: {user?.name} (Shift Active)</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>READY</Text>
        </View>
      </View>

      {/* 2. Customer & Vehicle Details (Exact fields as Web) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer & Vehicle Details</Text>

        <Text style={styles.label}>Customer Mobile *</Text>
        <View style={styles.phoneInputRow}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="98765 43210"
            placeholderTextColor={Colors.textMuted}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Vehicle Number (Plate)</Text>
            <TextInput
              style={[styles.input, { textTransform: 'uppercase' }]}
              placeholder="e.g. OD-02-AB-1234"
              placeholderTextColor={Colors.textMuted}
              value={vehicleNo}
              onChangeText={(t) => setVehicleNo(t.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Counter Customer"
              placeholderTextColor={Colors.textMuted}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>
        </View>
      </View>

      {/* 3. Products & Stock Selector (Simple, Fast Counter UI) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Products & Packaging</Text>

        {products.map((p) => {
          const variants = p.packVariants && p.packVariants.length > 0
            ? p.packVariants
            : [
                {
                  sku: `SKU-${p.id}`,
                  size: p.capacity || 'Standard',
                  mrp: p.mrp || 65,
                },
              ];

          return (
            <View key={p.id} style={styles.productBlock}>
              <Text style={styles.productTitle}>{p.name}</Text>
              <View style={styles.variantGrid}>
                {variants.map((v) => {
                  const stock = getStockForSku(v.sku);
                  const isOutOfStock = stock <= 0;
                  const price = v.mrp || p.mrp || 65;

                  return (
                    <TouchableOpacity
                      key={v.sku}
                      style={[styles.variantBtn, isOutOfStock && styles.variantBtnDisabled]}
                      onPress={() => handleAddToCart(p, v.sku, v.size, price)}
                      disabled={isOutOfStock}
                    >
                      <Text style={[styles.variantSize, isOutOfStock && { color: Colors.textMuted }]}>
                        {v.size}
                      </Text>
                      <Text style={styles.variantPrice}>₹{price.toFixed(0)}</Text>
                      <Text style={[styles.variantStock, isOutOfStock ? { color: '#EF4444' } : { color: '#10B981' }]}>
                        {isOutOfStock ? 'Out of stock' : `${stock} left`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* 4. Cart / Current Ticket Items */}
      {cartItems.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cart / Dispensing Items ({cartItems.length})</Text>
          {cartItems.map((item) => (
            <View key={item.sku} style={styles.cartRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartName}>{item.name}</Text>
                <Text style={styles.cartSku}>Rate: ₹{item.unitPrice.toFixed(2)} | SKU: {item.sku}</Text>
              </View>

              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => handleUpdateQty(item.sku, -1)}>
                  <Ionicons name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperQty}>{item.qty}</Text>
                <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: Colors.primary }]} onPress={() => handleUpdateQty(item.sku, 1)}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.cartTotal}>₹{(item.qty * item.unitPrice).toFixed(2)}</Text>

              <TouchableOpacity onPress={() => handleRemoveItem(item.sku)} style={{ marginLeft: 8 }}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 5. Payment Tender & Counter Discount (Matching Web) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>
        <View style={styles.paymentTabs}>
          {(['UPI', 'Cash', 'Card', 'Credit'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.payTab, paymentMethod === method && styles.payTabActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setPaymentMethod(method);
              }}
            >
              <Text style={[styles.payTabText, paymentMethod === method && styles.payTabTextActive]}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentMethod === 'UPI' && (
          <View style={styles.paymentDetailBox}>
            <Text style={styles.label}>UPI Reference / UTR Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 425102984124"
              placeholderTextColor={Colors.textMuted}
              value={paymentRef}
              onChangeText={setPaymentRef}
            />
          </View>
        )}

        {paymentMethod === 'Cash' && (
          <View style={styles.paymentDetailBox}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cash Received (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`₹${Math.ceil(grandTotal)}`}
                  placeholderTextColor={Colors.textMuted}
                  value={cashTendered}
                  onChangeText={setCashTendered}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={styles.label}>Change to Return</Text>
                <Text style={styles.changeVal}>₹{changeReturn.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 6. Tax Breakdown & Billing Button (Matching Web) */}
      <View style={styles.summaryBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summarySub}>
            Taxable: ₹{taxable.toFixed(2)} • CGST: ₹{cgst.toFixed(2)} • SGST: ₹{sgst.toFixed(2)}
          </Text>
          <Text style={styles.grandTotalText}>₹{grandTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, submitting && { opacity: 0.7 }]}
          onPress={handleGenerateInvoice}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.generateBtnText}>Generate Invoice</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* 7. Web-Identical Invoice & PDF Modal */}
      <Modal visible={isSuccessModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View>
                  <Text style={styles.sheetTitle}>Tax Invoice #{generatedInvoice?.invoiceNumber}</Text>
                  <Text style={styles.sheetSub}>GST Tax Invoice & ISO 22241 Verification Slip</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsSuccessModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Bill Details Preview */}
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Customer:</Text>
                <Text style={styles.previewVal}>{generatedInvoice?.customerName} ({generatedInvoice?.customerPhone})</Text>
              </View>
              {generatedInvoice?.vehicleNumber ? (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Vehicle Plate:</Text>
                  <Text style={styles.previewVal}>{generatedInvoice?.vehicleNumber}</Text>
                </View>
              ) : null}
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Paid:</Text>
                <Text style={[styles.previewVal, { color: '#0066FF', fontWeight: 'bold' }]}>
                  ₹{generatedInvoice?.grandTotal.toFixed(2)} ({generatedInvoice?.paymentMethod})
                </Text>
              </View>
            </View>

            {/* Action Buttons matching web InvoiceModal */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => {
                  if (generatedInvoice) shareViaWhatsAppDirect(generatedInvoice);
                }}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Share on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.printBtn}
                onPress={() => {
                  if (generatedInvoice) printOrShareReceipt(generatedInvoice);
                }}
              >
                <Ionicons name="download-outline" size={18} color="#0066FF" style={{ marginRight: 6 }} />
                <Text style={[styles.actionBtnText, { color: '#0066FF' }]}>Download / Print PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  stationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A2540',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  stationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  stationName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  operatorText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34D399',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  countryCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066FF',
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#0F172A',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
    marginBottom: 6,
  },
  productBlock: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  variantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: 90,
  },
  variantBtnDisabled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  variantSize: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  variantPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0066FF',
    marginTop: 2,
  },
  variantStock: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartSku: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQty: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cartTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 60,
    textAlign: 'right',
  },
  paymentTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  payTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  payTabActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  payTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  payTabTextActive: {
    color: '#FFFFFF',
  },
  paymentDetailBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  changeVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 4,
  },
  summaryBar: {
    backgroundColor: '#0A2540',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summarySub: {
    fontSize: 10.5,
    color: '#93C5FD',
  },
  grandTotalText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  generateBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
  },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 11,
    color: '#64748B',
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 14,
    gap: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  previewVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  sheetActions: {
    gap: 10,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
