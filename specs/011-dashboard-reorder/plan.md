# 011 — Plan: Dashboard Reorder

## Fase 1: Dependencias

1. Instalar `react-native-draggable-flatlist`.

## Fase 2: Hook — reorderMetrics

2. Añadir función `reorderMetrics` a `useDashboardConfig` que recibe el array reordenado, actualiza `position` y persiste.

## Fase 3: Drag handle en widgets

3. Añadir prop `drag` y `isActive` a cada widget (MetricCard, BarChartWidget, LineChartWidget, FunnelChart).
4. Renderizar ícono `GripVertical` (lucide-react-native) a la **derecha** dentro de cada widget, con `onLongPress={drag}`. Estilo activo: `scale(0.98)`, `elevation: 12`. *(Actualizado en 015-dashboard-ui-refactor: antes era ≡ Ionicons a la izquierda.)*

## Fase 4: Dashboard — DraggableFlatList

5. Reemplazar FlashList por DraggableFlatList en `dashboard.tsx`.
6. Pasar `drag` e `isActive` del `renderItem` a cada widget. Envolver `drag()` con `Haptics.impactAsync(Medium)`. *(Añadido en 015.)*
7. En `onDragEnd`, disparar `Haptics.impactAsync(Light)` y llamar `reorderMetrics` con el nuevo orden. *(Añadido en 015.)*

## Dependencias

```
Fase 1 → Fase 2, 3, 4
Fase 2 + Fase 3 → Fase 4
```
