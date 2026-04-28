# Data Model: i18n — Soporte Multilenguaje

**Feature**: 012-i18n-language-support  
**Date**: 2026-03-20

---

## Entities

### 1. Locale

Identificador del idioma activo de la aplicación.

```typescript
// src/i18n/types.ts

type Locale = 'es' | 'en';

const DEFAULT_LOCALE: Locale = 'es';
const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'] as const;
```

| Campo | Tipo | Descripción |
|---|---|---|
| value | `'es' \| 'en'` | Código ISO 639-1 del idioma activo |

**Reglas de validación**:
- Solo se aceptan valores de `SUPPORTED_LOCALES`.
- Cualquier valor fuera del conjunto → fallback a `'es'`.

**Persistencia**:
- AsyncStorage key: `APP_LOCALE_PREFERENCE`
- Solo se escribe cuando el usuario cambia manualmente desde Settings.
- Si la key no existe en storage → se usa auto-detección del dispositivo.

**Resolución al iniciar la app** (orden de precedencia):
1. `AsyncStorage.getItem('APP_LOCALE_PREFERENCE')` → si es `'es'` o `'en'`, usar.
2. `getLocales()[0].languageCode` de expo-localization → si es `'es'` o `'en'`, usar.
3. Fallback → `'es'`.

---

### 2. TranslationCatalog

Estructura tipada que contiene todas las cadenas de texto de la UI organizadas por namespace.

```typescript
// src/i18n/types.ts

interface TranslationCatalog {
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
    viewDetailLabel: string; // template: "Ver detalle de {label}"
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
    languageSection: string;
    languageSpanish: string;
    languageEnglish: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    placeholder: string;
    saveLabel: string;
    helpText: string; // template: "...{cloud}..."
  };
  chartDetail: {
    errorLoading: string;
    noData: string;
    dateRangeLabel: string;
    notFound: string;
    backLabel: string;
    editLabel: string;
  };
  editChart: {
    title: string;
    nameLabel: string;
    eventLabel: string;
    aggregationLabel: string;
    breakdownLabel: string;
    modeLabel: string;
    totalEvents: string;
    uniqueUsers: string;
    namePlaceholder: string;
    noBreakdown: string;
    deleteTitle: string;   // template: "¿Eliminar \"{label}\"...?"
    deleteMessage: string;
    notFound: string;
    backLabel: string;
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
    chartMetricCard: string;
    chartBarChart: string;
    chartLineChart: string;
    chartFunnelChart: string;
    visualizationName: string;
    breakdownOptional: string;
    noBreakdown: string;
    searchProperty: string;
    noProperties: string;
    lineModeLine: string;
    lineModeCumulative: string;
    funnelNamePlaceholder: string;
    addStep: string;
    stepsCounter: string; // template: "{count} / 10 pasos"
    searchFunnelEvent: string;
  };
  apiKeyField: {
    hideKeyLabel: string;
    showKeyLabel: string;
  };
  cloudRegion: {
    label: string;
    selectLabel: string; // template: "Seleccionar {region}"
  };
  emptyState: {
    title: string;
    description: string;
  };
  metricCard: {
    errorText: string;
  };
  charts: {
    errorLoading: string;
    noData: string;
    stacked: string;
    normal: string;
  };
  funnel: {
    description: string; // template: "Funnel · {count} pasos"
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
}
```

**Reglas de validación**:
- Ambos catálogos (`es.ts`, `en.ts`) deben satisfacer el tipo `TranslationCatalog` en compile-time.
- Si se agrega una key al tipo, TypeScript fuerza a agregarla en ambos catálogos.
- Los templates con `{variable}` se resuelven en runtime con interpolación simple.

---

### 3. LocaleContextValue

State shape expuesta por el React Context.

```typescript
// src/i18n/types.ts

interface LocaleContextValue {
  /** Locale activo ('es' | 'en') */
  locale: Locale;
  /** Cambia el locale y persiste en AsyncStorage */
  setLocale: (locale: Locale) => void;
  /** Función de traducción — retorna el string traducido para la key dada */
  t: (key: TranslationKey) => string;
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| locale | `Locale` | Idioma activo actual |
| setLocale | `(locale: Locale) => void` | Cambia idioma y persiste en storage |
| t | `(key: TranslationKey) => string` | Busca la traducción para la key |

---

### 4. TranslationKey (derived type)

Tipo derivado automáticamente de `TranslationCatalog` para obtener todas las keys válidas en formato dot-notation.

```typescript
// src/i18n/types.ts

// Genera union type de todas las keys: 'common.cancel' | 'common.delete' | 'tabs.dashboard' | ...
type TranslationKey = {
  [NS in keyof TranslationCatalog]: `${NS & string}.${keyof TranslationCatalog[NS] & string}`;
}[keyof TranslationCatalog];
```

---

## State Transitions

### Locale Resolution (App Boot)

```
┌─────────────┐
│   App Start  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ Read AsyncStorage         │
│ 'APP_LOCALE_PREFERENCE'   │
└──────┬───────────────────┘
       │
       ├── Has valid value ('es'|'en') ──► Use stored locale
       │
       └── No value / invalid
           │
           ▼
    ┌──────────────────────┐
    │ expo-localization     │
    │ getLocales()[0]       │
    │ .languageCode         │
    └──────┬───────────────┘
           │
           ├── 'es' ──► locale = 'es'
           ├── 'en' ──► locale = 'en'
           └── other ──► locale = 'es' (fallback)
```

### Locale Change (User Action in Settings)

```
┌─────────────────────────┐
│ User taps language option│
│ in Settings selector     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ setLocale(newLocale)             │
│ 1. setState → triggers re-render │
│ 2. AsyncStorage.setItem(key,val) │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│ All t() calls resolve    │
│ from new catalog          │
│ → UI updates immediately  │
└─────────────────────────┘
```

---

## Relationships

```
LocaleProvider (Context)
    ├── owns → locale: Locale (state)
    ├── reads → AsyncStorage (persistence)
    ├── reads → expo-localization (device detection)
    ├── references → TranslationCatalog (es.ts | en.ts)
    └── exposes → useLocale() hook
                    ├── locale
                    ├── setLocale()
                    └── t(key) → string

TranslationCatalog
    ├── es.ts satisfies TranslationCatalog
    └── en.ts satisfies TranslationCatalog

TranslationKey (derived from TranslationCatalog)
    └── used by t() parameter type
```
