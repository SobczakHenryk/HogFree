# Quickstart: i18n — Soporte Multilenguaje

**Feature**: 012-i18n-language-support  
**Date**: 2026-03-20

---

## Prerequisitos

- Expo SDK 54 instalado y funcionando
- El proyecto compila y corre en iOS/Android

## Setup

### 1. Instalar expo-localization

```bash
cd app/PostHogMobile
npx expo install expo-localization
```

### 2. Crear el módulo i18n

Crear los siguientes archivos:

```
src/i18n/
├── types.ts              # Locale, TranslationCatalog, TranslationKey types
├── locales/
│   ├── es.ts             # Catálogo español (todos los strings actuales)
│   └── en.ts             # Catálogo inglés (traducciones)
├── LocaleProvider.tsx    # Context + hook useLocale
└── index.ts              # Re-exports
```

### 3. Integrar LocaleProvider en _layout.tsx

Envolver la navegación con `LocaleProvider` dentro del árbol existente de providers:

```tsx
// src/app/_layout.tsx
import { LocaleProvider } from '@/i18n';

// Dentro del render:
<AuthProvider>
  <LocaleProvider>
    <Stack ... />
  </LocaleProvider>
</AuthProvider>
```

### 4. Migrar strings en cada archivo

Para cada componente/pantalla, reemplazar strings hardcodeados con `t()`:

```tsx
// Antes:
<Text>Dashboard</Text>

// Después:
const { t } = useLocale();
<Text>{t('dashboard.title')}</Text>
```

### 5. Agregar selector de idioma en Settings

Añadir una sección en `settings.tsx` con dos opciones (Español/Inglés) que llaman a `setLocale()`.

## Verificación rápida

1. `npx expo start` → la app carga sin errores
2. La app muestra textos en español (igual que antes)
3. Ir a Settings → seleccionar English → todos los textos cambian
4. Cerrar y reabrir la app → sigue en English
5. Cambiar idioma del simulador a francés → reabrir app → sigue en English (preferencia manual)
6. Borrar datos de la app → reabrir con simulador en inglés → app en English (auto-detection)
7. Borrar datos → simulador en francés → app en Español (fallback)

## Archivos modificados (resumen)

| Archivo | Cambio |
|---|---|
| `src/i18n/*` | **NUEVO** — módulo completo de i18n |
| `src/app/_layout.tsx` | Agregar `LocaleProvider` wrapper |
| `src/app/(tabs)/_layout.tsx` | Tab labels con `t()` |
| `src/app/(tabs)/dashboard.tsx` | Strings → `t()` |
| `src/app/(tabs)/settings.tsx` | Strings → `t()` + selector de idioma |
| `src/app/(onboarding)/api-key.tsx` | Strings → `t()` |
| `src/app/chart-detail.tsx` | Strings → `t()` |
| `src/app/edit-chart.tsx` | Strings → `t()` |
| `src/components/AddMetricSheet.tsx` | Strings → `t()` |
| `src/components/ApiKeyField.tsx` | Strings → `t()` |
| `src/components/CloudRegionSelector.tsx` | Strings → `t()` |
| `src/components/BarChartWidget.tsx` | Strings → `t()` |
| `src/components/LineChartWidget.tsx` | Strings → `t()` |
| `src/components/FunnelChart.tsx` | Strings → `t()` |
| `src/components/DashboardEmptyState.tsx` | Strings → `t()` |
| `src/components/MetricCard.tsx` | Strings → `t()` |
| `src/components/TimeFilterBar.tsx` | Strings → `t()`, eliminar `TIME_FILTER_LABELS` import |
| `src/constants/index.ts` | `API_KEY_ERRORS` → translation keys |
| `src/types/dashboard.ts` | Eliminar `TIME_FILTER_LABELS` export |
| `src/hooks/index.ts` | Re-export `useLocale`, `LocaleProvider` |
