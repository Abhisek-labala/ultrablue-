import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const OperatorProfileScreen = () => {
  const { user, logout, serverUrl } = useAuth();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Sign out of active forecourt POS terminal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Ionicons name="speedometer" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.name}>{user?.name || 'Forecourt Operator'}</Text>
        <Text style={styles.subtext}>Station Sales Duty</Text>
        <View style={styles.stationBadge}>
          <Ionicons name="location" size={14} color="#1E40AF" />
          <Text style={styles.stationText}>{user?.organization || 'Assigned Depot 01'}</Text>
        </View>
      </View>

      {/* Info List */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Operator Email</Text>
          <Text style={styles.val}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Terminal Station</Text>
          <Text style={styles.val}>{user?.organization || 'Cuttack Central Plant'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Backend Host</Text>
          <Text style={[styles.val, { fontSize: 11 }]} numberOfLines={1}>
            {serverUrl}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>End Shift & Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>UltraBlue+ POS Terminal v1.0</Text>
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
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 10,
  },
  stationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
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
