import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { format, parseISO } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns';

import { useDashboardConfig } from '../hooks/useDashboardConfig';
import { useMetricSeries } from '../hooks/useMetricSeries';
import { useMetricValue } from '../hooks/useMetricValue';
import { useFunnelInsight } from '../hooks/useFunnelInsight';
import { useBreakdownSeries } from '../hooks/useBreakdownSeries';
import { useLocale, useTheme } from '../hooks';
import { TimeFilterBar } from '../components';
import { BREAKDOWN_COLORS, BREAKDOWN_OTHER_COLOR, CHART_PRIMARY_COLOR } from '../constants';
import { formatCompactNumber } from '../utils/formatCompactNumber';
import { getDateLocale, getIntlLocale } from '../utils/locale-formats';
import type { BarChartMode, LineChartMode, TimeFilter } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number, intlLocale: string): string {
  return new Intl.NumberFormat(intlLocale).format(n);
}

function formatDateLabel(dateStr: string, dfLocale: DateFnsLocale): string {
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, 'd', { locale: dfLocale }) + '/' + format(d, 'MM', { locale: dfLocale });
  } catch {
    return '';
  }
}

function formatTooltipDate(dateStr: string, dfLocale: DateFnsLocale): string {
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "EEEE d MMM, yyyy", { locale: dfLocale });
  } catch {
    return dateStr;
  }
}

function formatLastRefreshed(isoString: string, dfLocale: DateFnsLocale): string {
  try {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: dfLocale });
  } catch {
    return '';
  }
}

function getAxisLabel(dateStr: string, index: number, total: number, dfLocale: DateFnsLocale): string {
  if (total <= 1) return formatDateLabel(dateStr, dfLocale);
  const targetLabels = total >= 15 ? 6 : Math.min(Math.max(3, Math.ceil(total / 2)), 5);
  const labelIndices = new Set<number>();
  for (let i = 0; i < targetLabels; i++) {
    labelIndices.add(Math.round((i / (targetLabels - 1)) * (total - 1)));
  }
  return labelIndices.has(index) ? formatDateLabel(dateStr, dfLocale) : '';
}

