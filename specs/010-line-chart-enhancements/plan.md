# 010 — Plan de Implementación: Line Chart Breakdown + Acumulativo

## Fase 1: Modelo de Datos

1. Añadir tipo `LineChartMode` a `types/dashboard.ts`.
2. Añadir campo `lineChartMode` a `DashboardMetric`.
3. Actualizar comentario de `breakdownProperty` para indicar que aplica a BarChart y LineChart.

## Fase 2: Edit Screen

4. Ampliar `edit-chart.tsx` para mostrar sección **Breakdown** cuando `chartType === 'LineChart'`.
5. Añadir sección **Tipo de gráfico** (Línea / Acumulativa) cuando `chartType === 'LineChart'` — independiente del breakdown.
6. Incluir `lineChartMode` en `hasChanges`, `handleSave`, y estado local.

## Fase 3: AddMetricSheet

7. Añadir paso `lineChartConfig` al tipo `Step`.
8. En `handleChartTypeNext`, redirigir a `lineChartConfig` cuando el tipo es `LineChart`.
9. Renderizar el paso con: selector de Tipo (Línea / Acumulativa) + breakdown picker (reusar modal existente).
10. En `handleConfirm`, enviar `breakdownProperty` y `lineChartMode` cuando aplique.

## Fase 4: LineChartWidget (widget del dashboard)

11. Añadir llamada a `useBreakdownSeries` cuando `breakdownProperty` esté definida.
12. Transformar datos: modo cumulative → running sum.
13. Renderizar múltiples líneas (una por breakdown value) usando la prop `dataSet` del `LineChart` de gifted-charts.
14. Renderizar leyenda debajo del chart (reusar patrón de BarChartWidget).

## Fase 5: LineChartDetail (pantalla de detalle)

15. Añadir soporte breakdown: llamar `useBreakdownSeries`, renderizar multi-line con colores.
16. Añadir soporte cumulative: transformar datos antes de renderizar.
17. Tooltip interactivo: cuando hay breakdown, mostrar desglose por valor en el tooltip.
18. Leyenda debajo del chart.

## Fase 6: Integración y Edge Cases

19. Reset `breakdownProperty` y `lineChartMode` cuando cambia el evento en edit-chart.
20. Cache invalidation: invalidar queries al cambiar breakdown o lineChartMode.
21. Estado vacío: manejar breakdown sin datos correctamente.

## Dependencias

```
Fase 1 → Fase 2, 3, 4, 5
Fase 2, 3 (paralelo)
Fase 4, 5 (paralelo, dependen de Fase 1)
Fase 6 depende de todo lo anterior
```
