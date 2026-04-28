import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { POSTHOG_PROJECT_INFO_KEY } from '../constants';
import type { PostHogProjectInfo } from '../types';

/**
 * Lee el PostHogProjectInfo guardado en AsyncStorage después de la validación de la API Key.
 * Retorna null mientras carga o si todavía no se ha guardado ningún proyecto.
 */
export function useProjectInfo(): { projectInfo: PostHogProjectInfo | null; isLoading: boolean } {
  const [projectInfo, setProjectInfo] = useState<PostHogProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(POSTHOG_PROJECT_INFO_KEY)
      .then((value) => {
        if (value) {
          setProjectInfo(JSON.parse(value) as PostHogProjectInfo);
        }
      })
      .catch(() => {
        // Si AsyncStorage falla, tratamos como sin project info.
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { projectInfo, isLoading };
}
