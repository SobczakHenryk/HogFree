# Contract: useLocale Hook & LocaleProvider

**Feature**: 012-i18n-language-support  
**Date**: 2026-03-20

---

## Overview

`useLocale` es el hook público que expone el sistema de i18n a toda la aplicación. `LocaleProvider` es el Context Provider que gestiona el estado del locale y la resolución de traducciones.

---

## LocaleProvider

### Ubicación

`src/i18n/LocaleProvider.tsx`

### Props

```typescript
interface LocaleProviderProps {
  children: React.ReactNode;
}
```

### Comportamiento

1. **Inicialización (mount)**:
   - Lee `AsyncStorage.getItem('APP_LOCALE_PREFERENCE')`.
   - Si el valor es `'es'` o `'en'` → lo establece como locale activo.
   - Si no existe → lee `getLocales()[0].languageCode` de `expo-localization`.
   - Si el idioma del dispositivo es `'es'` o `'en'` → lo usa.
   - Si no → usa `'es'` (fallback).
   - Mientras resuelve → `locale` tiene el valor de fallback `'es'` (sin loading state visible).

2. **Renderizado**:
   - Envuelve `children` con el Context Provider.
   - Debe posicionarse **dentro** de `GestureHandlerRootView` y **fuera** de la navegación en `_layout.tsx`.
   - Posición en el árbol: `GestureHandler → PersistQueryClient → AuthProvider → LocaleProvider → Stack`.

### Placement in _layout.tsx

```tsx
<GestureHandlerRootView>
  <PersistQueryClientProvider ...>
    <AuthProvider>
      <LocaleProvider>
        <Stack ... />
      </LocaleProvider>
    </AuthProvider>
  </PersistQueryClientProvider>
</GestureHandlerRootView>
```

---

## useLocale Hook

### Ubicación

Definido en `src/i18n/LocaleProvider.tsx`, re-exportado desde `src/i18n/index.ts` y `src/hooks/index.ts`.

### Signature

```typescript
function useLocale(): LocaleContextValue;
```

### Return Type

```typescript
interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}
```

### Propiedades

| Propiedad | Tipo | Descripción |
|---|---|---|
| `locale` | `'es' \| 'en'` | Idioma activo actual. Reactivo — cambios triggean re-render. |
| `setLocale` | `(locale: Locale) => void` | Cambia el idioma activo. Persiste en AsyncStorage. Trigger re-render inmediato de todos los consumidores. |
| `t` | `(key: TranslationKey) => string` | Retorna la string traducida para la key dada en el locale activo. |

### Comportamiento de `setLocale(locale)`

1. Valida que `locale` esté en `SUPPORTED_LOCALES`.
2. Actualiza el estado interno del Context → provoca re-render de todos los componentes que consumen `useLocale()`.
3. Escribe `AsyncStorage.setItem('APP_LOCALE_PREFERENCE', locale)` de forma async (fire-and-forget — no bloquea la UI).

### Comportamiento de `t(key)`

1. Recibe una key en formato dot-notation (e.g., `'dashboard.title'`).
2. Selecciona el catálogo correspondiente al `locale` activo.
3. Resuelve `catalog[namespace][field]` y retorna el string.
4. Si la key no existe (imposible en compile-time con TypeScript estricto) → retorna la key misma como fallback de seguridad.

### Interpolación

Para strings con variables dinámicas, el componente es responsable de reemplazar placeholders:

```typescript
// Catálogo: "Ver detalle de {label}"
// Uso en componente:
t('dashboard.viewDetailLabel').replace('{label}', item.label)
```

Esto mantiene `t()` simple y tipado. No se necesita un sistema complejo de interpolación para ~5 templates en todo el proyecto.

### Error Handling

- `useLocale()` fuera de `LocaleProvider` → lanza Error (patrón estándar de Context hooks).
- `AsyncStorage` falla al leer → usa auto-detección o fallback a `'es'`. Sin error visible al usuario.
- `AsyncStorage` falla al escribir → la UI ya está actualizada (el write es fire-and-forget). El cambio no persistirá al reabrir, pero la sesión actual funciona.

---

## Contract de consumo en componentes

### Patrón básico

```typescript
import { useLocale } from '@/hooks';

function MyComponent() {
  const { t } = useLocale();
  
  return <Text>{t('dashboard.title')}</Text>;
}
```

### Patrón con selector de idioma (Settings)

```typescript
import { useLocale } from '@/hooks';

function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  
  return (
    <View>
      <Text>{t('settings.languageSection')}</Text>
      <Pressable onPress={() => setLocale('es')}>
        <Text>{t('settings.languageSpanish')}</Text>
        {locale === 'es' && <CheckIcon />}
      </Pressable>
      <Pressable onPress={() => setLocale('en')}>
        <Text>{t('settings.languageEnglish')}</Text>
        {locale === 'en' && <CheckIcon />}
      </Pressable>
    </View>
  );
}
```

### Patrón con errores traducidos

```typescript
// En useAuth: almacena translation key
setState(prev => ({ ...prev, error: 'errors.invalidKey' }));

// En componente: renderiza con t()
const { t } = useLocale();
// ...
{error && <Text>{t(error as TranslationKey)}</Text>}
```

---

## Exports

### Desde `src/i18n/index.ts`

```typescript
export { LocaleProvider, useLocale } from './LocaleProvider';
export type { Locale, TranslationKey, TranslationCatalog } from './types';
```

### Desde `src/hooks/index.ts` (agregar)

```typescript
export { LocaleProvider, useLocale } from '../i18n';
```
