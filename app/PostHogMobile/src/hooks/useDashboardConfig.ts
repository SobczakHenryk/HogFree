import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { DASHBOARD_METRICS_CONFIG_KEY } from '../constants';
import type { DashboardMetric } from '../types';

type NewMetricInput = Pick<DashboardMetric, 'eventName' | 'label' | 'chartType'> & {
  funnelEvents?: string[];
  math?: DashboardMetric['math'];
  breakdownProperty?: string;
  barChartMode?: DashboardMetric['barChartMode'];
  lineChartMode?: DashboardMetric['lineChartMode'];
};

/**
 * Gestiona la configuración del dashboard (lista de métricas) en AsyncStorage.
 * Provee read, addMetric y removeMetric con persistencia automática.
 */
export function useDashboardConfig() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const reload = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(DASHBOARD_METRICS_CONFIG_KEY);
      if (value) setMetrics(JSON.parse(value) as DashboardMetric[]);
    } catch {
      // Keep current state on failure
    }
  }, []);

  // Carga inicial desde AsyncStorage
  useEffect(() => {
    reload().finally(() => setIsLoading(false));
  }, [reload]);

  const persist = useCallback(async (updated: DashboardMetric[]) => {
    await AsyncStorage.setItem(DASHBOARD_METRICS_CONFIG_KEY, JSON.stringify(updated));
    setMetrics(updated);
  }, []);

  const addMetric = useCallback(
    async (input: NewMetricInput) => {
      const newMetric: DashboardMetric = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        eventName: input.eventName,
        label: input.label,
        chartType: input.chartType,
        addedAt: new Date().toISOString(),
        position: metrics.length,
        ...(input.funnelEvents ? { funnelEvents: input.funnelEvents } : {}),
        ...(input.math !== undefined ? { math: input.math } : {}),
        ...(input.breakdownProperty ? { breakdownProperty: input.breakdownProperty } : {}),
        ...(input.barChartMode ? { barChartMode: input.barChartMode } : {}),
        ...(input.lineChartMode ? { lineChartMode: input.lineChartMode } : {}),
      };
      await persist([...metrics, newMetric]);
    },
    [metrics, persist],
  );

  const updateMetric = useCallback(
    async (id: string, changes: Partial<Pick<DashboardMetric, 'label' | 'eventName' | 'math' | 'breakdownProperty' | 'barChartMode' | 'displayName'>>) => {
      const updated = metrics.map((m) =>
        m.id === id ? { ...m, ...changes } : m,
      );
      await persist(updated);
    },
    [metrics, persist],
  );

  const removeMetric = useCallback(
    async (id: string) => {
      const updated = metrics
        .filter((m) => m.id !== id)
        .map((m, idx) => ({ ...m, position: idx }));
      queryClient.removeQueries({ queryKey: ['metric', id] });
      await persist(updated);
    },
    [metrics, persist, queryClient],
  );

  const reorderMetrics = useCallback(
    async (reordered: DashboardMetric[]) => {
      const updated = reordered.map((m, idx) => ({ ...m, position: idx }));
      await persist(updated);
    },
    [persist],
  );

  return { metrics, isLoading, addMetric, updateMetric, removeMetric, reorderMetrics, reload };
}
