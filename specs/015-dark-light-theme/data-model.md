# Data Model: Dark / Light / System Theme Selector

**Feature**: 015-dark-light-theme  
**Date**: 2026-03-20

---

## Entities

### ThemePreference

Preferencia de apariencia persistida por el usuario.

| Field | Type | Values | Description |
|---|---|---|---|
| `value` | string literal union | `"system"` \| `"light"` \| `"dark"` | Opción seleccionada por el usuario |

- **Storage**: AsyncStorage, key `APP_THEME_PREFERENCE`
- **Default**: `"system"` (cuando no existe preferencia almacenada o el valor es inválido)
- **Validation**: Solo se aceptan los tres valores literales. Cualquier otro valor se trata como `"system"`.

### ResolvedTheme

Tema efectivamente aplicado en un momento dado. Es un valor derivado, no persistido.

| Field | Type | Values | Description |
|---|---|---|---|
| `value` | string literal union | `"light"` \| `"dark"` | Tema final aplicado a la interfaz |

**Derivation rules**:
- Si `ThemePreference.value === "system"` → ResolvedTheme sigue el esquema reportado por el dispositivo.
- Si `ThemePreference.value === "light"` → ResolvedTheme es `"light"`.
- Si `ThemePreference.value === "dark"` → ResolvedTheme es `"dark"`.
- Si el dispositivo no reporta esquema (null/undefined) y la preferencia es "system" → ResolvedTheme es `"dark"` (fallback seguro).

---

## Type Definitions

```typescript
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const DEFAULT_THEME: ThemePreference = 'system';
export const SUPPORTED_THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'] as const;
```

---

## State Transitions

```
[App Launch]
    ↓
Read AsyncStorage('APP_THEME_PREFERENCE')
    ↓
┌─────────────────────────────────┐
│ Value valid?                    │
│ YES → use stored value          │
│ NO  → use "system" (default)   │
└─────────────────────────────────┘
    ↓
Apply to NativeWind via setColorScheme()
    ↓
[App Running — theme active]
    ↓
User taps selector option in Settings
    ↓
┌─────────────────────────────────┐
│ 1. Update React state           │
│ 2. Call setColorScheme(value)   │
│ 3. Persist to AsyncStorage      │
└─────────────────────────────────┘
    ↓
[UI reflects new theme immediately]
```

---

## Color Palette Tokens

### Light Mode (new defaults)

| Token | Hex | Usage |
|---|---|---|
| `background.DEFAULT` | `#FFFFFF` | Screen background |
| `background.secondary` | `#F5F5F5` | Cards, modals |
| `background.tertiary` | `#E5E5E5` | Inputs, list items |
| `text.primary` | `#171717` | Primary text |
| `text.secondary` | `#525252` | Labels, subtitles |
| `text.tertiary` | `#737373` | Placeholders, metadata |
| `border.DEFAULT` | `#E5E5E5` | Standard card borders |
| `border.light` | `#D4D4D4` | Active-state borders |

### Dark Mode (existing, moved to `dark:` prefix)

| Token | Hex | Usage |
|---|---|---|
| `background.DEFAULT` | `#0D0D0D` | Screen background |
| `background.secondary` | `#1A1A1A` | Cards, modals |
| `background.tertiary` | `#262626` | Inputs, list items |
| `text.primary` | `#FFFFFF` | Primary text |
| `text.secondary` | `#A3A3A3` | Labels, subtitles |
| `text.tertiary` | `#737373` | Placeholders, metadata |
| `border.DEFAULT` | `#262626` | Standard card borders |
| `border.light` | `#404040` | Active-state borders |

### Shared (same in both modes)

| Token | Hex | Usage |
|---|---|---|
| `primary.DEFAULT` | `#2DD4BF` | Brand accent |
| `primary.light` | `#5EEAD4` | Hover/active states |
| `primary.dark` | `#14B8A6` | Pressed states |
| `accent.blue` | `#3B82F6` | Charts, gradients |
| `accent.teal` | `#2DD4BF` | Secondary accent |
| `trend.up` | `#22C55E` | Positive trends |
| `trend.down` | `#EF4444` | Negative trends |

---

## Relationships

```
ThemePreference  ──derives──>  ResolvedTheme
       │                            │
       ▼                            ▼
  AsyncStorage                NativeWind colorScheme
  (persistent)               (runtime, reactive)
```

No relationships to other entities in the system. ThemePreference is self-contained.
