import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Logo } from '../../components/Logo';

export const LaunchScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Logo size="xlarge" style={styles.logo} />
        <Text style={styles.tagline}>
          ISO 22241 Certified Pure Diesel Exhaust Fluid & Station Terminal
        </Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#0066FF" />
        <Text style={styles.loadingText}>Initializing secure terminal session...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1A2F', // Deep Midnight Navy matching Web & Splash
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.5,
  },
});
