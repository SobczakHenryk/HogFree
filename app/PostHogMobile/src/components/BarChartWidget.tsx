import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';
import { BarChart } from 'react-native-gifted-charts';
import { format, parseISO } from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns';

import { useMetricSeries } from '../hooks/useMetricSeries';
import { useBreakdownSeries } from '../hooks/useBreakdownSeries';
import { useLocale, useTheme } from '../hooks';
import { getDateLocale, getIntlLocale } from '../utils/locale-formats';
import { BREAKDOWN_COLORS, BREAKDOWN_OTHER_COLOR, CHART_PRIMARY_COLOR } from '../constants';
import { formatCompactNumber } from '../utils/formatCompactNumber';
import type { DashboardMetric, TimeFilter } from '../types';

interface BarChartWidgetProps {
  metric: DashboardMetric;
  timeFilter: TimeFilter;
  drag?: () => void;
  isActive?: boolean;
}

function formatCount(n: number, intlLocale: string): string {
  return new Intl.NumberFormat(intlLocale).format(n);
}

function getBarLabel(dateStr: string, index: number, total: number, dfLocale: DateFnsLocale): string {
  if (total <= 1) return formatDate(dateStr, dfLocale);
  if (total <= 4) return formatDate(dateStr, dfLocale);
  const targetLabels = Math.min(Math.max(3, Math.ceil(total / 3)), 5);
  const labelIndices = new Set<number>();
  for (let i = 0; i < targetLabels; i++) {
    labelIndices.add(Math.round((i / (targetLabels - 1)) * (total - 1)));
  }
  return labelIndices.has(index) ? formatDate(dateStr, dfLocale) : '';
}

function formatDate(dateStr: string, dfLocale: DateFnsLocale): string {
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, 'd', { locale: dfLocale }) + '\n' + format(d, 'MMM', { locale: dfLocale });
  } catch {
    return '';
  }
}

