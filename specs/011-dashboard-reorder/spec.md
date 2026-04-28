# 011 — Dashboard: Reordenar métricas con Drag & Drop

## Resumen

Permitir al usuario reordenar las métricas del dashboard mediante drag & drop. Se agrega un ícono de arrastre (GripVertical, 6 puntos en dos columnas) a la **derecha** de cada widget para indicar que se puede reordenar. El nuevo orden se persiste en AsyncStorage. Al iniciar y finalizar el arrastre se dispara feedback háptico. *(Actualizado en 015-dashboard-ui-refactor: antes era ≡ Ionicons a la izquierda, sin haptics.)*

---

## Historias de Usuario

### HU-1: Reordenar métricas con drag & drop (P1)

**Como** usuario del dashboard  
**Quiero** poder arrastrar las métricas para cambiar su orden  
**Para** organizar mi dashboard según mis prioridades

**Criterios de Aceptación:**

1. Cada widget (MetricCard, BarChart, LineChart, FunnelChart) muestra un ícono `GripVertical` (lucide-react-native) a su **derecha**.
2. Al hacer long-press sobre el widget, el widget reduce su escala a 0.98 con elevación 12, se dispara `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` y se puede arrastrar verticalmente.
3. Al soltar, se dispara `Haptics.impactAsync(ImpactFeedbackStyle.Light)`, el widget se inserta en la nueva posición y los demás se reajustan.
4. El nuevo orden se persiste inmediatamente en AsyncStorage.
5. El campo `position` de cada `DashboardMetric` se actualiza al reordenar.
6. El tap normal sobre el widget sigue navegando a chart-detail.

### HU-2: Indicador visual de arrastre (P1)

**Como** usuario del dashboard  
**Quiero** ver un ícono ≡ en cada tarjeta del dashboard  
**Para** saber que puedo reordenar los widgets

**Criterios de Aceptación:**

1. El ícono se posiciona a la **derecha** (far right) dentro de cada widget.
2. El ícono usa el color `#525252` para no distraer.
3. El ícono es `GripVertical` de `lucide-react-native` (6 puntos en dos columnas). *(Actualizado en 015-dashboard-ui-refactor: antes era Ionicons reorder-three a la izquierda.)*

---

## Solución Técnica

### Librería

- **`react-native-draggable-flatlist`**: Reemplaza FlashList en el dashboard. Usa internamente `react-native-reanimated` y `react-native-gesture-handler` (ya instalados).
- Alternativa descartada: implementar drag manual con PanGesture — más complejo sin beneficio.

### Cambios

| Archivo | Cambio |
|---|---|
| `package.json` | Añadir `react-native-draggable-flatlist` |
| `dashboard.tsx` | Reemplazar FlashList por DraggableFlatList, usar `drag` del renderItem, añadir haptics (expo-haptics), quitar ScaleDecorator |
| `useDashboardConfig.ts` | Añadir función `reorderMetrics(orderedIds: string[])` |
| `MetricCard.tsx` | Añadir GripVertical (lucide) a la derecha |
| `BarChartWidget.tsx` | Añadir GripVertical (lucide) a la derecha |
| `LineChartWidget.tsx` | Añadir GripVertical (lucide) a la derecha |
| `FunnelChart.tsx` | Añadir GripVertical (lucide) a la derecha |

### Patrón del drag handle

Cada widget recibe una prop `drag` (callback de react-native-draggable-flatlist) y `isActive` (boolean). El drag handle se renderiza dentro del widget, invocando `drag()` en `onLongPress`.

---

## Fuera de Alcance

- No se agrega animación de eliminación.
- No se cambia la apariencia del widget mientras se arrastra más allá de `scale(0.98)` + `elevation: 12` (actualizado en 015).
- No se eliminan widgets por deslizamiento (swipe-to-delete).
