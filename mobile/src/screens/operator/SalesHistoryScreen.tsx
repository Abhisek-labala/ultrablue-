import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { OperatorAPI, Invoice } from '../../api';
import { Ionicons } from '@expo/vector-icons';
import { printOrShareReceipt, shareViaWhatsAppDirect, InvoiceReceiptData } from '../../utils/receiptGenerator';
import * as Haptics from 'expo-haptics';

export const SalesHistoryScreen = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const data = await OperatorAPI.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.warn('Invoices fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const buildReceiptData = (inv: Invoice): InvoiceReceiptData => {
    const total = parseFloat(String(inv.total_amount || 0));
    const gst = (total * 18) / 118;
    const taxable = total - gst;

    return {
      invoiceNumber: inv.invoice_number,
      date: inv.created_at ? new Date(inv.created_at).toLocaleString('en-IN') : 'N/A',
      customerName: inv.customer_name,
      customerPhone: inv.customer_phone,
      vehicleNumber: inv.vehicle_number,
      paymentMethod: inv.payment_method || 'CASH',
      paymentStatus: 'PAID (100% SETTLED)',
      items: (inv.items || []).map((i) => ({
        name: i.product_name || i.sku,
        sku: i.sku,
        hsn: '31021000',
        qty: i.qty,
        unitPrice: parseFloat(String(i.unit_price || 0)),
        total: parseFloat(String(i.line_total || i.qty * (i.unit_price || 0))),
      })),
      subtotal: total,
      taxable,
      cgst: gst / 2,
      sgst: gst / 2,
      grandTotal: total,
    };
  };

  const handleReprint = async (inv: Invoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await printOrShareReceipt(buildReceiptData(inv));
  };

  const handleWhatsApp = async (inv: Invoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await shareViaWhatsAppDirect(buildReceiptData(inv));
  };

  const filtered = invoices.filter(
    (i) =>
      i.customer_phone?.includes(search) ||
      i.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
      i.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading Shift Invoices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by phone, vehicle plate, or invoice #"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item.invoice_number)}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySub}>Dispense your first fuel slip from the POS tab.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.invNumber}>{item.invoice_number}</Text>
                <Text style={styles.invDate}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                </Text>
              </View>
              <Text style={styles.invAmount}>
                ₹{parseFloat(String(item.total_amount || 0)).toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
              <View>
                <Text style={styles.custText}>
                  {item.customer_name} • {item.customer_phone}
                </Text>
                <Text style={styles.vehText}>
                  Plate: {item.vehicle_number || 'Direct Counter'} • {item.payment_method || 'CASH'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.reprintBtn, { backgroundColor: '#DCFCE7' }]}
                  onPress={() => handleWhatsApp(item)}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#15803D" />
                  <Text style={[styles.reprintText, { color: '#15803D' }]}>WA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reprintBtn}
                  onPress={() => handleReprint(item)}
                >
                  <Ionicons name="download-outline" size={15} color={Colors.accent} />
                  <Text style={styles.reprintText}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  invDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  invAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  custText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  vehText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reprintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  reprintText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
