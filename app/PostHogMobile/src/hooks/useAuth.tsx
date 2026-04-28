import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  API_KEY_ERRORS,
  API_KEY_REGEX,
  DEFAULT_POSTHOG_CLOUD,
  POSTHOG_CLOUD_KEY,
  POSTHOG_PROJECT_INFO_KEY,
  SECURE_STORE_KEY,
  SELF_HOSTED_URL_KEY,
  isPostHogCloud,
} from '../constants';
import { validateApiKey } from '../services/posthog';
import type { ApiKeyError, ApiKeyState, PostHogCloud } from '../types';
import { maskApiKey } from '../utils/apiKey';
import { validateSelfHostedUrl } from '../utils/url';

// ─── Public interface ────────────────────────────────────────────────────────

interface UseAuthReturn extends ApiKeyState {
  /** US-1 / US-3: Valida contra /api/me/ y, si es exitoso, guarda en SecureStore. */
  validateAndStore: (key: string, cloudRegion: PostHogCloud, selfHostedUrl?: string) => Promise<void>;
  /** US-3: Alias semántico de validateAndStore — reemplaza la clave existente. */
  updateApiKey: (key: string, cloudRegion: PostHogCloud, selfHostedUrl?: string) => Promise<void>;
  /** US-4: Elimina la clave de SecureStore. La confirmación es responsabilidad del componente. */
  deleteApiKey: () => Promise<void>;
  /** Limpia el error actual sin modificar el resto del estado. */
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<UseAuthReturn | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ApiKeyState>({
    hasApiKey: false,
    maskedValue: null,
    cloudRegion: DEFAULT_POSTHOG_CLOUD,
    selfHostedUrl: null,
    isLoading: true, // true hasta que la carga inicial de SecureStore termine
    error: null,
  });

  // Carga inicial — checks SecureStore al montar. El value completo se descarta
  // inmediatamente después de calcular maskedValue (nunca entra en el estado).
  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(SECURE_STORE_KEY),
      SecureStore.getItemAsync(POSTHOG_CLOUD_KEY),
      SecureStore.getItemAsync(SELF_HOSTED_URL_KEY),
    ])
      .then(([value, storedCloud, storedUrl]) => {
        const cloudRegion = isPostHogCloud(storedCloud) ? storedCloud : DEFAULT_POSTHOG_CLOUD;
        const selfHostedUrl = cloudRegion === 'self-hosted' ? (storedUrl ?? null) : null;

        if (value) {
          setState({
            hasApiKey: true,
            maskedValue: maskApiKey(value),
            cloudRegion,
            selfHostedUrl,
            isLoading: false,
            error: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            hasApiKey: false,
            cloudRegion,
            selfHostedUrl,
            isLoading: false,
          }));
        }
      })
      .catch(() => {
        // Si SecureStore falla en la lectura inicial, tratamos como sin clave.
        setState((prev) => ({ ...prev, cloudRegion: DEFAULT_POSTHOG_CLOUD, selfHostedUrl: null, isLoading: false }));
      });
  }, []);

  // ─── Lógica core compartida por validateAndStore y updateApiKey ───────────

  const _validateAndPersist = useCallback(async (key: string, cloudRegion: PostHogCloud, selfHostedUrl?: string) => {
    const trimmed = key.trim();

    // Validaciones locales (no requieren red)
    if (trimmed.length === 0) {
      setState((prev) => ({
        ...prev,
        error: { code: 'EMPTY', message: API_KEY_ERRORS.EMPTY },
      }));
      return;
    }

    if (!API_KEY_REGEX.test(trimmed)) {
      setState((prev) => ({
        ...prev,
        error: { code: 'INVALID_FORMAT', message: API_KEY_ERRORS.INVALID_FORMAT },
      }));
      return;
    }

    if (!isPostHogCloud(cloudRegion)) {
      setState((prev) => ({
        ...prev,
        error: { code: 'INVALID_FORMAT', message: API_KEY_ERRORS.INVALID_FORMAT },
      }));
      return;
    }

    // Validate self-hosted URL when applicable
    let sanitizedUrl: string | undefined;
    if (cloudRegion === 'self-hosted') {
      if (!selfHostedUrl) {
        setState((prev) => ({
          ...prev,
          error: { code: 'INVALID_URL', message: API_KEY_ERRORS.INVALID_URL },
        }));
        return;
      }
      const urlResult = validateSelfHostedUrl(selfHostedUrl);
      if (!urlResult.isValid) {
        setState((prev) => ({
          ...prev,
          error: { code: 'INVALID_URL', message: urlResult.errorKey ?? API_KEY_ERRORS.INVALID_URL },
        }));
        return;
      }
      sanitizedUrl = urlResult.sanitizedUrl!;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    let projectInfo;

    // Validación contra la API de PostHog usando un endpoint autenticado por proyecto
    try {
      projectInfo = await validateApiKey(trimmed, cloudRegion, sanitizedUrl);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err as ApiKeyError,
      }));
      return;
    }

    // Persistencia en SecureStore (solo si la validación fue exitosa)
    try {
      const storeOps = [
        SecureStore.setItemAsync(SECURE_STORE_KEY, trimmed),
        SecureStore.setItemAsync(POSTHOG_CLOUD_KEY, cloudRegion),
      ];
      if (sanitizedUrl) {
        storeOps.push(SecureStore.setItemAsync(SELF_HOSTED_URL_KEY, sanitizedUrl));
      } else {
        // Clean up self-hosted URL if switching to cloud
        storeOps.push(SecureStore.deleteItemAsync(SELF_HOSTED_URL_KEY));
      }
      await Promise.all(storeOps);
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'SECURE_STORE_UNAVAILABLE',
          message: API_KEY_ERRORS.SECURE_STORE_UNAVAILABLE,
        },
      }));
      return;
    }

    // Persistir project info para el dashboard — silencioso, no bloquea el auth
    try {
      await AsyncStorage.setItem(POSTHOG_PROJECT_INFO_KEY, JSON.stringify(projectInfo));
    } catch {
      // Non-critical: el dashboard cargará el project info en el próximo intento.
    }

    // Éxito: el value completo nunca se almacena en el estado de React
    setState({
      hasApiKey: true,
      maskedValue: maskApiKey(trimmed),
      cloudRegion,
      selfHostedUrl: sanitizedUrl ?? null,
      isLoading: false,
      error: null,
    });
  }, []);

  const validateAndStore = _validateAndPersist;
  const updateApiKey = _validateAndPersist;

  const deleteApiKey = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_STORE_KEY),
        SecureStore.deleteItemAsync(POSTHOG_CLOUD_KEY),
        SecureStore.deleteItemAsync(SELF_HOSTED_URL_KEY),
        AsyncStorage.removeItem(POSTHOG_PROJECT_INFO_KEY),
      ]);
      setState({
        hasApiKey: false,
        maskedValue: null,
        cloudRegion: DEFAULT_POSTHOG_CLOUD,
        selfHostedUrl: null,
        isLoading: false,
        error: null,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'SECURE_STORE_UNAVAILABLE',
          message: API_KEY_ERRORS.SECURE_STORE_UNAVAILABLE,
        },
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const contextValue: UseAuthReturn = {
    ...state,
    validateAndStore,
    updateApiKey,
    deleteApiKey,
    clearError,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