export function BarChartWidget({ metric, timeFilter, drag, isActive }: BarChartWidgetProps) {
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dfLocale = getDateLocale(locale);
  const intlLocale = getIntlLocale(locale);
  const useBreakdown = metric.chartType === 'BarChart' &&
    !!metric.breakdownProperty &&
    (metric.barChartMode ?? 'stacked') === 'stacked';

  const { data, isLoading, isPending, isError } = useMetricSeries(
    metric.id,
    metric.eventName,
    timeFilter,
    metric.math,
  );

  const {
    data: breakdownData,
    isLoading: bdLoading,
    isPending: bdPending,
    isError: bdError,
  } = useBreakdownSeries(
    metric.id,
    metric.eventName,
    timeFilter,
    useBreakdown ? metric.breakdownProperty : undefined,
    metric.math,
  );

  const activeData = useBreakdown ? breakdownData : null;
  const activeLoading = useBreakdown ? (bdLoading || bdPending) : (isLoading || isPending);
  const activeError = useBreakdown ? bdError : isError;
  const showSkeleton = activeLoading && !(useBreakdown ? breakdownData : data);
  const showError = activeError && !(useBreakdown ? breakdownData : data);
  const isEmpty = useBreakdown
    ? (breakdownData && breakdownData.items.length === 0)
    : (data && data.dataPoints.length === 0);

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

  const chartWidth = Dimensions.get('window').width - 80 - 40;

  // Build chart data based on mode
  let barData: Array<{ value: number; label: string; frontColor: string; labelWidth?: number }> | undefined;
  let stackData: Array<{ stacks: Array<{ value: number; color: string }>; label: string }> | undefined;
  let totalCount = 0;
  let legendItems: Array<{ label: string; color: string }> = [];

  if (useBreakdown && activeData && activeData.items.length > 0) {
    // Stacked mode
    const items = activeData.items;
    const dateCount = items[0].dataPoints.length;
    totalCount = items.reduce((acc, item) => acc + item.total, 0);

    legendItems = items.map((item, idx) => ({
      label: item.breakdownValue,
      color: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR,
    }));

    stackData = [];
    for (let d = 0; d < dateCount; d++) {
      const dateStr = items[0].dataPoints[d].date;
      const label = getBarLabel(dateStr, d, dateCount, dfLocale);
      const stacks = items.map((item, idx) => ({
        value: item.dataPoints[d]?.count ?? 0,
        color: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR,
      }));
      stackData.push({ stacks, label });
    }
  } else if (data) {
    // Normal mode
    totalCount = data.total;
    barData = data.dataPoints.map((point, i, arr) => {
      const label = getBarLabel(point.date, i, arr.length, dfLocale);
      return {
        value: point.count,
        label,
        frontColor: CHART_PRIMARY_COLOR,
        ...(label ? { labelWidth: 40 } : {}),
      };
    });
  }

  const numBars = stackData?.length ?? barData?.length ?? 0;
  const barSpacing = numBars > 1
    ? Math.max(2, Math.floor((chartWidth - numBars * 6 - 8) / numBars))
    : 14;

  return (
    <View
      className="bg-background-secondary dark:bg-[#1A1A1A] rounded-xl p-4 mx-4 my-2"
      style={[{ minHeight: 260 }, isActive ? { opacity: 0.95, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, transform: [{ scale: 0.98 }] } : undefined]}
    >
      {showSkeleton ? (
        <Animated.View style={{ opacity: shimmer }}>
          <View className="h-4 w-36 bg-background-tertiary dark:bg-[#262626] rounded mb-2" />
          <View className="h-8 w-28 bg-background-tertiary dark:bg-[#262626] rounded mb-4" />
          <View className="h-24 bg-background-tertiary dark:bg-[#262626] rounded-lg" />
        </Animated.View>
      ) : showError ? (
        <View className="flex-row items-start">
          <View className="flex-1">
            <Text className="text-sm font-inter-semibold text-text-primary dark:text-[#FFFFFF]">{metric.displayName || metric.label}</Text>
            <Text className="text-xs text-red-400 mt-2">{t('charts.errorLoading')}</Text>
          </View>
          {drag && <Pressable onLongPress={drag} hitSlop={8} className="pl-3 pt-1"><GripVertical size={20} color={isDark ? '#A3A3A3' : '#525252'} /></Pressable>}
        </View>
      ) : isEmpty ? (
        <View className="flex-row items-start">
          <View className="flex-1">
            <Text className="text-sm font-inter-semibold text-text-primary dark:text-[#FFFFFF]">{metric.displayName || metric.label}</Text>
            <Text className="text-xs text-text-tertiary mt-3">{t('charts.noData')}</Text>
          </View>
          {drag && <Pressable onLongPress={drag} hitSlop={8} className="pl-3 pt-1"><GripVertical size={20} color={isDark ? '#A3A3A3' : '#525252'} /></Pressable>}
        </View>
      ) : (
        <View>
          <View className="flex-row items-start">
            <View className="flex-1">
              <Text className="text-sm font-inter-semibold text-text-secondary dark:text-[#A3A3A3]">{metric.displayName || metric.label}</Text>
              {metric.displayName && metric.displayName !== metric.eventName && (
                <Text className="text-xs text-text-tertiary mt-0.5">{metric.eventName}</Text>
              )}
              <Text style={{ fontSize: 28, fontWeight: '700', color: isDark ? '#FFFFFF' : '#171717', marginTop: 4 }}>
                {formatCount(totalCount, intlLocale)}
              </Text>
            </View>
            {drag && (
              <Pressable onLongPress={drag} hitSlop={8} className="justify-center pl-3 pt-1">
                <GripVertical size={20} color={isDark ? '#A3A3A3' : '#525252'} />
              </Pressable>
            )}
          </View>
          <View className="mt-3">
            {stackData ? (
              <BarChart
                stackData={stackData}
                height={100}
                width={chartWidth}
                yAxisThickness={0}
                yAxisLabelWidth={40}
                yAxisTextStyle={{ color: '#737373', fontSize: 10 }}
                formatYLabel={(label: string) => formatCompactNumber(Number(label))}
                xAxisThickness={1}
                xAxisColor={isDark ? '#2A2A2A' : '#D4D4D4'}
                rulesColor={isDark ? '#1E1E1E' : '#E5E5E5'}
                rulesThickness={1}
                noOfSections={3}
                barBorderRadius={8}
                xAxisLabelTextStyle={{ color: '#737373', fontSize: 10, textAlign: 'center' }}
                xAxisTextNumberOfLines={2}
                labelsExtraHeight={30}
                initialSpacing={4}
                spacing={barSpacing}
              />
            ) : (
              <BarChart
                data={barData}
                height={100}
                width={chartWidth}
                frontColor={CHART_PRIMARY_COLOR}
                yAxisThickness={0}
                yAxisLabelWidth={40}
                yAxisTextStyle={{ color: '#737373', fontSize: 10 }}
                formatYLabel={(label: string) => formatCompactNumber(Number(label))}
                xAxisThickness={1}
                xAxisColor={isDark ? '#2A2A2A' : '#D4D4D4'}
                rulesColor={isDark ? '#1E1E1E' : '#E5E5E5'}
                rulesThickness={1}
                noOfSections={3}
                barBorderRadius={8}
                isAnimated
                animationDuration={500}
                xAxisLabelTextStyle={{ color: '#737373', fontSize: 10, textAlign: 'center' }}
                xAxisTextNumberOfLines={2}
                labelsExtraHeight={30}
                initialSpacing={4}
                spacing={barSpacing}
              />
            )}
          </View>
          {/* Breakdown legend */}
          {legendItems.length > 0 && (
            <View className="flex-row flex-wrap mt-3 gap-x-4 gap-y-1">
              {legendItems.map((item) => (
                <View key={item.label} className="flex-row items-center">
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 4 }} />
                  <Text className="text-text-tertiary font-inter text-xs" numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
