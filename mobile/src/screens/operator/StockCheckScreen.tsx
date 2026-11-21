import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { OperatorAPI, InventoryItem } from '../../api';
import { Ionicons } from '@expo/vector-icons';

export const StockCheckScreen = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStock = async () => {
    try {
      const data = await OperatorAPI.getInventory();
      setInventory(data);
    } catch (err) {
      console.warn('Stock fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Fetching Depot Inventory Levels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={inventory}
        keyExtractor={(item, idx) => String(item.id || idx)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStock(); }} />
        }
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Ionicons name="cube-outline" size={24} color={Colors.accent} />
            <Text style={styles.headerTitle}>Active Depot Inventory</Text>
            <Text style={styles.headerSub}>
              Monitors real-time dispensing tank litres and available packed units.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Stock Records Found</Text>
            <Text style={styles.emptySub}>Please check depot location configuration in backend.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const litres = parseFloat(String(item.stock_litres || 0));
          const units = parseInt(String(item.stock_units || 0), 10);
          const isLow = litres < 200 && units < 10;

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.product_name || 'UltraBlue+ DEF'}</Text>
                  <Text style={styles.skuText}>SKU: {item.sku || 'DEF-BULK'}</Text>
                </View>
                <View style={[styles.badge, isLow ? styles.badgeLow : styles.badgeNormal]}>
                  <Text style={[styles.badgeText, isLow ? styles.badgeTextLow : styles.badgeTextNormal]}>
                    {isLow ? 'Low Stock' : 'Optimal'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Bulk Tank Volume</Text>
                  <Text style={styles.metricValue}>{litres.toLocaleString()} L</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Packed Units</Text>
                  <Text style={styles.metricValue}>{units} Units</Text>
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
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 6,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
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
    marginBottom: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  skuText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeNormal: {
    backgroundColor: '#DCFCE7',
  },
  badgeLow: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextNormal: {
    color: '#15803D',
  },
  badgeTextLow: {
    color: '#B91C1C',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
});
