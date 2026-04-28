import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useLocale, useTheme } from '../../hooks';

export default function TabsLayout() {
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0D0D0D' : '#FFFFFF',
          borderTopColor: isDark ? '#262626' : '#E5E5E5',
        },
        tabBarActiveTintColor: '#2DD4BF',
        tabBarInactiveTintColor: isDark ? '#888' : '#A3A3A3',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
