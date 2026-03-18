# PostHogMobile — Constitution & PRD

> Documento de referencia para agentes, LLMs y desarrolladores.  
> Define el stack tecnológico, la arquitectura y las guías de diseño del proyecto.  
> **Leer este documento antes de escribir, modificar o refactorizar cualquier código.**

---

## 1. Visión del Producto

**PostHogMobile** es una aplicación móvil nativa (iOS y Android) que permite a equipos de producto consultar sus datos de [PostHog](https://posthog.com) directamente desde el teléfono. El objetivo es ofrecer dashboards configurables, exploración de eventos y visualización de métricas sin necesidad de abrir el navegador.

### Principios Rectores

- **Mobile-first:** la app existe para el móvil; no es un port de escritorio.
- **Performance over features:** una métrica lenta arruina más que una feature faltante.
- **Offline-capable:** los datos deben ser visibles aunque no haya red.
- **Security by default:** la API Key del usuario se almacena siempre en SecureStore (iOS Keychain / Android Keystore).

---

## 2. Stack Tecnológico

### 2.1 Core

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | React Native | 0.81.5 |
| Framework | Expo | ~54.0.33 |
| Lenguaje | TypeScript | ~5.9.2 |
| React | React | 19.1.0 |
| Routing / Navegación | Expo Router | ~6.0.23 |

### 2.2 UI & Estilos

| Capa | Tecnología | Versión |
|---|---|---|
| Estilos utilitarios | NativeWind (Tailwind para RN) | ^4.2.1 |
| Config Tailwind | Tailwind CSS | ^3.4.19 |
| Tipografía | `@expo-google-fonts/inter` | ^0.4.2 |
| Iconos | `@expo/vector-icons` | ^15.0.3 |
| Animaciones | `react-native-reanimated` | ~4.1.1 |
| Gestos | `react-native-gesture-handler` | ^2.30.0 |
| Bottom Sheets | `@gorhom/bottom-sheet` | ^5.2.8 |
| Listas virtualizadas | `@shopify/flash-list` | ^2.2.2 |
| Gráficos | `react-native-gifted-charts` | ^1.4.74 |
| SVG | `react-native-svg` | ^15.15.3 |
| Gradientes | `expo-linear-gradient` | ~15.0.8 |

### 2.3 Estado & Datos

| Capa | Tecnología | Versión |
|---|---|---|
| Server State / Cache | TanStack Query (React Query) | ^5.90.21 |
| Persistencia de cache | `@tanstack/react-query-persist-client` | ^5.90.22 |
| Storage de cache | `@react-native-async-storage/async-storage` | ^2.2.0 |
| Persister | `@tanstack/query-async-storage-persister` | ^5.90.22 |
| Credenciales seguras | `expo-secure-store` | ^15.0.8 |

### 2.4 Networking

| Capa | Tecnología | Versión |
|---|---|---|
| Cliente HTTP | `ky` | ^1.14.3 |
| API Target | PostHog REST API | `https://app.posthog.com` |

### 2.5 Utilidades

| Utilidad | Tecnología | Versión |
|---|---|---|
| Fechas | `date-fns` | ^4.1.0 |
| Haptics | `expo-haptics` | ^15.0.8 |
| File system | `expo-file-system` | ~19.0.21 |
| Compartir | `expo-sharing` | ~14.0.8 |
| Deep links | `expo-linking` | ~8.0.11 |

---

## 3. Arquitectura

### 3.1 Estructura de Directorios

```
app/PostHogMobile/
├── app/                    # Rutas Expo Router (legacy/app base)
├── src/
│   ├── app/                # Rutas principales de la app
│   │   └── (tabs)/         # Navegación por tabs
│   │       ├── dashboard.tsx
│   │       ├── events.tsx
│   │       ├── settings.tsx
│   │       └── index.tsx
│   ├── components/         # Componentes reutilizables
│   ├── constants/
│   │   └── theme.ts        # Tokens de diseño (colores, spacing, tipografía)
│   ├── hooks/              # Custom hooks (data fetching, auth, config)
│   ├── services/
│   │   ├── api.ts          # Cliente HTTP (ky)
│   │   ├── posthog.ts      # Instancia/servicio PostHog
│   │   └── logger.ts       # Logger de sesión
│   └── types/              # Interfaces TypeScript
│       ├── index.ts
│       └── posthog.ts      # Tipos de la API PostHog
```

### 3.2 Patrón de Datos

```
PostHog REST API
    ↓ (ky + auth header Bearer)
services/api.ts  →  services/posthog.ts
    ↓
Custom hooks (useInsights, useEvents, useAuth…)
    ↓ (TanStack Query — staleTime: 1h, gcTime: 24h)
Componentes de UI
```

**Regla crítica:** Los componentes **nunca** llaman directamente a la API. Siempre usan un hook. Los hooks usan `useQuery` / `useMutation` de TanStack Query.

### 3.3 Autenticación

- El usuario provee su **Personal API Key** de PostHog.  
- Se almacena con `expo-secure-store` (iOS Keychain / Android Keystore).  
- Se carga al iniciar la app mediante `useAuth`.  
- Todas las peticiones HTTP incluyen el header `Authorization: Bearer <key>`.  
- **Nunca** mostrar la API Key en la UI ni en logs.

### 3.4 Caching y Persistencia

- TanStack Query gestiona el cache en memoria.
- `PersistQueryClientProvider` + `createAsyncStoragePersister` persisten el cache en `AsyncStorage` bajo la clave `POSTHOG_REACT_QUERY_CACHE`.
- **staleTime:** 1 hora (datos considerados frescos).
- **gcTime:** 24 horas (datos disponibles offline).
- Los errores 4xx **no** se reintentan (son definitivos). Los errores de red o 5xx se reintentan máximo 1 vez.

### 3.5 Nueva Arquitectura

La app tiene habilitada la **New Architecture** (`newArchEnabled: true` en `app.json`). Esto implica:
- Usar únicamente librerías compatibles con Fabric y JSI.
- No usar `Bridge`-only APIs.

---

## 4. Guías de Diseño

### 4.1 Tema General

- **Modo:** Dark only. No hay modo claro.
- **Fondo base:** `#0D0D0D` (casi negro).
- **Estética:** Glassmorphism sutil. Bordes semitransparentes, fondos con opacidad.
- **Orientación:** Portrait fija (`"orientation": "portrait"` en app.json).

### 4.2 Paleta de Colores

Definida en `src/constants/theme.ts` y en `tailwind.config.js` como tokens de Tailwind.

#### Backgrounds
| Token | Hex | Uso |
|---|---|---|
| `background` / `background.primary` | `#0D0D0D` | Fondo base de pantallas |
| `background.secondary` | `#1A1A1A` | Cards, modales |
| `background.tertiary` | `#262626` | Inputs, items de lista |

#### Brand / Primary
| Token | Hex | Uso |
|---|---|---|
| `primary` | `#F54E00` | Naranja PostHog. CTAs, highlights |
| `primary.light` | `#FF6B2D` | Estados hover / activos |
| `primary.dark` | `#CC4100` | Estados presionados |

#### Accents
| Token | Hex | Uso |
|---|---|---|
| `accent.blue` | `#1D4ED8` | Gráficos, line charts |
| `accent.cyan` | `#06B6D4` | Gráficos secundarios |
| `accent.purple` | `#7C3AED` | Gráficos terciarios, funnels |

#### Texto
| Token | Hex | Uso |
|---|---|---|
| `text.primary` | `#FFFFFF` | Texto principal |
| `text.secondary` | `#A3A3A3` | Labels, subtítulos |
| `text.tertiary` | `#737373` | Placeholders, metadatos |

#### Bordes
| Token | Hex | Uso |
|---|---|---|
| `border` | `#262626` | Borde estándar de cards |
| `border.light` | `#404040` | Borde en estados activos |

### 4.3 Tipografía

Fuente exclusiva: **Inter** (de Google Fonts via `@expo-google-fonts/inter`).

| Clase Tailwind | Fuente | Peso | Uso |
|---|---|---|---|
| `font-inter` | Inter | 400 (Regular) | Texto body, descripciones |
| `font-inter-medium` | Inter | 500 (Medium) | Labels, items de lista |
| `font-inter-semibold` | Inter | 600 (SemiBold) | Subtítulos, valores de métricas |
| `font-inter-bold` | Inter | 700 (Bold) | Títulos, encabezados |

#### Escala de tamaños
| Token | px | Uso |
|---|---|---|
| `text-xs` | 12 | Etiquetas pequeñas, timestamps |
| `text-sm` | 14 | Body secundario |
| `text-base` / `text-md` | 16 | Body principal |
| `text-lg` | 18 | Subtítulos |
| `text-xl` | 24 | Títulos de sección |
| `text-2xl` | 32 | Valores numéricos grandes |

### 4.4 Espaciado

Sistema de 8 puntos, definido en `theme.ts`:

| Token | px |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 16 |
| `lg` | 24 |
| `xl` | 32 |
| `xxl` | 48 |

Usar siempre múltiplos de 4. Preferir `md` (16) como padding base de cards.

### 4.5 Bordes y Elevación

- **Border radius de cards:** `rounded-2xl` (16px).
- **Border radius de botones:** `rounded-xl` (12px).
- **Border radius de inputs/chips:** `rounded-lg` (8px).
- **Borde de cards:** `borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)'` o `border-border`.
- **Glassmorphism:** `backgroundColor: 'rgba(26, 26, 26, 0.8)'` con borde semitransparente.

### 4.6 Touch & Interacción

- Usar `Pressable` de React Native (no `TouchableOpacity`).
- Feedback táctil con `expo-haptics`:
  - Acciones ligeras (abrir modal, toggle): `Haptics.ImpactFeedbackStyle.Light`.
  - Acciones de confirmación: `Haptics.ImpactFeedbackStyle.Medium`.
  - Acciones destructivas: `Haptics.ImpactFeedbackStyle.Heavy`.
- Área mínima de toque: **44×44 puntos** (guía Apple HIG).

### 4.7 Loading States

- **Skeleton loaders** para contenido que tarda en cargar (no spinners solos).
- `ActivityIndicator` solo para acciones de usuario (pull to refresh, submit).
- Pull-to-refresh implementado con `RefreshControl` en `ScrollView`.

### 4.8 Componentes de UI

Los componentes reutilizables viven en `src/components/` y se exportan desde `src/components/index.ts`.

| Componente | Descripción |
|---|---|
| `MetricCard` | Card con valor numérico, tendencia y ícono |
| `LineChartWidget` | Gráfico de línea para trends temporales |
| `BarChartWidget` | Gráfico de barras para comparaciones |
| `FunnelChart` | Visualización de embudos de conversión |
| `EventCard` / `EventCardSkeleton` | Card de evento individual con skeleton |
| `FilterBar` / `FilterBottomSheet` | Filtros de eventos (bottom sheet) |
| `DashboardConfigModal` | Modal de configuración del dashboard |
| `Card` | Card base reutilizable |

---

## 5. Convenciones de Código

### 5.1 TypeScript

- **Strict mode** habilitado.
- Preferir `interface` sobre `type` para objetos.
- Todos los tipos de la API en `src/types/posthog.ts`.
- Exportar tipos con `export type { ... }`.

### 5.2 Componentes

- Componentes funcionales con hooks. **No hay class components.**
- Un componente por archivo.
- Estilos con **NativeWind** (clases Tailwind en `className`). Usar `style` solo para valores dinámicos o que no tienen equivalente en Tailwind.
- Memoizar con `React.memo` solo si hay problemas de performance medibles.

### 5.3 Hooks

- Custom hooks en `src/hooks/`.
- Cada hook tiene una responsabilidad clara (data fetching, auth, config).
- Hooks de data fetching usan `useQuery` de TanStack Query.
- Exportar todos los hooks desde `src/hooks/index.ts`.

### 5.4 Servicios

- `api.ts`: cliente `ky` genérico con interceptors de logging y manejo de errores.
- `posthog.ts`: wrapper tipado sobre `api.ts` con los endpoints de PostHog.
- `logger.ts`: logging de sesión a archivo (no usar `console.log` en producción).

### 5.5 Navegación

- **Expo Router** con sistema de archivos como rutas.
- Tabs principales: Dashboard, Events, Settings.
- Modales: `modal.tsx` o componentes modales nativos.
- Deep links configurados con scheme `posthogmobile://`.

---

## 6. Reglas de Seguridad

1. **API Key:** almacenar solo con `expo-secure-store`. Nunca en `AsyncStorage` ni en código fuente.
2. **Logs:** redactar/ofuscar API keys en todos los logs.
3. **HTTPS only:** todas las peticiones a `https://app.posthog.com`. Nunca HTTP.
4. **No datos sensibles en cache:** el cache de React Query persiste en AsyncStorage; no guardar credenciales como parte de los datos cacheados.
5. **Validar inputs de usuario** antes de enviarlos a la API (al menos trim y longitud mínima).

---

## 7. Performance

- **staleTime: 1h** en TanStack Query para evitar refetches innecesarios.
- Usar los endpoints de **Insights** (`/api/projects/:id/insights/`) en vez de descargar eventos crudos. Reduce el payload de ~1 MB a ~5 KB.
- **FlashList** (`@shopify/flash-list`) para listas largas de eventos.
- `refetchOnWindowFocus: false` para no disparar fetches al volver al foco (mejor UX en mobile).
- Imágenes y fuentes precargadas con `expo-splash-screen`.

---

## 8. Plataformas Soportadas

| Plataforma | Estado |
|---|---|
| iOS | ✅ Principal |
| Android | ✅ Principal |
| Web | ⚠️ Soporte básico (Metro bundler) |

- `supportsTablet: true` en la config iOS.
- Android con `edgeToEdgeEnabled: true` y `predictiveBackGestureEnabled: false`.
- `userInterfaceStyle: "dark"` forzado en todas las plataformas.
