import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEY } from '../constants';
import { queryMetricSeries } from '../services/posthog-api';
import type { MetricSeries, PostHogCloud, TimeFilter } from '../types';
import { useProjectInfo } from './useProjectInfo';

export const METRIC_SERIES_STALE_TIME = Infinity;
export const METRIC_SERIES_GC_TIME = 24 * 60 * 60 * 1000;

export function getMetricSeriesQueryKey(
  cloudRegion: PostHogCloud | undefined,
  metricId: string,
  timeFilter: TimeFilter,
  math?: string,
) {
  return ['metric_series', cloudRegion, metricId, timeFilter, math ?? 'total'] as const;
}

/**
 * Obtiene la serie temporal (conteo por intervalo) de un evento para el período activo.
 *
 * Cache: staleTime Infinity — se actualiza solo via pull-to-refresh.
 * gcTime: 24h — persiste entre sesiones via PersistQueryClientProvider.
 */
export function useMetricSeries(metricId: string, eventName: string, timeFilter: TimeFilter, math?: string) {
  const { projectInfo } = useProjectInfo();

  return useQuery<MetricSeries>({
    queryKey: getMetricSeriesQueryKey(projectInfo?.cloudRegion, metricId, timeFilter, math),
    queryFn: async () => {
      const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!apiKey) throw new Error('No API key available');
      if (!projectInfo) throw new Error('No project info available');
      return queryMetricSeries(apiKey, projectInfo.cloudRegion, projectInfo.id, eventName, timeFilter, { math }, projectInfo.selfHostedUrl);
    },
    enabled: !!projectInfo,
    staleTime: METRIC_SERIES_STALE_TIME,
    gcTime: METRIC_SERIES_GC_TIME,
  });
}
