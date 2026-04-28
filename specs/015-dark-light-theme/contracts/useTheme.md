# Contract: useTheme Hook

**Feature**: 015-dark-light-theme  
**Date**: 2026-03-20  
**Type**: React Context + Hook (internal API)

---

## Interface

```typescript
interface ThemeContextValue {
  /** User's stored preference: "system" | "light" | "dark" */
  themePreference: ThemePreference;

  /** Resolved effective theme applied by NativeWind: "light" | "dark" */
  resolvedTheme: ResolvedTheme;

  /** Update theme preference (persists to AsyncStorage + applies via NativeWind) */
  setTheme: (theme: ThemePreference) => void;
}
```

---

## Provider

### `ThemeProvider`

- **Location**: `src/hooks/useTheme.tsx`
- **Exported from**: `src/hooks/index.ts`
- **Composition**: Wrapped in `_layout.tsx` at the same level as `LocaleProvider`

**Behavior**:
1. On mount, reads `APP_THEME_PREFERENCE` from AsyncStorage.
2. Validates value with `isSupportedTheme()`. Invalid → falls back to `"system"`.
3. Calls NativeWind's `setColorScheme(preference)` to apply theme.
4. Exposes `themePreference`, `resolvedTheme`, and `setTheme` via context.

---

## Hook

### `useTheme(): ThemeContextValue`

- **Location**: `src/hooks/useTheme.tsx`
- **Exported from**: `src/hooks/index.ts`
- Throws if used outside `<ThemeProvider>`.

---

## Behavior Contract

| Action | Input | Side Effects | Return |
|---|---|---|---|
| `setTheme("system")` | `"system"` | Calls `setColorScheme("system")`, persists `"system"` to AsyncStorage | `themePreference` → `"system"`, `resolvedTheme` → device theme |
| `setTheme("light")` | `"light"` | Calls `setColorScheme("light")`, persists `"light"` to AsyncStorage | `themePreference` → `"light"`, `resolvedTheme` → `"light"` |
| `setTheme("dark")` | `"dark"` | Calls `setColorScheme("dark")`, persists `"dark"` to AsyncStorage | `themePreference` → `"dark"`, `resolvedTheme` → `"dark"` |
| Mount (first time) | No stored value | Reads AsyncStorage → null → applies "system" | `themePreference` → `"system"` |
| Mount (stored "light") | `"light"` in AsyncStorage | Applies "light" | `themePreference` → `"light"`, `resolvedTheme` → `"light"` |
| Mount (stored garbage) | `"foo"` in AsyncStorage | Ignores, applies "system" | `themePreference` → `"system"` |

---

## Validation Rules

- `themePreference` MUST be one of: `"system"`, `"light"`, `"dark"`.
- `setTheme` MUST silently reject any value not in the supported set.
- `resolvedTheme` is ALWAYS `"light"` or `"dark"` (never `"system"`).

---

## Dependencies

- **NativeWind**: `useColorScheme()` from `"nativewind"` for `setColorScheme()` and `colorScheme` reading.
- **AsyncStorage**: For persistence of the preference.
- No network calls. No API dependencies. Purely local.

---

## Usage Example

```tsx
// In any component:
const { themePreference, resolvedTheme, setTheme } = useTheme();

// In Settings selector:
<Pressable onPress={() => setTheme('light')}>
  <Text>Claro</Text>
</Pressable>

// Conditional rendering based on resolved theme:
<Icon color={resolvedTheme === 'dark' ? '#FFFFFF' : '#171717'} />
```
