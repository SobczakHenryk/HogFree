import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useLocale } from '../hooks';
import type { TimeFilter } from '../types';
import type { TranslationKey } from '../i18n/types';

interface TimeFilterBarProps {
  selected: TimeFilter;
  onSelect: (filter: TimeFilter) => void;
}

const FILTERS: TimeFilter[] = ['today', 'yesterday', '7d', '15d', '30d', '90d', '180d', 'all'];

const TIME_FILTER_KEY: Record<TimeFilter, TranslationKey> = {
  today: 'timeFilter.today',
  yesterday: 'timeFilter.yesterday',
  '7d': 'timeFilter.7d',
  '15d': 'timeFilter.15d',
  '30d': 'timeFilter.30d',
  '90d': 'timeFilter.90d',
  '180d': 'timeFilter.180d',
  all: 'timeFilter.all',
};

export function TimeFilterBar({ selected, onSelect }: TimeFilterBarProps) {
  const { t } = useLocale();
  return (
    <View className="border-b border-border dark:border-[#262626]">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {FILTERS.map((filter) => {
          const isActive = filter === selected;
          return (
            <Pressable
              key={filter}
              onPress={() => onSelect(filter)}
              className={`px-4 py-1.5 rounded-full ${
                isActive ? 'bg-primary' : 'bg-background-tertiary dark:bg-[#262626]'
              }`}
            >
              <Text
                className={`text-sm font-inter-medium ${
                  isActive ? 'text-white' : 'text-text-secondary dark:text-[#A3A3A3]'
                }`}
              >
                {t(TIME_FILTER_KEY[filter])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
