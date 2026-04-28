import ky from 'ky';
import { format, subDays } from 'date-fns';

import { FUNNEL_QUERY_TIMEOUT_MS, VALIDATION_TIMEOUT_MS, getPostHogApiHost } from '../constants';
import type { BreakdownSeries, BreakdownSeriesItem, FunnelResult, MetricSeries, MetricValue, PostHogCloud, PostHogEvent, PostHogProjectInfo, PostHogProperty, TimeFilter, TimeSeriesDataPoint } from '../types';
import { TIME_FILTER_TO_INTERVAL } from '../constants';

export const NO_ACCESSIBLE_PROJECTS_ERROR = 'NO_ACCESSIBLE_PROJECTS';

// ─── Date range helpers ───────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function getDateRange(filter: TimeFilter): { date_from: string; date_to: string } {
  const today = new Date();
  const todayStr = formatDate(today);

  switch (filter) {
    case 'today':
      return { date_from: todayStr, date_to: todayStr };
    case 'yesterday': {
      const yesterday = formatDate(subDays(today, 1));
      return { date_from: yesterday, date_to: yesterday };
    }
    case '7d':
      return { date_from: formatDate(subDays(today, 7)), date_to: todayStr };
    case '15d':
      return { date_from: formatDate(subDays(today, 15)), date_to: todayStr };
    case '30d':
      return { date_from: formatDate(subDays(today, 30)), date_to: todayStr };
    case '90d':
      return { date_from: formatDate(subDays(today, 90)), date_to: todayStr };
    case '180d':
      return { date_from: formatDate(subDays(today, 180)), date_to: todayStr };
    case 'all':
      return { date_from: 'all', date_to: todayStr };
  }
}

// ─── Response shapes (internal) ──────────────────────────────────────────────

interface ProjectsResponse {
  count: number;
  results: Array<{ id: number; name: string }>;
}

interface EventDefinitionsResponse {
  count: number;
  results: Array<{ name: string; volume_30_day: number | null }>;
}

interface QueryResponse {
  results: Array<{ aggregated_value: number }>;
  last_refresh: string | null;
}

interface TrendsSeriesResponse {
  results: Array<{
    data: number[];
    days?: string[];
    labels: string[];
    count: number;
  }>;
  last_refresh: string | null;
}

interface PropertyDefinitionsResponse {
  count: number;
  results: Array<{ name: string; property_type: string | null }>;
}

interface BreakdownTrendsResponse {
  results: Array<{
    data: number[];
    days?: string[];
    labels: string[];
    count: number;
    breakdown_value: string;
  }>;
  last_refresh: string | null;
}

interface FunnelQueryResponse {
  results: Array<Array<{
    name: string;
    count: number;
    order: number;
  }>>;
  last_refresh: string | null;
}

export type QueryRefreshMode = 'blocking' | 'force_blocking';

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Obtiene los proyectos accesibles con la API Key.
 * Se llama una vez dopo de la validación de la clave.
 *
 * @throws Error si no hay proyectos o falla la red — caller debe manejar
 */
export async function getProjects(
  apiKey: string,
  cloudRegion: PostHogCloud,
  selfHostedUrl?: string,
): Promise<PostHogProjectInfo> {
  const apiHost = getPostHogApiHost(cloudRegion, selfHostedUrl);

  const data = await ky
    .get(`${apiHost}/api/projects/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: VALIDATION_TIMEOUT_MS,
      retry: 0,
    })
    .json<ProjectsResponse>();

  if (!data.results.length) {
    throw new Error(NO_ACCESSIBLE_PROJECTS_ERROR);
  }

  const { id, name } = data.results[0];
  return { id, name, cloudRegion, ...(selfHostedUrl ? { selfHostedUrl } : {}) };
}

/**
 * Obtiene los tipos de eventos disponibles en el proyecto.
 * Ordenados por volumen descendente (más populares primero).
 */
export async function getEventDefinitions(
  apiKey: string,
  cloudRegion: PostHogCloud,
  projectId: number,
  selfHostedUrl?: string,
): Promise<PostHogEvent[]> {
  const apiHost = getPostHogApiHost(cloudRegion, selfHostedUrl);

  const data = await ky
    .get(`${apiHost}/api/projects/${projectId}/event_definitions/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      searchParams: { limit: '200', ordering: '-volume_30_day' },
      timeout: VALIDATION_TIMEOUT_MS,
      retry: 0,
    })
    .json<EventDefinitionsResponse>();

  return data.results.map((item: EventDefinitionsResponse['results'][number]) => ({
    name: item.name,
    volume30Day: item.volume_30_day,
  }));
}

/**
 * Obtiene las definiciones de propiedades para un evento específico.
 * Ordenadas alfabéticamente por nombre.
 */
