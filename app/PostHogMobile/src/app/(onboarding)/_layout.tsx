import { Stack } from 'expo-router';

import { useTheme } from '../../hooks';

export default function OnboardingLayout() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: isDark ? '#0D0D0D' : '#FFFFFF' },
      }}
    />
  );
}
