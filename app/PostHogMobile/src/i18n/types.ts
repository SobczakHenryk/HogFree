export type Locale = 'es' | 'en';

export const DEFAULT_LOCALE: Locale = 'es';
export const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'] as const;

export interface TranslationCatalog {
  common: {
    cancel: string;
    delete: string;
    back: string;
    save: string;
    confirm: string;
    retry: string;
    continue: string;
    add: string;
    adding: string;
    change: string;
    name: string;
    event: string;
  };
  tabs: {
    dashboard: string;
    settings: string;
  };
  dashboard: {
    title: string;
    cacheError: string;
    addMetricLabel: string;
    viewDetailLabel: string;
  };
  settings: {
    title: string;
    apiKeySection: string;
    apiKeyActive: string;
    deleteApiKeyTitle: string;
    deleteApiKeyMessage: string;
    cancelChangeLabel: string;
    confirmKeyLabel: string;
    changeKeyLabel: string;
    deleteKeyLabel: string;
    newKeyPlaceholder: string;
    languageSection: string;
    languageSpanish: string;
    languageEnglish: string;
    donationSection: string;
    donationDescription: string;
    donationLabel: string;
    donationFallback: string;
    instanceUrl: string;
    keyCopied: string;
    supportDeveloper: string;
    preferencesSection: string;
    darkMode: string;
    themeSection: string;
    themeSystem: string;
    themeLight: string;
    themeDark: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    placeholder: string;
    saveLabel: string;
    helpText: string;
  };
  chartDetail: {
    errorLoading: string;
    noData: string;
    dateRangeLabel: string;
    notFound: string;
    backLabel: string;
    editLabel: string;
    tapBarHint: string;
    updatedAgo: string;
  };
  editChart: {
    title: string;
    nameLabel: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    displayNameHint: string;
    eventLabel: string;
    aggregationLabel: string;
    breakdownLabel: string;
    modeLabel: string;
    totalEvents: string;
    uniqueUsers: string;
    namePlaceholder: string;
    noBreakdown: string;
    deleteTitle: string;
    deleteMessage: string;
    notFound: string;
    backLabel: string;
    selectEvent: string;
    searchEvent: string;
    funnelEditInfo: string;
    chartTypeLabel: string;
    stacked: string;
    normal: string;
    searchProperty: string;
    loadingEvents: string;
    noEventsFound: string;
    loadingProperties: string;
    noProperties: string;
    eventVolume: string;
    breakdownPropertyTitle: string;
  };
  addMetric: {
    stepAddTitle: string;
    stepChartTypeTitle: string;
    stepBarConfigTitle: string;
    stepLineConfigTitle: string;
    stepFunnelTitle: string;
    stepAddDescription: string;
    stepChartTypeDescription: string;
    stepBarConfigDescription: string;
    stepLineConfigDescription: string;
    stepFunnelDescription: string;
    searchEvent: string;
    eventsLoadError: string;
    chartMetricCardDescription: string;
    chartBarChartDescription: string;
    chartLineChartDescription: string;
    chartFunnelChartDescription: string;
    visualizationName: string;
    breakdownOptional: string;
    noBreakdown: string;
    searchProperty: string;
    noProperties: string;
    lineModeLine: string;
    lineModeCumulative: string;
    lineChartTypeLabel: string;
    funnelNamePlaceholder: string;
    funnelNameLabel: string;
    addStep: string;
    stepsCounter: string;
    searchFunnelEvent: string;
    noEventsFound: string;
    last30Days: string;
    addFunnelButton: string;
    modeLabel: string;
  };
  apiKeyField: {
    hideKeyLabel: string;
    showKeyLabel: string;
  };
  cloudRegion: {
    label: string;
    selectLabel: string;
  };
  emptyState: {
    title: string;
    description: string;
  };
  metricCard: {
    errorText: string;
    updatedAgo: string;
  };
  charts: {
    errorLoading: string;
    noData: string;
    stacked: string;
    normal: string;
  };
  funnel: {
    description: string;
    errorLoading: string;
    noData: string;
    conversionPercent: string;
    lost: string;
    totalConversion: string;
  };
  timeFilter: {
    today: string;
    yesterday: string;
    '7d': string;
    '15d': string;
    '30d': string;
    '90d': string;
    '180d': string;
    all: string;
  };
  errors: {
    emptyApiKey: string;
    invalidFormat: string;
    invalidKey: string;
    insufficientPermissions: string;
    networkError: string;
    serverError: string;
    secureStoreUnavailable: string;
  };
  selfHosted: {
    label: string;
    placeholder: string;
    errors: {
      emptyUrl: string;
      invalidFormat: string;
      httpsRequired: string;
      credentialsNotAllowed: string;
      invalidUrl: string;
      instanceUnreachable: string;
      notPosthogInstance: string;
    };
  };
}

type FlattenKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? FlattenKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

export type TranslationKey = FlattenKeys<TranslationCatalog>;

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}