export async function getPropertyDefinitions(
  apiKey: string,
  cloudRegion: PostHogCloud,
  projectId: number,
  eventName: string,
  selfHostedUrl?: string,
): Promise<PostHogProperty[]> {
  const apiHost = getPostHogApiHost(cloudRegion, selfHostedUrl);

  const data = await ky
    .get(`${apiHost}/api/projects/${projectId}/property_definitions/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      searchParams: {
        event_names: JSON.stringify([eventName]),
        filter_by_event_names: 'true',
        type: 'event',
        limit: '100',
      },
      timeout: VALIDATION_TIMEOUT_MS,
      retry: 0,
    })
    .json<PropertyDefinitionsResponse>();

  return data.results
    .map((item: PropertyDefinitionsResponse['results'][number]) => ({
      name: item.name,
      propertyType: item.property_type ?? 'String',
    }))
    .sort((a: PostHogProperty, b: PostHogProperty) => a.name.localeCompare(b.name));
}

/**
 * Consulta el valor agregado (conteo) de un evento para un período de tiempo.
 * Usa BoldNumber display para obtener un único número total.
 */
export async function queryMetricValue(
  apiKey: string,
  cloudRegion: PostHogCloud,
  projectId: number,
  eventName: string,
  timeFilter: TimeFilter,
  options?: { refresh?: QueryRefreshMode; math?: string },
  selfHostedUrl?: string,
): Promise<MetricValue> {
  const apiHost = getPostHogApiHost(cloudRegion, selfHostedUrl);
  const { date_from, date_to } = getDateRange(timeFilter);

  const data = await ky
    .post(`${apiHost}/api/projects/${projectId}/query/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      json: {
        refresh: options?.refresh ?? 'blocking',
        query: {
          kind: 'TrendsQuery',
          series: [{ event: eventName, kind: 'EventsNode', math: options?.math ?? 'total' }],
          dateRange: { date_from, date_to },
          trendsFilter: { display: 'BoldNumber' },
        },
      },
      timeout: VALIDATION_TIMEOUT_MS,
      retry: 0,
    })
    .json<QueryResponse>();

  return {
    count: data.results[0]?.aggregated_value ?? 0,
    lastRefreshedAt: data.last_refresh ?? new Date().toISOString(),
  };
}

/**
 * Consulta la serie temporal (conteo por intervalo) de un evento para un período.
 * Usa TrendsQuery sin BoldNumber display para obtener datos diarios/semanales/mensuales.
 */
