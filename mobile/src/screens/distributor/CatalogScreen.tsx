import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { ProductAPI, DistributorAPI, Product } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CartItem {
  product: Product;
  sku: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
}

export const DistributorCatalogScreen = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [sku: string]: CartItem }>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await ProductAPI.getAll();
      setProducts(data);
    } catch (err: any) {
      Alert.alert('Error', 'Unable to fetch wholesale catalog');
    } finally {
      setLoading(false);
    }
  };

  const updateCartQty = (product: Product, sku: string, packSize: string, price: number, delta: number) => {
    Haptics.selectionAsync();
    setCart((prev) => {
      const existing = prev[sku];
      const newQty = (existing?.quantity || 0) + delta;

      if (newQty <= 0) {
        const next = { ...prev };
        delete next[sku];
        return next;
      }

      return {
        ...prev,
        [sku]: {
          product,
          sku,
          packSize,
          quantity: newQty,
          unitPrice: price,
        },
      };
    });
  };

  const cartList = Object.values(cart);
  const totalAmount = cartList.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalItemsCount = cartList.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceRequisition = async () => {
    if (cartList.length === 0) return;
    setSubmitting(true);
    try {
      await DistributorAPI.createOrder({
        distributor_id: user?.id,
        distributor_name: user?.name || 'Distributor',
        distributor_company: user?.organization || 'Partner Firm',
        distributor_phone: user?.phone || '9853675971',
        distributor_email: user?.email,
        order_notes: orderNotes,
        items: cartList.map((item) => ({
          product_id: item.product.id,
          sku: item.sku,
          product_name: item.product.name,
          pack_size: item.packSize,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Requisition Placed!',
        'Your B2B order has been submitted to the plant dispatch team for review and approval.',
        [{ text: 'OK', onPress: () => { setCart({}); setShowCheckout(false); setOrderNotes(''); } }]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Submission Failed', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Wholesale Catalog...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const variants = item.packVariants && item.packVariants.length > 0
            ? item.packVariants
            : [
                {
                  sku: `SKU-${item.id}`,
                  size: item.capacity || 'Standard',
                  distributorPrice: item.distributorPrice || item.mrp || 0,
                  mrp: item.mrp || 0,
                  gstRate: item.gstRate || 18,
                  isGstInclusive: item.isGstInclusive,
                },
              ];

          return (
            <View style={styles.productCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Pack Variants */}
              <View style={styles.variantsList}>
                {variants.map((v) => {
                  const qty = cart[v.sku]?.quantity || 0;
                  const price = v.distributorPrice > 0 ? v.distributorPrice : v.mrp;

                  return (
                    <View key={v.sku} style={styles.variantRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.variantSize}>{v.size}</Text>
                        <Text style={styles.variantSku}>SKU: {v.sku}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Text style={styles.wholesalePrice}>₹{price.toFixed(2)}</Text>
                          {v.mrp > price ? (
                            <Text style={styles.mrpText}>MRP: ₹{v.mrp.toFixed(2)}</Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Qty Selector */}
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateCartQty(item, v.sku, v.size, price, -1)}
                        >
                          <Ionicons name="remove" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.qtyBtn, styles.qtyBtnAdd]}
                          onPress={() => updateCartQty(item, v.sku, v.size, price, 1)}
                        >
                          <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        }}
      />

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.floatingCount}>
              {totalItemsCount} {totalItemsCount === 1 ? 'Pack' : 'Packs'} Selected
            </Text>
            <Text style={styles.floatingTotal}>₹{totalAmount.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCheckout(true);
            }}
          >
            <Text style={styles.checkoutText}>Review Requisition</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* Checkout Review Modal */}
      <Modal visible={showCheckout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Review Order Requisition</Text>
              <TouchableOpacity onPress={() => setShowCheckout(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
              {cartList.map((item) => (
                <View key={item.sku} style={styles.sheetItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetItemName}>{item.product.name}</Text>
                    <Text style={styles.sheetItemDetails}>
                      {item.packSize} • Qty: {item.quantity} × ₹{item.unitPrice}
                    </Text>
                  </View>
                  <Text style={styles.sheetItemTotal}>
                    ₹{(item.quantity * item.unitPrice).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.notesLabel}>Delivery & Plant Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Please dispatch via Cuttack Central Depot"
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
            />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Total Amount:</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitOrderBtn, submitting && { opacity: 0.7 }]}
              onPress={handlePlaceRequisition}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitOrderText}>Submit Requisition to Dispatch</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  variantsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 12,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 10,
  },
  variantSize: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  variantSku: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  wholesalePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accent,
    marginRight: 6,
  },
  mrpText: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  qtyBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingCount: {
    color: '#93C5FD',
    fontSize: 12,
  },
  floatingTotal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  checkoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sheetItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  sheetItemDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sheetItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    height: 60,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  submitOrderBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitOrderText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
