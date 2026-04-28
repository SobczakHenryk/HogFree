import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEY } from '../constants';
import { queryBreakdownSeries } from '../services/posthog-api';
import type { BreakdownSeries, TimeFilter } from '../types';
import { useProjectInfo } from './useProjectInfo';

export const BREAKDOWN_SERIES_STALE_TIME = Infinity;
export const BREAKDOWN_SERIES_GC_TIME = 24 * 60 * 60 * 1000;

export function useBreakdownSeries(
  metricId: string,
  eventName: string,
  timeFilter: TimeFilter,
  breakdownProperty: string | undefined,
  math?: string,
) {
  const { projectInfo } = useProjectInfo();

  return useQuery<BreakdownSeries>({
    queryKey: ['breakdown_series', projectInfo?.cloudRegion, metricId, timeFilter, math ?? 'total', breakdownProperty],
    queryFn: async () => {
      const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!apiKey) throw new Error('No API key available');
      if (!projectInfo) throw new Error('No project info available');
      if (!breakdownProperty) throw new Error('No breakdown property');
      return queryBreakdownSeries(apiKey, projectInfo.cloudRegion, projectInfo.id, eventName, timeFilter, breakdownProperty, { math }, projectInfo.selfHostedUrl);
    },
    enabled: !!breakdownProperty && !!projectInfo,
    staleTime: BREAKDOWN_SERIES_STALE_TIME,
    gcTime: BREAKDOWN_SERIES_GC_TIME,
  });
}