function interpolateColor(ratio: number): string {
  const r1 = 0x7b, g1 = 0x61, b1 = 0xff;
  const r2 = 0x2e, g2 = 0x2e, b2 = 0x4a;
  const t = 1 - ratio;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Tooltip component for pointer ────────────────────────────────────────────

function PointerTooltip({ date, value }: { date: string; value: number }) {
  const { locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dfLocale = getDateLocale(locale);
  const intlLocale = getIntlLocale(locale);
  return (
    <View
      style={{
        backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: isDark ? '#333' : '#D4D4D4',
      }}
    >
      <Text style={{ color: isDark ? '#A3A3A3' : '#525252', fontSize: 11, fontWeight: '500' }}>
        {formatTooltipDate(date, dfLocale)}
      </Text>
      <Text style={{ color: isDark ? '#FFFFFF' : '#171717', fontSize: 15, fontWeight: '700' }}>
        {formatCount(value, intlLocale)}
      </Text>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  const shimmer = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  return (
    <Animated.View style={{ opacity: shimmer }} className="px-4 mt-8">
      <View className="h-6 w-40 bg-background-tertiary dark:bg-[#262626] rounded mb-3" />
      <View className="h-10 w-28 bg-background-tertiary dark:bg-[#262626] rounded mb-6" />
      <View className="h-48 bg-background-tertiary dark:bg-[#262626] rounded-xl" />
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChartDetailScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { id, timeFilter: initialTf } = useLocalSearchParams<{
    id: string;
    timeFilter?: string;
  }>();

  const { metrics, reload } = useDashboardConfig();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(
    (initialTf as TimeFilter) || '7d',
  );

  // Reload metrics from storage when returning from edit screen
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const metric = metrics.find((m) => m.id === id);

  // ── Metric not found guard ──────────────────────────────────────────────
  if (!metric) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D] items-center justify-center">
        <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-medium text-base">
          {t('chartDetail.notFound')}
        </Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary font-inter-semibold text-base">{t('common.back')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessible
          accessibilityLabel={t('chartDetail.backLabel')}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={isDark ? '#FFFFFF' : '#171717'} />
        </Pressable>
        <Text
          className="flex-1 text-center text-text-primary dark:text-[#FFFFFF] font-inter-bold text-lg"
          numberOfLines={1}
        >
          {metric.label}
        </Text>
        <Pressable
          onPress={() => router.push(`/edit-chart?id=${metric.id}`)}
          hitSlop={12}
          accessible
          accessibilityLabel={t('chartDetail.editLabel')}
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={22} color={isDark ? '#A3A3A3' : '#525252'} />
        </Pressable>
      </View>

      {/* Chart content */}
      <View className="flex-1">
        {metric.chartType === 'LineChart' && (
          <LineChartDetail
            metricId={metric.id}
            eventName={metric.eventName}
            math={metric.math}
            timeFilter={timeFilter}
            breakdownProperty={metric.breakdownProperty}
            lineChartMode={metric.lineChartMode}
          />
        )}
        {metric.chartType === 'BarChart' && (
          <BarChartDetail
            metricId={metric.id}
            eventName={metric.eventName}
            math={metric.math}
            timeFilter={timeFilter}
            breakdownProperty={metric.breakdownProperty}
            barChartMode={metric.barChartMode}
          />
        )}
        {metric.chartType === 'MetricCard' && (
          <MetricCardDetail metricId={metric.id} eventName={metric.eventName} math={metric.math} timeFilter={timeFilter} />
        )}
        {metric.chartType === 'FunnelChart' && (
          <FunnelChartDetail metricId={metric.id} events={metric.funnelEvents ?? [metric.eventName]} timeFilter={timeFilter} />
        )}
      </View>

      {/* Time filter */}
      <TimeFilterBar selected={timeFilter} onSelect={setTimeFilter} />
      <Text className="text-center text-text-tertiary text-xs py-2">{t('chartDetail.dateRangeLabel')}</Text>
    </SafeAreaView>
  );
}

// ─── LineChart Detail with pointer ────────────────────────────────────────────

function LineChartDetail({
  metricId,
  eventName,
  math,
  timeFilter,
  breakdownProperty,
  lineChartMode,
}: {
  metricId: string;
  eventName: string;
  math?: string;
  timeFilter: TimeFilter;
  breakdownProperty?: string;
  lineChartMode?: LineChartMode;
}) {
  const hasBreakdown = !!breakdownProperty;
  const isCumulative = lineChartMode === 'cumulative';

  const { data, isLoading, isPending, isError } = useMetricSeries(metricId, eventName, timeFilter, math);
  const {
    data: breakdownData,
    isLoading: bdLoading,
    isPending: bdPending,
    isError: bdError,
  } = useBreakdownSeries(
    metricId,
    eventName,
    timeFilter,
    hasBreakdown ? breakdownProperty : undefined,
    math,
  );

  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dfLocale = getDateLocale(locale);
  const intlLocale = getIntlLocale(locale);

  const activeLoading = hasBreakdown ? (bdLoading || bdPending) : (isLoading || isPending);
  const activeError = hasBreakdown ? bdError : isError;
  const showSkeleton = activeLoading && !(hasBreakdown ? breakdownData : data);
  const chartWidth = Dimensions.get('window').width - 80;

  const axisColor = '#737373';
  const ruleColor = isDark ? '#1E1E1E' : '#E5E5E5';
  const xAxisLineColor = isDark ? '#2A2A2A' : '#D4D4D4';

  if (showSkeleton) return <ChartSkeleton />;
  if (activeError && !(hasBreakdown ? breakdownData : data)) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-400 text-sm">{t('chartDetail.errorLoading')}</Text>
      </View>
    );
  }

  // ── Breakdown mode ──────────────────────────────────────────────────────
  if (hasBreakdown && breakdownData && breakdownData.items.length > 0) {
    const items = breakdownData.items;
    const dateCount = items[0].dataPoints.length;

    const legendItems = items.map((item, idx) => ({
      label: item.breakdownValue,
      color: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR,
    }));

    const bdDataSet = items.map((item, idx) => {
      let cumSum = 0;
      const lineData = item.dataPoints.map((point, i) => {
        const label = getAxisLabel(point.date, i, dateCount, dfLocale);
        const value = isCumulative ? (cumSum += point.count) : point.count;
        return {
          value,
          label,
          labelTextStyle: { color: '#737373', fontSize: 10, textAlign: 'center' as const },
        };
      });
      return {
        data: lineData,
        color: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR,
        curved: true,
        hideDataPoints: true,
      };
    });

    const totalCount = isCumulative
      ? bdDataSet.reduce((acc, set) => acc + (set.data[set.data.length - 1]?.value ?? 0), 0)
      : items.reduce((acc, item) => acc + item.total, 0);

    const numPoints = bdDataSet[0]?.data.length ?? 0;
    const spacing = numPoints > 1 ? Math.floor((chartWidth - 8) / (numPoints - 1)) : 14;

    return (
      <View className="flex-1 justify-center px-4">
        <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-sm mb-1">Total</Text>
        <Text className="text-4xl font-inter-bold text-text-primary dark:text-[#FFFFFF] mb-6">
          {formatCount(totalCount, intlLocale)}
        </Text>
        <LineChart
          dataSet={bdDataSet}
          height={220}
          width={chartWidth}
          hideDataPoints
          curved
          yAxisThickness={0}
          yAxisLabelWidth={40}
          yAxisTextStyle={{ color: axisColor, fontSize: 10 }}
          formatYLabel={(label: string) => formatCompactNumber(Number(label))}
          xAxisThickness={1}
          xAxisColor={xAxisLineColor}
          rulesColor={ruleColor}
          rulesThickness={1}
          noOfSections={4}
          xAxisLabelTextStyle={{ color: axisColor, fontSize: 10, textAlign: 'center' }}
          xAxisTextNumberOfLines={1}
          labelsExtraHeight={20}
          initialSpacing={4}
          spacing={spacing}
          pointerConfig={{
            pointerStripColor: '#737373',
            pointerStripWidth: 1,
            pointerColor: '#737373',
            radius: 5,
            pointerLabelWidth: 200,
            pointerLabelHeight: 30 + items.length * 20,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            shiftPointerLabelY: -(30 + items.length * 20),
            pointerLabelComponent: (pointerItems: { value: number }[]) => {
              const matchIdx = bdDataSet[0]?.data.findIndex((d) => d.value === pointerItems[0]?.value) ?? -1;
              const dateStr = matchIdx >= 0 ? items[0]?.dataPoints[matchIdx]?.date ?? '' : '';
              return (
                <View style={{ backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: isDark ? '#333' : '#D4D4D4' }}>
                  <Text style={{ color: isDark ? '#A3A3A3' : '#525252', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>
                    {formatTooltipDate(dateStr, dfLocale)}
                  </Text>
                  {items.map((item, idx) => (
                    <View key={item.breakdownValue} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR, marginRight: 6 }} />
                      <Text style={{ color: isDark ? '#FFFFFF' : '#171717', fontSize: 12, fontWeight: '600', flex: 1 }}>{item.breakdownValue}</Text>
                      <Text style={{ color: isDark ? '#FFFFFF' : '#171717', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>
                        {formatCount(pointerItems[idx]?.value ?? 0, intlLocale)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            },
          }}
        />
        {/* Breakdown legend */}
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
      </View>
    );
  }

  // ── Breakdown enabled but no data yet ──────────────────────────────────
  if (hasBreakdown && (!breakdownData || breakdownData.items.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-tertiary text-sm">{t('chartDetail.noData')}</Text>
      </View>
    );
  }

  // ── Normal mode (no breakdown) ─────────────────────────────────────────
  if (!data || data.dataPoints.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-tertiary text-sm">{t('chartDetail.noData')}</Text>
      </View>
    );
  }

  const dates = data.dataPoints.map((p) => p.date);
  let cumSumNormal = 0;
  const lineData = data.dataPoints.map((point, i, arr) => ({
    value: isCumulative ? (cumSumNormal += point.count) : point.count,
    date: point.date,
    label: getAxisLabel(point.date, i, arr.length, dfLocale),
    labelTextStyle: { color: '#737373', fontSize: 10, textAlign: 'center' as const },
  }));

  const numPoints = lineData.length;
  const spacing = numPoints > 1 ? Math.floor((chartWidth - 8) / (numPoints - 1)) : 14;
  const displayTotal = isCumulative ? (lineData[lineData.length - 1]?.value ?? 0) : data.total;

  return (
    <View className="flex-1 justify-center px-4">
      <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-sm mb-1">Total</Text>
      <Text className="text-4xl font-inter-bold text-text-primary dark:text-[#FFFFFF] mb-6">
        {formatCount(displayTotal, intlLocale)}
      </Text>
      <LineChart
        data={lineData}
        height={220}
        width={chartWidth}
        color={CHART_PRIMARY_COLOR}
        areaChart
        startFillColor={CHART_PRIMARY_COLOR}
        endFillColor="transparent"
        startOpacity={0.15}
        endOpacity={0}
        hideDataPoints
        curved
        yAxisThickness={0}
        yAxisLabelWidth={40}
        yAxisTextStyle={{ color: axisColor, fontSize: 10 }}
        formatYLabel={(label: string) => formatCompactNumber(Number(label))}
        xAxisThickness={1}
        xAxisColor={xAxisLineColor}
        rulesColor={ruleColor}
        rulesThickness={1}
        noOfSections={4}
        xAxisLabelTextStyle={{ color: axisColor, fontSize: 10, textAlign: 'center' }}
        xAxisTextNumberOfLines={1}
        labelsExtraHeight={20}
        initialSpacing={4}
        spacing={spacing}
        pointerConfig={{
          pointerStripColor: CHART_PRIMARY_COLOR,
          pointerStripWidth: 1,
          pointerColor: CHART_PRIMARY_COLOR,
          radius: 5,
          pointerLabelWidth: 160,
          pointerLabelHeight: 60,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          shiftPointerLabelY: -60,
          pointerLabelComponent: (items: { value: number }[]) => {
            const idx = lineData.findIndex((d) => d.value === items[0]?.value && dates.includes(d.date));
            const matchDate = idx >= 0 ? lineData[idx].date : '';
            return (
              <PointerTooltip
                date={matchDate}
                value={items[0]?.value ?? 0}
              />
            );
          },
        }}
      />
    </View>
  );
}

// ─── BarChart Detail with pointer ─────────────────────────────────────────────

function BarChartDetail({
  metricId,
  eventName,
  math,
  timeFilter,
  breakdownProperty,
  barChartMode,
}: {
  metricId: string;
  eventName: string;
  math?: string;
  timeFilter: TimeFilter;
  breakdownProperty?: string;
  barChartMode?: BarChartMode;
}) {
  const useBreakdown = !!breakdownProperty && (barChartMode ?? 'stacked') === 'stacked';

  const { data, isLoading, isPending, isError } = useMetricSeries(metricId, eventName, timeFilter, math);
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dfLocale = getDateLocale(locale);
  const intlLocale = getIntlLocale(locale);
  const {
    data: breakdownData,
    isLoading: bdLoading,
    isPending: bdPending,
    isError: bdError,
  } = useBreakdownSeries(metricId, eventName, timeFilter, useBreakdown ? breakdownProperty : undefined, math);

  const activeLoading = useBreakdown ? (bdLoading || bdPending) : (isLoading || isPending);
  const activeError = useBreakdown ? bdError : isError;
  const showSkeleton = activeLoading && !(useBreakdown ? breakdownData : data);
  const chartWidth = Dimensions.get('window').width - 80;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (showSkeleton) return <ChartSkeleton />;
  if (activeError && !(useBreakdown ? breakdownData : data)) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-400 text-sm">{t('chartDetail.errorLoading')}</Text>
      </View>
    );
  }

  // ── Stacked mode ──────────────────────────────────────────────────────
  if (useBreakdown && breakdownData && breakdownData.items.length > 0) {
    const items = breakdownData.items;
    const dateCount = items[0].dataPoints.length;
    const totalCount = items.reduce((acc, item) => acc + item.total, 0);

    const legendItems = items.map((item, idx) => ({
      label: item.breakdownValue,
      color: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR,
    }));

    const stackData = [];
    for (let d = 0; d < dateCount; d++) {
      const dateStr = items[0].dataPoints[d].date;
      const label = getAxisLabel(dateStr, d, dateCount, dfLocale);
      const stacks = items.map((item, idx) => ({
        value: item.dataPoints[d]?.count ?? 0,
        color: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR,
      }));
      stackData.push({ stacks, label, onPress: () => setSelectedIndex(d) });
    }

    const numBars = stackData.length;
    const barSpacing = numBars > 1
      ? Math.max(2, Math.floor((chartWidth - numBars * 6 - 8) / numBars))
      : 14;

    // Build breakdown tooltip
    const selectedDate = selectedIndex !== null ? items[0].dataPoints[selectedIndex]?.date : null;

    return (
      <View className="flex-1 justify-center px-4">
        <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-sm mb-1">Total</Text>
        <Text className="text-4xl font-inter-bold text-text-primary dark:text-[#FFFFFF] mb-2">
          {formatCount(totalCount, intlLocale)}
        </Text>

        {/* Tooltip above chart */}
        <View style={{ minHeight: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
          {selectedDate && selectedIndex !== null ? (
            <View style={{ backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: isDark ? '#333' : '#D4D4D4' }}>
              <Text style={{ color: isDark ? '#A3A3A3' : '#525252', fontSize: 11, fontWeight: '500', marginBottom: 2 }}>
                {formatTooltipDate(selectedDate, dfLocale)}
              </Text>
              {items.map((item, idx) => (
                <View key={item.breakdownValue} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: idx < BREAKDOWN_COLORS.length ? BREAKDOWN_COLORS[idx] : BREAKDOWN_OTHER_COLOR, marginRight: 6 }} />
                  <Text style={{ color: isDark ? '#FFFFFF' : '#171717', fontSize: 12, fontWeight: '600', flex: 1 }}>{item.breakdownValue}</Text>
                  <Text style={{ color: isDark ? '#FFFFFF' : '#171717', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>
                    {formatCount(item.dataPoints[selectedIndex]?.count ?? 0, intlLocale)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#737373', fontSize: 12 }}>{t('chartDetail.tapBarHint')}</Text>
          )}
        </View>

        <BarChart
          stackData={stackData}
          height={220}
          width={chartWidth}
          yAxisThickness={0}
          yAxisLabelWidth={40}
          yAxisTextStyle={{ color: '#737373', fontSize: 10 }}
          formatYLabel={(label: string) => formatCompactNumber(Number(label))}
          xAxisThickness={1}
          xAxisColor={isDark ? '#2A2A2A' : '#D4D4D4'}
          rulesColor={isDark ? '#1E1E1E' : '#E5E5E5'}
          rulesThickness={1}
          noOfSections={4}
          barBorderRadius={3}
          xAxisLabelTextStyle={{ color: '#737373', fontSize: 10, textAlign: 'center' }}
          xAxisTextNumberOfLines={1}
          labelsExtraHeight={20}
          initialSpacing={4}
          spacing={barSpacing}
        />

        {/* Legend */}
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
      </View>
    );
  }

  // ── Normal mode (no breakdown) ────────────────────────────────────────
  if (!data || data.dataPoints.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-tertiary text-sm">{t('chartDetail.noData')}</Text>
      </View>
    );
  }

  const barData = data.dataPoints.map((point, i, arr) => {
    const label = getAxisLabel(point.date, i, arr.length, dfLocale);
    return {
      value: point.count,
      label,
      frontColor: selectedIndex === i ? '#9B85FF' : CHART_PRIMARY_COLOR,
      ...(label ? { labelWidth: 40 } : {}),
      onPress: () => setSelectedIndex(i),
    };
  });

  const numBars = barData.length;
  const barSpacing = numBars > 1
    ? Math.max(2, Math.floor((chartWidth - numBars * 6 - 8) / numBars))
    : 14;

  const selectedPoint = selectedIndex !== null ? data.dataPoints[selectedIndex] : null;

  return (
    <View className="flex-1 justify-center px-4">
      <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-semibold text-sm mb-1">Total</Text>
      <Text className="text-4xl font-inter-bold text-text-primary dark:text-[#FFFFFF] mb-2">
        {formatCount(data.total, intlLocale)}
      </Text>

      {/* Tooltip above chart */}
      <View style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
        {selectedPoint ? (
          <PointerTooltip date={selectedPoint.date} value={selectedPoint.count} />
        ) : (
          <Text style={{ color: '#737373', fontSize: 12 }}>{t('chartDetail.tapBarHint')}</Text>
        )}
      </View>

      <BarChart
        data={barData}
        height={220}
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
        noOfSections={4}
        barBorderRadius={3}
        xAxisLabelTextStyle={{ color: '#737373', fontSize: 10, textAlign: 'center' }}
        xAxisTextNumberOfLines={1}
        labelsExtraHeight={20}
        initialSpacing={4}
        spacing={barSpacing}
      />
    </View>
  );
}

// ─── MetricCard Detail ────────────────────────────────────────────────────────

function MetricCardDetail({
  metricId,
  eventName,
  math,
  timeFilter,
}: {
  metricId: string;
  eventName: string;
  math?: string;
  timeFilter: TimeFilter;
}) {
  const { data, isLoading, isPending, isError } = useMetricValue(metricId, eventName, timeFilter, math);
  const { locale, t } = useLocale();
  const dfLocale = getDateLocale(locale);
  const intlLocale = getIntlLocale(locale);
  const showSkeleton = (isLoading || isPending) && !data;

  if (showSkeleton) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2DD4BF" />
      </View>
    );
  }
  if (isError && !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-400 text-sm">{t('metricCard.errorText')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center px-4">
      <Text className="text-7xl font-inter-bold text-text-primary dark:text-[#FFFFFF]">
        {data ? formatCount(data.count, intlLocale) : '—'}
      </Text>
      <Text className="text-text-secondary dark:text-[#A3A3A3] font-inter-medium text-base mt-3">
        {eventName}
      </Text>
      {data?.lastRefreshedAt ? (
        <Text className="text-text-tertiary text-xs mt-4">
          {t('chartDetail.updatedAgo').replace('{time}', formatLastRefreshed(data.lastRefreshedAt, dfLocale))}
        </Text>
      ) : null}
    </View>
  );
}

// ─── FunnelChart Detail ───────────────────────────────────────────────────────

function AnimatedBar({ ratio, color, delay }: { ratio: number; color: string; delay: number }) {
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
    <View className="h-12 w-full rounded-lg bg-background-tertiary dark:bg-[#262626] overflow-hidden">
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

function FunnelChartDetail({
  metricId,
  events,
  timeFilter,
}: {
  metricId: string;
  events: string[];
  timeFilter: TimeFilter;
}) {
  const { data, isError, error, refetch } = useFunnelInsight(metricId, events, timeFilter);
  const { locale, t } = useLocale();
  const intlLocale = getIntlLocale(locale);
  const showSkeleton = !data && !isError;

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

  if (showSkeleton) return <ChartSkeleton />;
  if (isError && !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-400 text-sm mb-2">
          {error instanceof Error ? error.message : t('funnel.errorLoading')}
        </Text>
        <Pressable onPress={() => refetch()} className="rounded-full bg-primary/20 px-4 py-2">
          <Text className="text-primary font-inter-semibold text-sm">{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }
  if (!data || data.steps.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-tertiary text-sm">{t('funnel.noData')}</Text>
      </View>
    );
  }

  const firstCount = data.steps[0]?.count ?? 1;

  return (
    <View className="flex-1 px-4 pt-4">
      <Text className="text-text-tertiary text-xs mb-4">{t('funnel.description').replace('{count}', String(events.length))}</Text>

      {data.steps.map((step, index) => {
        const ratio = firstCount > 0 ? step.count / firstCount : 0;
        const color = interpolateColor(Math.max(ratio, 0.15));
        const conversionPct =
          index > 0 && data.steps[index - 1].count > 0
            ? ((step.count / data.steps[index - 1].count) * 100).toFixed(1)
            : null;

        return (
          <View key={`${step.name}-${index}`}>
            {conversionPct !== null && (
              <View className="flex-row items-center gap-1 my-1.5 pl-1">
                <Text className="text-text-tertiary text-xs">↓</Text>
                <Text className="text-xs font-inter-semibold text-text-secondary dark:text-[#A3A3A3]">
                  {t('funnel.conversionPercent').replace('{percent}', conversionPct)}
                </Text>
                <Text className="text-xs text-text-tertiary">
                  ({t('funnel.lost').replace('{count}', formatCount(data.steps[index - 1].count - step.count, intlLocale))})
                </Text>
              </View>
            )}
            <View className="flex-row items-baseline justify-between mb-1.5">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  <Text className="text-white text-xs font-inter-bold">{index + 1}</Text>
                </View>
                <Text className="text-sm text-text-primary dark:text-[#FFFFFF] font-inter-medium flex-1" numberOfLines={1}>
                  {step.name}
                </Text>
              </View>
              <Text className="text-sm font-inter-semibold text-text-secondary dark:text-[#A3A3A3]">
                {formatCount(step.count, intlLocale)}
              </Text>
            </View>
            <AnimatedBar ratio={ratio} color={color} delay={index * 80} />
          </View>
        );
      })}

      {data.steps.length >= 2 && (
        <View className="mt-6 pt-3 border-t border-border dark:border-[#262626] flex-row justify-between">
          <Text className="text-sm text-text-tertiary">{t('funnel.totalConversion')}</Text>
          <Text className="text-sm font-inter-bold text-text-primary dark:text-[#FFFFFF]">
            {firstCount > 0
              ? ((data.steps[data.steps.length - 1].count / firstCount) * 100).toFixed(1)
              : '0.0'}
            %
          </Text>
        </View>
      )}
    </View>
  );
}
