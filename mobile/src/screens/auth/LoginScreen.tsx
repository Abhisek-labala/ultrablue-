import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { Logo } from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const LoginScreen = () => {
  const { login, serverUrl, setServerUrl, isLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'operator' | 'distributor'>('operator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);

  const roleMeta = {
    operator: {
      title: 'Sales & Plant POS Operator',
      subtitle: 'Real-time retail billing, thermal GST receipts, dispensing nozzle counter',
      icon: 'speedometer-outline' as const,
      demoEmail: 'operator@ultrablue.in',
    },
    distributor: {
      title: 'Wholesale B2B Distributor',
      subtitle: 'Wholesale requisitions, live B2B price lists, credit facility ledger',
      icon: 'briefcase-outline' as const,
      demoEmail: 'distributor@ultrablue.in',
    },
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password / PIN.');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login(email.trim(), password, selectedRole);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err.message === 'Network Error' || !err.response) {
        Alert.alert(
          'Network Connection Error',
          `Cannot connect to:\n${serverUrl}\n\nPlease check:\n1. Your Laravel backend is running:\n   php artisan serve --host=0.0.0.0 --port=8000\n2. Your phone and PC are on the same Wi-Fi network.`,
          [
            { text: 'Configure URL', onPress: () => { setTempUrl(serverUrl); setShowConfig(true); } },
            { text: 'OK' },
          ]
        );
      } else {
        const msg = err.response?.data?.message || err.message || 'Login failed.';
        Alert.alert('Sign In Failed', msg);
      }
    }
  };

  const fillQuickDemo = (role: 'operator' | 'distributor') => {
    Haptics.selectionAsync();
    setSelectedRole(role);
    setEmail(roleMeta[role].demoEmail);
    setPassword('password');
  };

  const handleSaveServerUrl = async () => {
    if (!tempUrl.trim()) return;
    await setServerUrl(tempUrl.trim());
    setShowConfig(false);
    Alert.alert('Updated', 'API Base URL updated successfully.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header with Web Logo */}
        <View style={styles.header}>
          <Logo size="medium" style={styles.logoWrapper} />
          <Text style={styles.portalTitle}>Portal Login</Text>
          <Text style={styles.portalSubtitle}>
            Industrial DEF Dispensing & Wholesale Terminal
          </Text>
        </View>

        {/* Role Tabs for Mobile (Sales Operator & Distributor Only) */}
        <View style={styles.roleTabsContainer}>
          {(['operator', 'distributor'] as const).map((r) => {
            const isActive = selectedRole === r;
            const meta = roleMeta[r];
            return (
              <TouchableOpacity
                key={r}
                style={[styles.roleTab, isActive && styles.roleTabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedRole(r);
                }}
              >
                <Ionicons
                  name={meta.icon}
                  size={16}
                  color={isActive ? '#fff' : Colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.roleTabText, isActive && styles.roleTabTextActive]}>
                  {r === 'operator' ? 'SALES OPERATOR' : 'DISTRIBUTOR'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Role Meta Card */}
        <View style={styles.roleBanner}>
          <Text style={styles.roleBannerTitle}>{roleMeta[selectedRole].title}</Text>
          <Text style={styles.roleBannerSub}>{roleMeta[selectedRole].subtitle}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>
            {selectedRole === 'operator' ? 'Operator ID / Email' : 'Email Address'} *
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. operator@ultrablue.in"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.inputLabel}>
            {selectedRole === 'operator' ? 'Terminal PIN / Password' : 'Password'} *
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>
                  Sign In to {selectedRole === 'operator' ? 'POS Terminal' : 'B2B Wholesale Portal'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Demo Fill Buttons Matching Web */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Demo Fast Fill:</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={[styles.demoBtn, selectedRole === 'operator' && styles.demoBtnActive]}
                onPress={() => fillQuickDemo('operator')}
              >
                <Text style={[styles.demoBtnText, selectedRole === 'operator' && styles.demoBtnTextActive]}>
                  Sales Operator
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, selectedRole === 'distributor' && styles.demoBtnActive]}
                onPress={() => fillQuickDemo('distributor')}
              >
                <Text style={[styles.demoBtnText, selectedRole === 'distributor' && styles.demoBtnTextActive]}>
                  Distributor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Server Connection Pill */}
        <TouchableOpacity
          style={styles.serverPill}
          onPress={() => {
            setTempUrl(serverUrl);
            setShowConfig(true);
          }}
        >
          <Ionicons name="wifi" size={14} color="#0066FF" />
          <Text style={styles.serverPillText} numberOfLines={1}>
            API Host: {serverUrl}
          </Text>
          <Ionicons name="pencil" size={12} color={Colors.accent} />
        </TouchableOpacity>
      </ScrollView>

      {/* Server IP Config Modal */}
      <Modal visible={showConfig} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backend Server API URL</Text>
            <Text style={styles.modalSubtitle}>
              Ensure your computer's Wi-Fi IP is entered (e.g. http://192.168.1.9:8000/api) and Laravel is started with:
              {"\n"}`php artisan serve --host=0.0.0.0 --port=8000`
            </Text>
            <TextInput
              style={styles.modalInput}
              value={tempUrl}
              onChangeText={setTempUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.9:8000/api"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowConfig(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.modalBtnTextSave}>Save & Reconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1A2F', // Deep Midnight Navy matching Web Login
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    marginBottom: 14,
  },
  portalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  portalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#0066FF', // UltraBlue Accent Blue
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  roleBanner: {
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  roleBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60A5FA',
  },
  roleBannerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#0F2744',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  demoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  demoBtnActive: {
    backgroundColor: 'rgba(0, 102, 255, 0.25)',
    borderColor: '#0066FF',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  demoBtnTextActive: {
    color: '#60A5FA',
    fontWeight: 'bold',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: '90%',
  },
  serverPillText: {
    fontSize: 11,
    color: '#94A3B8',
    maxWidth: 220,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F2744',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBtnSave: {
    backgroundColor: '#0066FF',
  },
  modalBtnTextCancel: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalBtnTextSave: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
