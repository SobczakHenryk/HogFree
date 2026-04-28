import AsyncStorage from '@react-native-async-storage/async-storage';
import { HTTPError, TimeoutError } from 'ky';

import { API_KEY_ERRORS, POSTHOG_PROJECT_INFO_KEY } from '../constants';
import type { ApiKeyError, PostHogCloud, PostHogProjectInfo } from '../types';
import { NO_ACCESSIBLE_PROJECTS_ERROR, getProjects } from './posthog-api';

/**
 * Valida una API Key contra la API de PostHog.
 *
 * @param key - Clave ya trimmed y con formato válido (/^ph(?:x|c)_[A-Za-z0-9]{10,}$/)
 * @returns PostHogProjectInfo del primer proyecto accesible
 * @throws ApiKeyError — nunca lanza excepciones genéricas al exterior
 *
 * Seguridad: el valor de `key` nunca se loguea. Solo se registra el código de resultado.
 */
export async function validateApiKey(
  key: string,
  cloudRegion: PostHogCloud,
  selfHostedUrl?: string,
): Promise<PostHogProjectInfo> {
  try {
    return await getProjects(key, cloudRegion, selfHostedUrl);
  } catch (error) {
    if (error instanceof TimeoutError) {
      const code = cloudRegion === 'self-hosted' ? 'INSTANCE_UNREACHABLE' : 'NETWORK_ERROR';
      const message = cloudRegion === 'self-hosted' ? API_KEY_ERRORS.INSTANCE_UNREACHABLE : API_KEY_ERRORS.NETWORK_ERROR;
      throw { code, message } satisfies ApiKeyError;
    }

    if (error instanceof HTTPError) {
      const responseStatus = (error as HTTPError).response.status;

      if (responseStatus === 401) {
        throw { code: 'INVALID_KEY', message: API_KEY_ERRORS.INVALID_KEY } satisfies ApiKeyError;
      }
      if (responseStatus === 403) {
        throw {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: API_KEY_ERRORS.INSUFFICIENT_PERMISSIONS,
        } satisfies ApiKeyError;
      }
      if (cloudRegion === 'self-hosted' && responseStatus === 404) {
        throw {
          code: 'NOT_POSTHOG_INSTANCE',
          message: API_KEY_ERRORS.NOT_POSTHOG_INSTANCE,
        } satisfies ApiKeyError;
      }
      throw { code: 'SERVER_ERROR', message: API_KEY_ERRORS.SERVER_ERROR } satisfies ApiKeyError;
    }

    if (error instanceof Error && error.message === NO_ACCESSIBLE_PROJECTS_ERROR) {
      throw {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: API_KEY_ERRORS.INSUFFICIENT_PERMISSIONS,
      } satisfies ApiKeyError;
    }

    // TypeError, NetworkError u otros errores de red
    if (cloudRegion === 'self-hosted') {
      throw { code: 'INSTANCE_UNREACHABLE', message: API_KEY_ERRORS.INSTANCE_UNREACHABLE } satisfies ApiKeyError;
    }
    throw { code: 'NETWORK_ERROR', message: API_KEY_ERRORS.NETWORK_ERROR } satisfies ApiKeyError;
  }
}

/**
 * Obtiene el proyecto PostHog del usuario y lo persiste en AsyncStorage.
 * Se llama después de una validación de API Key exitosa.
 * Falla silenciosamente — no bloquea el flujo de autenticación.
 *
 * Seguridad: el valor de `apiKey` nunca se loguea.
 */
export async function fetchAndSaveProjectInfo(
  apiKey: string,
  cloudRegion: PostHogCloud,
  selfHostedUrl?: string,
): Promise<void> {
  const projectInfo = await getProjects(apiKey, cloudRegion, selfHostedUrl);
  await AsyncStorage.setItem(POSTHOG_PROJECT_INFO_KEY, JSON.stringify(projectInfo));
}