export async function queryMetricSeries(
  apiKey: string,
  cloudRegion: PostHogCloud,
  projectId: number,
  eventName: string,
  timeFilter: TimeFilter,
  options?: { refresh?: QueryRefreshMode; math?: string },
  selfHostedUrl?: string,
): Promise<MetricSeries> {
  const apiHost = getPostHogApiHost(cloudRegion, selfHostedUrl);
  const { date_from, date_to } = getDateRange(timeFilter);
  const interval = TIME_FILTER_TO_INTERVAL[timeFilter];

  const data = await ky
    .post(`${apiHost}/api/projects/${projectId}/query/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      json: {
        refresh: options?.refresh ?? 'blocking',
        query: {
          kind: 'TrendsQuery',
          series: [{ event: eventName, kind: 'EventsNode', math: options?.math ?? 'total' }],
          dateRange: { date_from, date_to },
          interval,
        },
      },
      timeout: VALIDATION_TIMEOUT_MS,
      retry: 0,
    })
    .json<TrendsSeriesResponse>();

  const result = data.results[0];
  if (!result) {
    return { dataPoints: [], total: 0, lastRefreshedAt: data.last_refresh ?? new Date().toISOString() };
  }

  const dates = result.days ?? result.labels;

  return {
    dataPoints: dates.map((date: string, i: number) => ({ date, count: result.data[i] ?? 0 })),
    total: result.count,
    lastRefreshedAt: data.last_refresh ?? new Date().toISOString(),
  };
}

/**
 * Consulta la serie temporal con breakdown por propiedad de evento.
 * Devuelve múltiples series (una por valor de propiedad), top 5 + "Otros".
 */
export async function queryBreakdownSeries(
  apiKey: string,
  cloudRegion: PostHogCloud,
  projectId: number,
  eventName: string,
  timeFilter: TimeFilter,
  breakdownProperty: string,
  options?: { refresh?: QueryRefreshMode; math?: string },
  selfHostedUrl?: string,
): Promise<BreakdownSeries> {
  const apiHost = getPostHogApiHost(cloudRegion, selfHostedUrl);
  const { date_from, date_to } = getDateRange(timeFilter);
  const interval = TIME_FILTER_TO_INTERVAL[timeFilter];

  const data = await ky
    .post(`${apiHost}/api/projects/${projectId}/query/`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      json: {
        refresh: options?.refresh ?? 'blocking',
        query: {
          kind: 'TrendsQuery',
          series: [{ event: eventName, kind: 'EventsNode', math: options?.math ?? 'total' }],
          dateRange: { date_from, date_to },
          interval,
          breakdownFilter: {
            breakdown: breakdownProperty,
            breakdown_type: 'event',
          },
        },
      },
      timeout: VALIDATION_TIMEOUT_MS,
      retry: 0,
    })
    .json<BreakdownTrendsResponse>();

  const lastRefreshedAt = data.last_refresh ?? new Date().toISOString();

  if (!data.results.length) {
    return { items: [], lastRefreshedAt };
  }

  // Parse all breakdown series
  const allItems: BreakdownSeriesItem[] = data.results.map((result: BreakdownTrendsResponse['results'][number]) => {
    const dates = result.days ?? result.labels;
    const dataPoints: TimeSeriesDataPoint[] = dates.map((date: string, i: number) => ({
      date,
      count: result.data[i] ?? 0,
    }));
    return {
      breakdownValue: String(result.breakdown_value ?? 'Unknown'),
      dataPoints,
      total: result.count,
    };
  });

  // Sort by total desc
  allItems.sort((a, b) => b.total - a.total);

  // Top 5 + aggregate rest as "Otros"
  const MAX_BREAKDOWN_VALUES = 5;
  if (allItems.length <= MAX_BREAKDOWN_VALUES) {
    return { items: allItems, lastRefreshedAt };
  }

  const top = allItems.slice(0, MAX_BREAKDOWN_VALUES);
  const rest = allItems.slice(MAX_BREAKDOWN_VALUES);

  // Aggregate "Otros" by summing dataPoints at each index
  const dateCount = top[0].dataPoints.length;
  const othersDataPoints: TimeSeriesDataPoint[] = [];
  for (let i = 0; i < dateCount; i++) {
    let sum = 0;
    for (const item of rest) {
      sum += item.dataPoints[i]?.count ?? 0;
    }
    othersDataPoints.push({ date: top[0].dataPoints[i].date, count: sum });
  }
  const othersTotal = rest.reduce((acc, item) => acc + item.total, 0);

  top.push({
    breakdownValue: 'Otros',
    dataPoints: othersDataPoints,
    total: othersTotal,
  });

  return { items: top, lastRefreshedAt };
}

/**
 * Consulta un insight de tipo Funnel para una lista ordenada de eventos (máx. 10).
 * Usa FunnelsQuery para obtener el conteo por paso y calcular conversiones.
 */
export async function queryFunnelInsight(
  apiKey: string,
  cloudRegion: PostHogCloud,
  projectId: number,
  events: string[],
  timeFilter: TimeFilter,
  options?: { refresh?: QueryRefreshMode },
  selfHostedUrl?: string,
): Promise<FunnelResult> {
  const apiHost = getPostHogApiHost(cloudRegion, selfHostedUrl);
  const { date_from, date_to } = getDateRange(timeFilter);

  let response;
  try {
    response = await ky
      .post(`${apiHost}/api/projects/${projectId}/query/`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        json: {
          refresh: options?.refresh ?? 'blocking',
          query: {
            kind: 'FunnelsQuery',
            series: events.map((event) => ({ kind: 'EventsNode', event })),
            dateRange: { date_from, date_to },
            funnelsFilter: { funnelOrderType: 'ordered', funnelVizType: 'steps' },
          },
        },
        timeout: FUNNEL_QUERY_TIMEOUT_MS,
        retry: 0,
      })
      .json();
  } catch (err: unknown) {
    if (err != null && typeof err === 'object' && 'response' in err) {
      const httpErr = err as { response: { status: number; json: () => Promise<unknown> } };
      let detail = `HTTP ${httpErr.response.status}`;
      try {
        const body = (await httpErr.response.json()) as Record<string, unknown>;
        detail += `: ${body?.detail ?? body?.error ?? JSON.stringify(body).slice(0, 200)}`;
      } catch { /* body not json */ }
      throw new Error(detail);
    }
    throw err;
  }

  // Defensive: handle both response shapes from PostHog FunnelsQuery API
  // Shape A (array of arrays): { results: [[step1, step2, ...]] }
  // Shape B (flat array):       { results: [step1, step2, ...] }
  const data = response as Record<string, unknown>;
  const resultsRaw = data.results ?? data.result;

  let stepsRaw: Array<Record<string, unknown>> = [];
  if (Array.isArray(resultsRaw) && resultsRaw.length > 0) {
    const first = resultsRaw[0];
    if (Array.isArray(first)) {
      // Shape A: results[0] is the array of steps
      stepsRaw = first as Array<Record<string, unknown>>;
    } else if (first != null && typeof first === 'object' && 'order' in (first as object)) {
      // Shape B: results itself is the flat array of steps
      stepsRaw = resultsRaw as Array<Record<string, unknown>>;
    }
  }

  const steps = stepsRaw.map((step) => ({
    name: String(step.name ?? step.custom_name ?? 'Unknown'),
    count: Number(step.count ?? 0),
    order: Number(step.order ?? 0),
  }));

  return {
    steps,
    lastRefreshedAt: String(data.last_refresh ?? new Date().toISOString()),
  };
}
