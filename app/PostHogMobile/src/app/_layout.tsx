import '../../global.css';

import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { Stack, useRouter, useSegments } from 'expo-router';

import { POSTHOG_REACT_QUERY_CACHE_KEY } from '../constants';
import { AuthProvider, useAuth, LocaleProvider, ThemeProvider } from '../hooks';

// ─── TanStack Query setup ─────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 1h default (constitution)
      gcTime: 24 * 60 * 60 * 1000, // 24h — must be ≥ persister maxAge
      retry: 1,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: POSTHOG_REACT_QUERY_CACHE_KEY,
});

// ─── Inner layout — consume el contexto de AuthProvider ──────────────────────

function RootLayoutNav() {
  const { hasApiKey, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Esperar carga inicial de SecureStore

    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs = segments[0] === '(tabs)';
    const inStandaloneScreen =
      segments[0] === 'edit-chart' || segments[0] === 'chart-detail';

    if (!hasApiKey && !inOnboarding) {
      router.replace('/(onboarding)/api-key');
    } else if (hasApiKey && !inTabs && !inOnboarding && !inStandaloneScreen) {
      router.replace('/(tabs)/dashboard');
    }
  }, [hasApiKey, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background dark:bg-[#0D0D0D] items-center justify-center">
        <ActivityIndicator size="large" color="#2DD4BF" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

// ─── Root layout — provee QueryClient y AuthProvider al árbol completo ────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <AuthProvider>
          <LocaleProvider>
            <ThemeProvider>
              <RootLayoutNav />
            </ThemeProvider>
          </LocaleProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
