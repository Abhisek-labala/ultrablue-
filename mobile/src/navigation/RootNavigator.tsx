import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { LaunchScreen } from '../screens/auth/LaunchScreen';
import { DistributorNav } from './DistributorNav';
import { OperatorNav } from './OperatorNav';

export const RootNavigator = () => {
  const { user, token, isLoading } = useAuth();

  // Branded Launch Screen with Application Logo while initializing
  if (isLoading) {
    return <LaunchScreen />;
  }

  // If not logged in -> Show Login
  if (!token || !user) {
    return <LoginScreen />;
  }

  // Route strictly based on Mobile personas: Distributor & Operator
  if (user.role === 'distributor') {
    return <DistributorNav />;
  }

  if (user.role === 'operator') {
    return <OperatorNav />;
  }

  // Fallback for duty operators
  return <OperatorNav />;
};
