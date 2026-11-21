import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const DistributorProfileScreen = () => {
  const { user, logout, serverUrl } = useAuth();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to log out of the B2B portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Ionicons name="business" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.orgName}>{user?.organization || 'Distributor Firm'}</Text>
        <Text style={styles.contactName}>{user?.name} (Authorized Partner)</Text>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color="#15803D" />
          <Text style={styles.badgeText}>Verified B2B Dealer</Text>
        </View>
      </View>

      {/* Info List */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.val}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Contact Phone</Text>
          <Text style={styles.val}>{user?.phone || '+91 9876543210'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Account Role</Text>
          <Text style={styles.val}>Wholesale Distributor</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Connected Server</Text>
          <Text style={[styles.val, { fontSize: 11 }]} numberOfLines={1}>
            {serverUrl}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Sign Out of UltraBlue+</Text>
      </TouchableOpacity>

      <Text style={styles.version}>UltraBlue+ Enterprise Mobile v1.0 • Odisha Plant</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  orgName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  contactName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803D',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  row: {
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 24,
  },
});
