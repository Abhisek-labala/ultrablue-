import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { OperatorAPI, Invoice } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const ShiftSummaryScreen = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadShiftData = async () => {
    try {
      const data = await OperatorAPI.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.warn('Shift fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadShiftData();
  }, []);

  // Compute shift totals
  const totalBills = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total_amount || 0)), 0);
  const upiTotal = invoices
    .filter((inv) => inv.payment_method === 'UPI')
    .reduce((sum, inv) => sum + parseFloat(String(inv.total_amount || 0)), 0);
  const cashTotal = invoices
    .filter((inv) => inv.payment_method === 'CASH')
    .reduce((sum, inv) => sum + parseFloat(String(inv.total_amount || 0)), 0);
  const otherTotal = Math.max(0, totalRevenue - upiTotal - cashTotal);

  const handleCloseShift = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Shift Settlement Reconciliation',
      `Total Revenue: ₹${totalRevenue.toFixed(2)}\nCash to Handover: ₹${cashTotal.toFixed(2)}\nUPI Received: ₹${upiTotal.toFixed(2)}\n\nDo you want to confirm shift handover?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Settle',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Shift Reconciled', 'Shift handover report saved.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadShiftData(); }} />}
    >
      {/* Duty Banner */}
      <View style={styles.dutyCard}>
        <View>
          <Text style={styles.dutyTitle}>Active Shift Terminal</Text>
          <Text style={styles.dutySub}>
            Duty Operator: {user?.name} • Station: {user?.organization || 'Station 01'}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>ACTIVE</Text>
        </View>
      </View>

      {/* Primary KPI Card */}
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Total Shift Revenue</Text>
        <Text style={styles.kpiValue}>₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.kpiSub}>{totalBills} Invoices Dispensed Today</Text>
      </View>

      {/* Payment Split Breakdown */}
      <Text style={styles.sectionTitle}>Tender & Payment Split</Text>
      <View style={styles.splitGrid}>
        <View style={styles.splitBox}>
          <Ionicons name="qr-code-outline" size={24} color="#0066FF" />
          <Text style={styles.splitLabel}>UPI / QR</Text>
          <Text style={styles.splitVal}>₹{upiTotal.toFixed(0)}</Text>
        </View>
        <View style={styles.splitBox}>
          <Ionicons name="cash-outline" size={24} color="#16A34A" />
          <Text style={styles.splitLabel}>Cash Collection</Text>
          <Text style={styles.splitVal}>₹{cashTotal.toFixed(0)}</Text>
        </View>
        <View style={styles.splitBox}>
          <Ionicons name="card-outline" size={24} color="#D97706" />
          <Text style={styles.splitLabel}>Card / Credit</Text>
          <Text style={styles.splitVal}>₹{otherTotal.toFixed(0)}</Text>
        </View>
      </View>

      {/* Shift Close Button */}
      <TouchableOpacity style={styles.settleBtn} onPress={handleCloseShift}>
        <Ionicons name="checkmark-done-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.settleText}>End Shift & Generate Reconciliation</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  dutyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dutyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  dutySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  liveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803D',
  },
  kpiCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  kpiLabel: {
    color: '#93C5FD',
    fontSize: 13,
  },
  kpiValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
  },
  kpiSub: {
    color: '#E0F2FE',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  splitGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  splitBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  splitLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 2,
  },
  splitVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  settleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
