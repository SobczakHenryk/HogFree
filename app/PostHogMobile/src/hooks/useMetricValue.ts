import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEY } from '../constants';
import { queryMetricValue } from '../services/posthog-api';
import type { MetricValue, PostHogCloud, TimeFilter } from '../types';
import { useProjectInfo } from './useProjectInfo';

export const METRIC_QUERY_STALE_TIME = Infinity;
export const METRIC_QUERY_GC_TIME = 24 * 60 * 60 * 1000;

export function getMetricQueryKey(
  cloudRegion: PostHogCloud | undefined,
  metricId: string,
  timeFilter: TimeFilter,
  math?: string,
) {
  return ['metric', cloudRegion, metricId, timeFilter, math ?? 'total'] as const;
}

/**
 * Obtiene el valor (conteo) de una métrica para el período activo.
 *
 * Cache: staleTime Infinity — nunca se considera stale; solo se actualiza
 * explícitamente via pull-to-refresh o cuando el período aún no tiene cache.
 * gcTime: 24h — persiste entre sesiones via PersistQueryClientProvider.
 *
 * Seguridad: la API Key se lee de SecureStore dentro de queryFn y no se
 * almacena en estado de React.
 */
export function useMetricValue(metricId: string, eventName: string, timeFilter: TimeFilter, math?: string) {
  const { projectInfo } = useProjectInfo();

  return useQuery<MetricValue>({
    queryKey: getMetricQueryKey(projectInfo?.cloudRegion, metricId, timeFilter, math),
    queryFn: async () => {
      const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!apiKey) throw new Error('No API key available');
      if (!projectInfo) throw new Error('No project info available');
      return queryMetricValue(apiKey, projectInfo.cloudRegion, projectInfo.id, eventName, timeFilter, { math }, projectInfo.selfHostedUrl);
    },
    enabled: !!projectInfo,
    staleTime: METRIC_QUERY_STALE_TIME,
    gcTime: METRIC_QUERY_GC_TIME,
  });
}
