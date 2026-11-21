import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DistributorDashboardScreen } from '../screens/distributor/DashboardScreen';
import { DistributorCatalogScreen } from '../screens/distributor/CatalogScreen';
import { DistributorOrdersScreen } from '../screens/distributor/OrdersScreen';
import { DistributorLedgerScreen } from '../screens/distributor/LedgerScreen';
import { DistributorProfileScreen } from '../screens/distributor/ProfileScreen';
import { Colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export const DistributorNav = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DistributorDashboardScreen}
        options={{
          title: 'Overview',
          headerTitle: 'Distributor Portal',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Catalog"
        component={DistributorCatalogScreen}
        options={{
          title: 'Catalog',
          headerTitle: 'Wholesale B2B Catalog',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={DistributorOrdersScreen}
        options={{
          title: 'Requisitions',
          headerTitle: 'Order Tracking',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Ledger"
        component={DistributorLedgerScreen}
        options={{
          title: 'Ledger',
          headerTitle: 'Credit Facility & Ledger',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DistributorProfileScreen}
        options={{
          title: 'Account',
          headerTitle: 'Distributor Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
