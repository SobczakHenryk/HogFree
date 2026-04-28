# Research: i18n — Soporte Multilenguaje (Español / Inglés)

**Feature**: 012-i18n-language-support  
**Date**: 2026-03-20

---

## Research Task 1: Enfoque de i18n para React Native / Expo

### Contexto

Necesitamos un sistema de traducciones para una app Expo SDK 54 / React Native 0.81.5 con ~200 strings estáticos en 2 idiomas (español e inglés). El sistema debe ser tipo-seguro (TypeScript strict mode), offline-first (sin descargas remotas), y permitir cambio inmediato de idioma sin reiniciar la app.

### Alternativas evaluadas

#### Opción A: i18next + react-i18next

- **Pros**: Estándar de facto en React/RN, interpolación avanzada, pluralización, namespaces.
- **Contras**: Dependencia pesada (~40KB gzip), complejidad innecesaria para 2 idiomas y ~200 strings. Requiere configuración de backend, detector, e inicialización async. API basada en strings sin type-safety nativo (requiere wrappers adicionales o `i18next-typescript` plugin).
- **Veredicto**: Over-engineering para este caso.

#### Opción B: expo-localization + custom lightweight solution

- **Pros**: `expo-localization` ya está en el ecosistema Expo (compatible SDK 54, Fabric/JSI). Provee `getLocales()` para detectar idioma del dispositivo. El sistema custom de catálogos TypeScript ofrece **type-safety total**: autocompletado de keys, errores en compile-time si falta una traducción. Cero dependencias extra de runtime además de expo-localization (~2KB). Patrón de Context + hook sigue la convención existente del proyecto (AuthProvider/useAuth).
- **Contras**: No tiene pluralización automática (no necesaria para este scope). Si se necesitan más de 5 idiomas en el futuro, evaluar migración a i18next.
- **Veredicto**: ✅ **Elegida**. Mínima complejidad, máxima type-safety, alineada con la constitución.

#### Opción C: react-intl (FormatJS)

- **Pros**: Estándar ICU para mensajes, buen soporte de pluralización y formateo.
- **Contras**: Aún más pesado que i18next, orientado a web, API menos ergonómica en React Native.
- **Veredicto**: No adecuado para mobile-first.

### Decisión

**expo-localization + catálogos TypeScript + React Context**

- **Detección**: `expo-localization` → `getLocales()[0].languageCode` para obtener idioma del dispositivo.
- **Catálogos**: Objetos TypeScript planos en `src/i18n/locales/es.ts` y `en.ts`, tipados con `as const satisfies TranslationCatalog`.
- **Runtime**: React Context (`LocaleProvider`) en el root `_layout.tsx`, hook `useLocale()` expone `locale`, `setLocale()`, y función `t(key)`.
- **Persistencia**: `AsyncStorage` con key `APP_LOCALE_PREFERENCE` — solo se escribe cuando el usuario cambia manualmente.

**Rationale**: El proyecto ya usa AsyncStorage, React Context (AuthProvider), y hooks como patrón estándar. Esta solución no introduce ningún patrón nuevo y mantiene el bundle minimal.

---

## Research Task 2: expo-localization — Compatibilidad con Expo SDK 54

### Hallazgos

- `expo-localization` v16.x es la versión compatible con Expo SDK 54.
- API principal: `getLocales()` retorna `Locale[]` con `languageCode`, `regionCode`, etc.
- **No** requiere permisos nativos.
- Compatible con New Architecture (Fabric/JSI) — usa Expo Modules API.
- Se instala con `npx expo install expo-localization` para garantizar la versión correcta.
- Funciona en iOS, Android y web.

### Decisión

Instalar `expo-localization` vía `npx expo install`. Usar `getLocales()[0].languageCode` para la auto-detección.

---

## Research Task 3: Estructura de catálogos de traducción con type-safety

### Hallazgos

El enfoque óptimo para TypeScript strict mode con autocompletado:

1. **Tipo base**: Definir un tipo `TranslationCatalog` como un objeto anidado (por namespace/pantalla) con todas las keys.
2. **Catálogo español**: Es el catálogo "canónico" — define la forma del objeto.
3. **Catálogo inglés**: Debe satisfacer el mismo tipo — TypeScript obliga a que tenga todas las keys.
4. **Función `t(key)`**: Acepta un `keyof` de las keys aplanadas (dot notation: `'dashboard.title'`), retorna string.

### Estructura de namespaces propuesta

