import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEY } from '../constants';
import { queryFunnelInsight } from '../services/posthog-api';
import type { FunnelResult, PostHogCloud, TimeFilter } from '../types';
import { useProjectInfo } from './useProjectInfo';

export const FUNNEL_STALE_TIME = Infinity;
export const FUNNEL_GC_TIME = 24 * 60 * 60 * 1000;

export function getFunnelQueryKey(
  cloudRegion: PostHogCloud | undefined,
  metricId: string,
  timeFilter: TimeFilter,
) {
  return ['funnel', cloudRegion, metricId, timeFilter] as const;
}

/**
 * Obtiene el resultado de un Funnel insight para una lista ordenada de eventos.
 *
 * Cache: staleTime Infinity — se actualiza solo via pull-to-refresh.
 * gcTime: 24h — persiste entre sesiones via PersistQueryClientProvider.
 */
export function useFunnelInsight(
  metricId: string,
  events: string[],
  timeFilter: TimeFilter,
) {
  const { projectInfo } = useProjectInfo();

  return useQuery<FunnelResult>({
    queryKey: getFunnelQueryKey(projectInfo?.cloudRegion, metricId, timeFilter),
    queryFn: async () => {
      const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!apiKey) throw new Error('No API key available');
      if (!projectInfo) throw new Error('No project info available');
      return queryFunnelInsight(apiKey, projectInfo.cloudRegion, projectInfo.id, events, timeFilter, undefined, projectInfo.selfHostedUrl);
    },
    enabled: !!projectInfo && events.length >= 2,
    staleTime: FUNNEL_STALE_TIME,
    gcTime: FUNNEL_GC_TIME,
  });
}
