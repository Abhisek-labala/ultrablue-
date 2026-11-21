import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PosBillingScreen } from '../screens/operator/PosBillingScreen';
import { StockCheckScreen } from '../screens/operator/StockCheckScreen';
import { SalesHistoryScreen } from '../screens/operator/SalesHistoryScreen';
import { ShiftSummaryScreen } from '../screens/operator/ShiftSummaryScreen';
import { OperatorProfileScreen } from '../screens/operator/OperatorProfileScreen';
import { Colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export const OperatorNav = () => {
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
        name="POS"
        component={PosBillingScreen}
        options={{
          title: 'POS Billing',
          headerTitle: 'UltraBlue+ POS Terminal',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Stock"
        component={StockCheckScreen}
        options={{
          title: 'Stock',
          headerTitle: 'Depot Tank & Pack Stock',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={SalesHistoryScreen}
        options={{
          title: 'Sales Slips',
          headerTitle: 'Today\'s Invoices',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Shift"
        component={ShiftSummaryScreen}
        options={{
          title: 'Shift Close',
          headerTitle: 'Shift Reconciliation',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={OperatorProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'Operator Station',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
