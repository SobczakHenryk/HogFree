import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { POSTHOG_CLOUD_LABELS } from '../constants';
import { useLocale } from '../hooks';
import type { PostHogCloud } from '../types';

interface CloudRegionSelectorProps {
  value: PostHogCloud;
  onChange: (next: PostHogCloud) => void;
  disabled?: boolean;
}

const CLOUD_OPTIONS: PostHogCloud[] = ['us', 'eu', 'self-hosted'];

export function CloudRegionSelector({ value, onChange, disabled = false }: CloudRegionSelectorProps) {
  const { t } = useLocale();

  return (
    <View className="w-full">
      <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-medium text-sm mb-2">
        {t('cloudRegion.label')}
      </Text>
      <View className="flex-row rounded-xl border border-border dark:border-[#262626] bg-background-secondary dark:bg-[#1A1A1A] p-1">
        {CLOUD_OPTIONS.map((option) => {
          const isSelected = option === value;

          return (
            <Pressable
              key={option}
              className={`flex-1 rounded-lg px-3 py-3 items-center ${
                isSelected ? 'bg-primary' : 'bg-transparent'
              }`}
              onPress={() => onChange(option)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t('cloudRegion.selectLabel').replace('{region}', POSTHOG_CLOUD_LABELS[option])}
              testID={`cloud-region-${option}`}
            >
              <Text
                className={`font-inter-medium text-sm ${
                  isSelected ? 'text-white' : 'text-text-secondary dark:text-[#A3A3A3]'
                }`}
              >
                {POSTHOG_CLOUD_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}