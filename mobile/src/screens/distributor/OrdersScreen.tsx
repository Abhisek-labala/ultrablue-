import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { DistributorAPI, DistributorOrder } from '../../api';
import { Ionicons } from '@expo/vector-icons';

export const DistributorOrdersScreen = () => {
  const [orders, setOrders] = useState<DistributorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await DistributorAPI.getOrders();
      setOrders(data);
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ADMIN_APPROVED':
      case 'COMPLETED':
        return { bg: '#DCFCE7', text: '#15803D', label: 'APPROVED' };
      case 'PROCESSING':
        return { bg: '#E0F2FE', text: '#0369A1', label: 'PROCESSING' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'REJECTED' };
      default:
        return { bg: '#FEF3C7', text: '#B45309', label: 'PENDING APPROVAL' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching B2B Requisitions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Requisitions Found</Text>
            <Text style={styles.emptySubtitle}>You have not placed any orders yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStatusStyle(item.status);
          const total = parseFloat(String(item.total_amount || 0));

          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>{item.order_number || `ORD-${item.id}`}</Text>
                  <Text style={styles.orderDate}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsRow}>
                <View>
                  <Text style={styles.detailLabel}>Company / Contact</Text>
                  <Text style={styles.detailVal}>{item.distributor_company || item.distributor_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.detailLabel}>Requisition Value</Text>
                  <Text style={styles.amountText}>₹{total.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accent,
    marginTop: 2,
  },
});
