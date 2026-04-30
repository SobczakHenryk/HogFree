import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';

import { useFunnelInsight } from '../hooks/useFunnelInsight';
import { useLocale, useTheme } from '../hooks';
import { getIntlLocale } from '../utils/locale-formats';
import type { DashboardMetric, TimeFilter } from '../types';

interface FunnelChartProps {
  metric: DashboardMetric;
  timeFilter: TimeFilter;
  drag?: () => void;
  isActive?: boolean;
}

function formatCount(n: number, intlLocale: string): string {
  return new Intl.NumberFormat(intlLocale).format(n);
}

/**
 * Interpolates between two hex colors based on a ratio 0‒1.
 * ratio = 1 → Blue (start), ratio = 0 → Teal muted
 */
function interpolateColor(ratio: number): string {
  // Blue #3B82F6 → Teal #2DD4BF
  const r1 = 0x3b, g1 = 0x82, b1 = 0xf6;
  const r2 = 0x2d, g2 = 0xd4, b2 = 0xbf;
  const t = 1 - ratio;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

interface AnimatedBarProps {
  ratio: number;        // 0-1 width proportion
  color: string;
  delay: number;
}

function AnimatedBar({ ratio, color, delay }: AnimatedBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: ratio,
      duration: 500,
      delay,
      useNativeDriver: false,
    }).start();
  }, [ratio, delay, widthAnim]);

  return (
    <View className="h-10 w-full rounded-lg bg-background-tertiary dark:bg-[#262626] overflow-hidden">
      <Animated.View
        style={{
          height: '100%',
          width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
          borderRadius: 8,
        }}
      />
    </View>
  );
}

export function FunnelChart({ metric, timeFilter, drag, isActive }: FunnelChartProps) {
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const intlLocale = getIntlLocale(locale);
  const events = metric.funnelEvents ?? [metric.eventName];
  const { data, isError, error, refetch } = useFunnelInsight(metric.id, events, timeFilter);

  // Show skeleton whenever there's no data yet (query disabled, pending, or restoring cache).
  // Only stop showing skeleton when data arrives OR an explicit error occurs.
  const showSkeleton = !data && !isError;
  const showError = isError && !data;
  const isEmpty = data && data.steps.length === 0;

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

  const firstCount = data?.steps[0]?.count ?? 1;

  return (
    <View
      className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl p-4 mx-4 my-2"
      style={isActive ? { opacity: 0.95, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, transform: [{ scale: 0.98 }] } : undefined}
    >
      {/* Header */}
      <View className="flex-row items-start mb-1">
        <View className="flex-1">
          <Text className="text-sm font-inter-semibold text-text-primary dark:text-[#FFFFFF]">{metric.displayName || metric.label}</Text>
          {metric.displayName && metric.displayName !== metric.eventName && (
            <Text className="text-xs text-text-tertiary mt-0.5">{metric.eventName}</Text>
          )}
        </View>
        {drag && (
          <Pressable onLongPress={drag} hitSlop={8} className="pl-3 pt-0.5">
            <GripVertical size={20} color={isDark ? '#A3A3A3' : '#525252'} />
          </Pressable>
        )}
      </View>
      <Text className="text-xs text-text-tertiary mb-4">{t('funnel.description').replace('{count}', String(events.length))}</Text>

      {showSkeleton ? (
        <Animated.View style={{ opacity: shimmer }} className="gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} className="gap-1">
              <View className="h-3 w-24 bg-background-tertiary dark:bg-[#262626] rounded mb-1" />
              <View
                className="h-10 bg-background-tertiary dark:bg-[#262626] rounded-lg"
                style={{ width: `${100 - i * 20}%` }}
              />
            </View>
          ))}
        </Animated.View>
      ) : showError ? (
        <View>
          <Text className="text-xs text-red-400">
            {error instanceof Error ? error.message : t('funnel.errorLoading')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-2 self-start rounded-full bg-primary/20 px-3 py-1"
          >
            <Text className="text-xs text-primary font-inter-semibold">{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : isEmpty ? (
        <Text className="text-xs text-text-tertiary">{t('funnel.noData')}</Text>
      ) : (
        <View>
          {data!.steps.map((step, index) => {
            const ratio = firstCount > 0 ? step.count / firstCount : 0;
            const color = interpolateColor(Math.max(ratio, 0.15));
            const conversionPct =
              index > 0 && data!.steps[index - 1].count > 0
                ? ((step.count / data!.steps[index - 1].count) * 100).toFixed(1)
                : null;

            return (
              <View key={`${step.name}-${index}`}>
                {/* Conversion arrow between steps */}
                {conversionPct !== null && (
                  <View className="flex-row items-center gap-1 my-2 pl-2 py-1">
                    <Text className="text-text-tertiary text-xs">↓</Text>
                    <Text className="text-xs font-inter-semibold text-text-secondary dark:text-[#A3A3A3]">
                      {t('funnel.conversionPercent').replace('{percent}', conversionPct)}
                    </Text>
                    <Text className="text-xs text-text-tertiary">
                      ({t('funnel.lost').replace('{count}', formatCount(data!.steps[index - 1].count - step.count, intlLocale))})
                    </Text>
                  </View>
                )}

                {/* Step label row */}
                <View className="flex-row items-baseline justify-between mb-1">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <View
                      className="w-5 h-5 rounded-full items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Text className="text-white text-[10px] font-inter-bold">
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      className="text-xs text-text-primary dark:text-[#FFFFFF] font-inter-medium flex-1"
                      numberOfLines={1}
                    >
                      {step.name}
                    </Text>
                  </View>
                  <Text className="text-xs font-inter-semibold text-text-secondary dark:text-[#A3A3A3]">
                    {formatCount(step.count, intlLocale)}
                  </Text>
                </View>

                {/* Animated bar */}
                <AnimatedBar ratio={ratio} color={color} delay={index * 80} />
              </View>
            );
          })}

          {/* Overall conversion footer */}
          {data!.steps.length >= 2 && (
            <View className="mt-4 pt-3 border-t border-border dark:border-[#262626] flex-row justify-between">
              <Text className="text-xs text-text-tertiary">{t('funnel.totalConversion')}</Text>
              <Text className="text-xs font-inter-bold text-text-primary dark:text-[#FFFFFF]">
                {firstCount > 0
                  ? ((data!.steps[data!.steps.length - 1].count / firstCount) * 100).toFixed(1)
                  : '0.0'}
                %
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
