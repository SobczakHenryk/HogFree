import BottomSheet from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { AddMetricSheet, BarChartWidget, DashboardEmptyState, FunnelChart, LineChartWidget, MetricCard, TimeFilterBar } from '../../components';
import { SECURE_STORE_KEY } from '../../constants';
import { useDashboardConfig } from '../../hooks/useDashboardConfig';
import { useLocale } from '../../hooks';
import { getMetricQueryKey } from '../../hooks/useMetricValue';
import { getMetricSeriesQueryKey } from '../../hooks/useMetricSeries';
import { getFunnelQueryKey } from '../../hooks/useFunnelInsight';
import { useProjectInfo } from '../../hooks/useProjectInfo';
import { queryMetricValue, queryMetricSeries } from '../../services/posthog-api';
import type { ChartType, DashboardMetric, TimeFilter } from '../../types';

export default function DashboardScreen() {
  const { t } = useLocale();
  const { metrics, isLoading, addMetric, reorderMetrics, reload } = useDashboardConfig();

  // Re-read metrics from AsyncStorage when coming back from edit screen
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const { projectInfo } = useProjectInfo();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const addMetricSheetRef = useRef<BottomSheet>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleAddMetric(input: {
    eventName: string;
    label: string;
    chartType: ChartType;
    funnelEvents?: string[];
  }) {
    await addMetric(input);
    addMetricSheetRef.current?.close();
  }

  async function handleRefresh() {
    setRefreshError(null);
    setRefreshing(true);

    try {
      if (!projectInfo) {
        throw new Error('No project info available');
      }

      const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!apiKey) {
        throw new Error('No API key available');
      }

      await Promise.all(
        metrics.map(async (metric) => {
          if (metric.chartType === 'BarChart' || metric.chartType === 'LineChart') {
            const series = await queryMetricSeries(
              apiKey,
              projectInfo.cloudRegion,
              projectInfo.id,
              metric.eventName,
              timeFilter,
              { refresh: 'force_blocking', math: metric.math },
            );
            queryClient.setQueryData(
              getMetricSeriesQueryKey(projectInfo.cloudRegion, metric.id, timeFilter, metric.math),
              series,
            );
          } else if (metric.chartType === 'FunnelChart' && metric.funnelEvents && metric.funnelEvents.length >= 2) {
            // Funnel queries can be slow — invalidate and let the widget refetch in background
            // instead of blocking the pull-to-refresh indicator for up to 45s.
            queryClient.invalidateQueries({
              queryKey: getFunnelQueryKey(projectInfo.cloudRegion, metric.id, timeFilter),
            });
          } else {
            const metricValue = await queryMetricValue(
              apiKey,
              projectInfo.cloudRegion,
              projectInfo.id,
              metric.eventName,
              timeFilter,
              { refresh: 'force_blocking', math: metric.math },
            );
            queryClient.setQueryData(
              getMetricQueryKey(projectInfo.cloudRegion, metric.id, timeFilter, metric.math),
              metricValue,
            );
          }
        }),
      );
    } catch {
      setRefreshError(t('dashboard.cacheError'));
    } finally {
      setRefreshing(false);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background dark:bg-[#0D0D0D] items-center justify-center">
        <ActivityIndicator size="large" color="#2DD4BF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-[#0D0D0D]" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <Text className="text-text-primary dark:text-[#FFFFFF] font-inter-bold text-2xl">{t('dashboard.title')}</Text>
      </View>

      {/* Time filter chips */}
      <TimeFilterBar selected={timeFilter} onSelect={setTimeFilter} />

      {refreshError ? (
        <View className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <Text className="text-sm font-inter-medium text-red-300 dark:text-red-300">{refreshError}</Text>
        </View>
      ) : null}

      {/* Metrics list */}
      <DraggableFlatList
        data={metrics}
        keyExtractor={(item: DashboardMetric) => item.id}
        onDragEnd={({ data }) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          reorderMetrics(data);
        }}
        renderItem={({ item, drag, isActive }: RenderItemParams<DashboardMetric>) => {
          const handleDrag = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          };
          const widget = (() => {
            switch (item.chartType) {
              case 'BarChart':
                return <BarChartWidget metric={item} timeFilter={timeFilter} drag={handleDrag} isActive={isActive} />;
              case 'LineChart':
                return <LineChartWidget metric={item} timeFilter={timeFilter} drag={handleDrag} isActive={isActive} />;
              case 'FunnelChart':
                return <FunnelChart metric={item} timeFilter={timeFilter} drag={handleDrag} isActive={isActive} />;
              default:
                return <MetricCard metric={item} timeFilter={timeFilter} drag={handleDrag} isActive={isActive} />;
            }
          })();
          return (
            <Pressable
              onPress={() => router.push(`/chart-detail?id=${item.id}&timeFilter=${timeFilter}`)}
              disabled={isActive}
              accessible
              accessibilityLabel={t('dashboard.viewDetailLabel').replace('{label}', item.label)}
              accessibilityRole="button"
            >
              {widget}
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 96 }}
        ListEmptyComponent={<DashboardEmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2DD4BF"
            colors={['#2DD4BF']}
          />
        }
      />

      {/* FAB — action wired in Phase 4 (T017) */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 4 }}
        accessible
        accessibilityLabel={t('dashboard.addMetricLabel')}
        accessibilityRole="button"
        onPress={() => {
          addMetricSheetRef.current?.snapToIndex(0);
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      <AddMetricSheet ref={addMetricSheetRef} onConfirm={handleAddMetric} />
    </SafeAreaView>
  );
}
