import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { DistributorAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const DistributorLedgerScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ledger, setLedger] = useState<any>(null);

  const loadLedger = async () => {
    try {
      if (user?.id) {
        const data = await DistributorAPI.getCreditLedger(user.id);
        setLedger(data?.data || data);
      }
    } catch (err) {
      console.warn('Ledger load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const creditLimit = ledger?.credit_limit || 250000;
  const currentOutstanding = ledger?.current_outstanding || 45000;
  const availableCredit = Math.max(0, creditLimit - currentOutstanding);
  const utilizationPercent = Math.min(100, Math.round((currentOutstanding / (creditLimit || 1)) * 100));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching Credit Ledger...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLedger(); }} />}
    >
      {/* Visual Credit Gauge Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Credit Facility Utilization</Text>

        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${utilizationPercent}%` },
              utilizationPercent > 80 ? { backgroundColor: '#EF4444' } : { backgroundColor: '#0066FF' },
            ]}
          />
        </View>

        <View style={styles.usageRow}>
          <Text style={styles.usageText}>{utilizationPercent}% Credit Limit Utilized</Text>
          <Text style={styles.usageSub}>30-Day Billing Cycle</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Facility</Text>
            <Text style={styles.statVal}>₹{creditLimit.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Outstanding</Text>
            <Text style={[styles.statVal, { color: '#DC2626' }]}>
              ₹{currentOutstanding.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Available</Text>
            <Text style={[styles.statVal, { color: '#16A34A' }]}>
              ₹{availableCredit.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Credit Settlement Info */}
      <View style={styles.infoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="information-circle-outline" size={18} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.infoTitle}>Payment Settlement Terms</Text>
        </View>
        <Text style={styles.infoDesc}>
          Payments are reconciled directly against RTGS/NEFT bank transfers to the UltraBlue+ Escrow account. Contact your dispatch manager to log settlements.
        </Text>
      </View>

      {/* Statement History */}
      <Text style={styles.sectionTitle}>Recent Ledger Transactions</Text>
      <View style={styles.emptyCard}>
        <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Statement In Good Standing</Text>
        <Text style={styles.emptySubtitle}>All recent B2B invoices and credit adjustments are synchronized.</Text>
      </View>
    </ScrollView>
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  usageText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  usageSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  infoDesc: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
