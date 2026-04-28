import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEY } from '../constants';
import { getPropertyDefinitions } from '../services/posthog-api';
import type { PostHogProperty } from '../types';
import { useProjectInfo } from './useProjectInfo';

export function usePropertyDefinitions(eventName: string) {
  const { projectInfo } = useProjectInfo();

  return useQuery<PostHogProperty[]>({
    queryKey: ['property_definitions', projectInfo?.cloudRegion, projectInfo?.id, eventName],
    queryFn: async () => {
      const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!apiKey) throw new Error('No API key available');
      if (!projectInfo) throw new Error('No project info available');
      return getPropertyDefinitions(apiKey, projectInfo.cloudRegion, projectInfo.id, eventName, projectInfo.selfHostedUrl);
    },
    enabled: !!eventName && !!projectInfo,
    staleTime: 5 * 60 * 1000,
  });
}
