import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEY } from '../constants';
import { getEventDefinitions } from '../services/posthog-api';
import type { PostHogEvent } from '../types';
import { useProjectInfo } from './useProjectInfo';

/**
 * Obtiene los tipos de eventos del proyecto PostHog ordenados por volumen.
 * Se usa en el paso 1 de AddMetricSheet para que el usuario elija un evento.
 *
 * Cache: staleTime 5min — los event definitions no cambian frecuentemente.
 * gcTime: 30min.
 */
export function useEventDefinitions(): {
  events: PostHogEvent[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { projectInfo } = useProjectInfo();

  const { data, isLoading, isError, refetch } = useQuery<PostHogEvent[]>({
    queryKey: ['event_definitions', projectInfo?.cloudRegion, projectInfo?.id],
    queryFn: async () => {
      const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!apiKey) throw new Error('No API key available');
      if (!projectInfo) throw new Error('No project info available');
      return getEventDefinitions(apiKey, projectInfo.cloudRegion, projectInfo.id, projectInfo.selfHostedUrl);
    },
    enabled: !!projectInfo,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    events: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}
