import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

import { useMetricValue } from '../hooks/useMetricValue';
import { useLocale, useTheme } from '../hooks';
import { getDateLocale, getIntlLocale } from '../utils/locale-formats';
import type { DashboardMetric, TimeFilter } from '../types';

interface MetricCardProps {
  metric: DashboardMetric;
  timeFilter: TimeFilter;
  drag?: () => void;
  isActive?: boolean;
}

function formatCount(count: number, intlLocale: string): string {
  return new Intl.NumberFormat(intlLocale).format(count);
}

function formatLastRefreshed(isoString: string, dateFnsLocale: import('date-fns').Locale): string {
  try {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: dateFnsLocale });
  } catch {
    return '';
  }
}

function TrendIndicator({ current, previous }: { current: number; previous?: number }) {
  if (previous == null || previous === 0) return null;
  const pctChange = ((current - previous) / previous) * 100;
  const isPositive = pctChange >= 0;
  const color = isPositive ? '#22C55E' : '#EF4444';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <Text style={{ color, fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
      {arrow} {Math.abs(pctChange).toFixed(1)}%
    </Text>
  );
}

export function MetricCard({ metric, timeFilter, drag, isActive }: MetricCardProps) {
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dateFnsLocale = getDateLocale(locale);
  const intlLocale = getIntlLocale(locale);
  const { data, isLoading, isError, isPending } = useMetricValue(
    metric.id,
    metric.eventName,
    timeFilter,
    metric.math,
  );

  const showSkeleton = (isLoading || isPending) && !data;
  const showError = isError && !data;

  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!showSkeleton) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [showSkeleton, shimmer]);

  const title = metric.displayName || metric.label;
  const showCaption = !!metric.displayName && metric.displayName !== metric.eventName;

  return (
    <View
      className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl p-4 mx-4 my-2"
      style={isActive ? { opacity: 0.95, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, transform: [{ scale: 0.98 }] } : undefined}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
      {showSkeleton ? (
        <Animated.View style={{ opacity: shimmer }}>
          <View className="h-10 w-36 bg-background-tertiary dark:bg-[#262626] rounded-lg mb-3" />
          <View className="h-4 w-28 bg-background-tertiary dark:bg-[#262626] rounded mb-2" />
          <View className="h-3 w-20 bg-background-tertiary dark:bg-[#262626] rounded" />
        </Animated.View>
      ) : showError ? (
        <View>
          <Text className="text-4xl font-inter-bold text-text-tertiary">—</Text>
          <Text className="text-sm font-inter-medium text-text-primary dark:text-[#FFFFFF] mt-1">{title}</Text>
          {showCaption && (
            <Text className="text-xs text-text-tertiary mt-0.5">{metric.eventName}</Text>
          )}
          <Text className="text-xs text-red-400 mt-2">{t('metricCard.errorText')}</Text>
        </View>
      ) : (
        <View>
          <View className="flex-row items-baseline">
            <Text style={{ fontSize: 36, fontWeight: '700', color: isDark ? '#FFFFFF' : '#171717' }}>
              {data ? formatCount(data.count, intlLocale) : '—'}
            </Text>
            {data ? <TrendIndicator current={data.count} /> : null}
          </View>
          <Text className="text-sm font-inter-medium text-text-secondary dark:text-[#A3A3A3] mt-1">{title}</Text>
          {showCaption && (
            <Text className="text-xs text-text-tertiary mt-0.5">{metric.eventName}</Text>
          )}
          {data?.lastRefreshedAt ? (
            <Text className="text-xs text-text-tertiary mt-2">
              {t('metricCard.updatedAgo').replace('{time}', formatLastRefreshed(data.lastRefreshedAt, dateFnsLocale))}
            </Text>
          ) : null}
        </View>
      )}
        </View>
        {drag && (
          <Pressable onLongPress={drag} hitSlop={8} className="justify-center pl-3">
            <GripVertical size={20} color={isDark ? '#A3A3A3' : '#525252'} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
