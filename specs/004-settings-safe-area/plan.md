# Implementation Plan: Settings Safe Area y Header Alignment

**Branch**: `004-settings-safe-area` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-settings-safe-area/spec.md`

## Summary

Corregir la pantalla de Settings para que respete el safe area superior en iPhone y reutilice la misma jerarquía visual del header de Dashboard. El cambio se limita al layout del encabezado y al espaciado vertical superior; no modifica la lógica de autenticación, edición ni eliminación de API key.

## Technical Context

**Language/Version**: TypeScript ~5.9.2, React 19.1.0
**Primary Dependencies**: React Native 0.81.5, Expo Router ~6.0.23, react-native-safe-area-context, NativeWind
**Testing**: Manual visual verification
**Target Platform**: iOS + Android, con foco en iPhone safe area superior
**Project Type**: Expo React Native mobile app
**Constraints**: Mantener el comportamiento actual de scroll y acciones de Settings
**Scope**: 1 pantalla modificada + 3 archivos de documentación

## Constitution Check

| Regla | Estado | Notas |
|---|---|---|
| Respetar patrones visuales existentes | ✅ PASS | Settings tomará como referencia el header ya aprobado en Dashboard |
| No alterar lógica de negocio sin necesidad | ✅ PASS | Solo se ajusta layout y tipografía del header |
| Compatible con mobile safe areas | ✅ PASS | Se usará `SafeAreaView` para el borde superior |

## Implementation Steps

1. Crear `spec.md`, `plan.md` y `tasks.md` para documentar la corrección visual.
2. Actualizar `src/app/(tabs)/settings.tsx` para envolver la pantalla en `SafeAreaView` con `edges={['top']}`.
3. Separar un bloque de header equivalente al de Dashboard: `px-4 pt-2 pb-3` y título `font-inter-bold text-2xl`.
4. Mantener el contenido actual dentro de `ScrollView`, removiendo el padding superior que generaba el desalineado visual.
5. Validar que no existan errores de TypeScript en el archivo modificado.

## Risks

- Si el `ScrollView` conserva padding superior previo, el header seguirá desalineado.
- Si el header de Settings no replica el patrón de Dashboard, la inconsistencia visual persistirá.

## Out of Scope

- Cambios de copy, estructura funcional o comportamiento de los formularios de Settings.
- Ajustes del dashboard, tabs o diseño global fuera de esta pantalla.