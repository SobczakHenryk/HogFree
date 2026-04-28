import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLocale, useTheme } from '../hooks';

interface DashboardEmptyStateProps {
  onAddPress?: () => void;
}

export function DashboardEmptyState({ onAddPress: _ }: DashboardEmptyStateProps) {
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Ionicons name="grid-outline" size={52} color={isDark ? '#A3A3A3' : '#404040'} />
      <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-semibold text-lg mt-5 text-center">
        {t('emptyState.title')}
      </Text>
      <Text className="text-text-tertiary text-sm mt-2 text-center leading-6">
        {t('emptyState.description')}
      </Text>
    </View>
  );
}