```typescript
// Namespaces basados en pantallas/componentes (alineado a la constitución)
{
  common: { ... },           // Compartido: "Cancelar", "Eliminar", "Volver", etc.
  tabs: { ... },             // Labels de tabs
  dashboard: { ... },        // Pantalla dashboard
  settings: { ... },         // Pantalla settings + selector idioma
  onboarding: { ... },       // Pantalla onboarding/api-key
  chartDetail: { ... },      // Pantalla chart-detail
  editChart: { ... },        // Pantalla edit-chart
  addMetric: { ... },        // Bottom sheet de añadir métrica
  apiKeyField: { ... },      // Componente ApiKeyField
  cloudRegion: { ... },      // Componente CloudRegionSelector
  emptyState: { ... },       // Componente DashboardEmptyState
  metricCard: { ... },       // Componente MetricCard
  charts: { ... },           // Compartido entre BarChart, LineChart, FunnelChart
  funnel: { ... },           // Específico de FunnelChart
  timeFilter: { ... },       // TimeFilterBar labels
  errors: { ... },           // API Key error messages (de constants/index.ts)
}
```

### Decisión

Usar namespaces planos (un nivel de anidación) organizados por pantalla/componente. El acceso es `t('dashboard.title')`, `t('common.cancel')`, etc. TypeScript valida en compile-time que toda key existe en ambos catálogos.

---

## Research Task 4: Persistencia de preferencia de idioma

### Hallazgos

- **AsyncStorage** ya está en el proyecto como dependencia directa (`@react-native-async-storage/async-storage`).
- La preferencia de idioma NO es dato sensible → no requiere SecureStore.
- Lógica de resolución del locale al iniciar:
  1. Leer `AsyncStorage.getItem('APP_LOCALE_PREFERENCE')`.
  2. Si existe y es `'es'` o `'en'` → usar ese valor (preferencia manual del usuario).
  3. Si no existe (primera apertura o nunca cambió manualmente) → `getLocales()[0].languageCode`.
  4. Si el idioma del dispositivo no es `'es'` ni `'en'` → fallback a `'es'`.
- Solo se escribe en AsyncStorage cuando el usuario cambia manualmente desde Settings (FR-002a).

### Decisión

Key de AsyncStorage: `APP_LOCALE_PREFERENCE`. Solo se escribe en `setLocale()` cuando viene del selector de Settings. La lógica de boot está en `LocaleProvider`.

---

## Research Task 5: Migración de TIME_FILTER_LABELS (constante estática → función dinámica)

### Hallazgos

`TIME_FILTER_LABELS` en `src/types/dashboard.ts` es actualmente un `Record<TimeFilter, string>` estático. Para i18n necesita depender de `t()`.

**Opciones**:
1. Convertir en función: `getTimeFilterLabels(t: TFunction) => Record<TimeFilter, string>`.
2. Mover los labels directamente a los catálogos y usar `t('timeFilter.today')` en el componente.

**Opción elegida**: Opción 2 — los labels van al catálogo y `TimeFilterBar` consume `t()` directamente. Se elimina `TIME_FILTER_LABELS` como export; el mapeo se hace inline en el componente. Esto es más simple y sigue el patrón de los demás componentes.

### Decisión

Mover TIME_FILTER_LABELS al catálogo de traducciones. TimeFilterBar usará `t('timeFilter.today')`, `t('timeFilter.7d')`, etc.

---

## Research Task 6: API_KEY_ERRORS — strings de error en constants/index.ts

### Hallazgos

`API_KEY_ERRORS` es un objeto con mensajes de error en español. Estos se usan en `useAuth.tsx` y se muestran en la UI.

**Enfoque**: Los mensajes de error se mueven al catálogo de traducciones bajo el namespace `errors`. `API_KEY_ERRORS` se convierte en un mapa de error-code → translation-key. Los hooks que establezcan errores usarán las keys del catálogo, y los componentes que muestren errores usarán `t(errorKey)`.

**Consideración**: `useAuth` establece el error como string. Cambiar a que almacene una translation key y que el componente renderice `t(error)`. Esto mantiene el hook agnóstico del idioma activo.

### Decisión

- `API_KEY_ERRORS` se transforma en un mapa `Record<string, string>` donde los valores son translation keys (e.g., `'errors.emptyApiKey'`).
- Los componentes que muestran errores usan `t(error)` para renderizar el mensaje traducido.
- El hook `useAuth` almacena la key de traducción, no el string ya traducido.

---

## Resumen de decisiones

| Aspecto | Decisión | Alternativa Rechazada |
|---|---|---|
| Librería i18n | Custom (Context + catálogos TS) | i18next (over-engineering), react-intl (web-oriented) |
| Detección de idioma | expo-localization `getLocales()` | Manual (no idiomatic) |
| Catálogos | TypeScript con `as const satisfies` | JSON (sin type-safety compile-time) |
| Persistencia | AsyncStorage key `APP_LOCALE_PREFERENCE` | SecureStore (innecesario para dato no sensible) |
| Estructura | Namespaces planos por pantalla/componente | Flat keys (difícil de mantener a escala) |
| TIME_FILTER_LABELS | Migrar al catálogo, usar `t()` directo | Función wrapper (indirección innecesaria) |
| API_KEY_ERRORS | Almacenar translation keys, renderizar con `t()` | Traducir en el hook (re-render al cambiar idioma) |
