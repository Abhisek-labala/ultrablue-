import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { DistributorAPI, DistributorOrder } from '../../api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const DistributorDashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<DistributorOrder[]>([]);
  const [creditData, setCreditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const ordersList = await DistributorAPI.getOrders();
      setOrders(ordersList.slice(0, 5));

      if (user?.id) {
        try {
          const ledger = await DistributorAPI.getCreditLedger(user.id);
          setCreditData(ledger?.data || ledger);
        } catch {
          // ignore if ledger not initialized
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const creditLimit = creditData?.credit_limit || 250000;
  const currentOutstanding = creditData?.current_outstanding || 45000;
  const availableCredit = Math.max(0, creditLimit - currentOutstanding);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{user?.organization || 'Distributor Partner'}</Text>
          <Text style={styles.subtext}>Authorized UltraBlue+ Wholesale Portal</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={styles.verifiedText}>Active</Text>
        </View>
      </View>

      {/* Credit Summary Card */}
      <View style={styles.creditCard}>
        <View style={styles.creditCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="card" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.creditTitle}>Credit Facility & Limit</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Ledger')}>
            <Text style={styles.creditLink}>View Ledger →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.creditMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Limit</Text>
            <Text style={styles.metricVal}>₹{(creditLimit / 1000).toFixed(0)}k</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Available</Text>
            <Text style={[styles.metricVal, { color: '#6EE7B7' }]}>
              ₹{(availableCredit / 1000).toFixed(0)}k
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={[styles.metricVal, { color: '#FCA5A5' }]}>
              ₹{(currentOutstanding / 1000).toFixed(0)}k
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Shortcuts */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Catalog')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="cart" size={22} color="#0284C7" />
          </View>
          <Text style={styles.actionText}>Place Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Orders')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={22} color="#D97706" />
          </View>
          <Text style={styles.actionText}>Track Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Ledger')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="receipt" size={22} color="#15803D" />
          </View>
          <Text style={styles.actionText}>Ledger</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Requisitions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.viewAll}>See All ({orders.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={36} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No orders placed yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse our catalog to submit your first B2B stock requisition.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Catalog')}
          >
            <Text style={styles.emptyButtonText}>Explore Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        orders.map((ord) => (
          <View key={ord.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <Text style={styles.orderNum}>{ord.order_number || `ORD-#${ord.id}`}</Text>
              <View
                style={[
                  styles.statusBadge,
                  ord.status === 'ADMIN_APPROVED' || ord.status === 'COMPLETED'
                    ? styles.statusApproved
                    : styles.statusPending,
                ]}
              >
                <Text style={styles.statusText}>{ord.status}</Text>
              </View>
            </View>
            <View style={styles.orderBottom}>
              <Text style={styles.orderDate}>
                {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Recent'}
              </Text>
              <Text style={styles.orderTotal}>
                ₹{parseFloat(String(ord.total_amount || 0)).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  subtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: 'bold',
  },
  creditCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  creditCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingBottom: 12,
  },
  creditTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  creditLink: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  creditMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  metricLabel: {
    color: '#93C5FD',
    fontSize: 11,
    marginBottom: 4,
  },
  metricVal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  viewAll: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNum: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.accent,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
