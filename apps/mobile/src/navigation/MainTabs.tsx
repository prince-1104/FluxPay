import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import TripsScreen from '../screens/TripsScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import FriendsScreen from '../screens/FriendsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const TripsStack = createNativeStackNavigator();

function TripsStackNavigator() {
  return (
    <TripsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.brandLight,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <TripsStack.Screen name="TripsList" component={TripsScreen} options={{ title: 'Trips' }} />
      <TripsStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip' }} />
    </TripsStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '⌂',
    Trips: '✈',
    Friends: '👥',
    Alerts: '🔔',
    Settings: '⚙',
  };
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{icons[label] ?? '•'}</Text>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.brandLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.brandLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen
        name="Trips"
        component={TripsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
