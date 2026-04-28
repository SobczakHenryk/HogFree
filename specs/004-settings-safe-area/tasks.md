---
description: "Task list for 004-settings-safe-area feature"
---

# Tasks: Settings Safe Area y Header Alignment

**Input**: `specs/004-settings-safe-area/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: Validación manual visual y chequeo de errores.

## Phase 1: Documentation

- [x] T001 Crear `specs/004-settings-safe-area/spec.md` con escenarios, requisitos y criterios de éxito.
- [x] T002 Crear `specs/004-settings-safe-area/plan.md` con el enfoque de implementación.
- [x] T003 Crear `specs/004-settings-safe-area/tasks.md` con la lista de trabajo.

## Phase 2: Implementation

- [x] T004 Actualizar `app/PostHogMobile/src/app/(tabs)/settings.tsx` para respetar el safe area superior con `SafeAreaView`.
- [x] T005 Alinear el header de Settings con Dashboard reutilizando el mismo tamaño y peso tipográfico del título.
- [x] T006 Eliminar el padding superior extra del contenido scrolleable para evitar que el layout quede demasiado arriba o desalineado.

## Phase 3: Validation

- [x] T007 Validar que `settings.tsx` no tenga errores de TypeScript tras el cambio.