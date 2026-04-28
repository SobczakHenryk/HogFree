# 010 — Line Chart: Breakdown + Tipo Acumulativo

## Resumen

Extender el LineChart widget para que soporte **breakdown por propiedad** (igual que BarChart) y permita seleccionar entre dos modos de visualización: **Línea** (actual) y **Línea Acumulativa** (cumulative). La selección entre Línea y Acumulativa es independiente del breakdown.

---

## Historias de Usuario

### HU-1: Breakdown en LineChart (P1)

**Como** usuario del dashboard  
**Quiero** poder seleccionar una propiedad de breakdown para mi LineChart  
**Para** ver la evolución temporal desglosada por valores de propiedad (ej. por navegador, país, etc.)

**Criterios de Aceptación:**

1. En el flujo de creación (AddMetricSheet), cuando se selecciona LineChart, se muestra un paso intermedio "lineChartConfig" donde se puede elegir breakdown y modo de visualización.
2. En la pantalla de edición (edit-chart), cuando el chart es LineChart, se muestran los campos: Breakdown (property picker) y Tipo de gráfico (Línea / Acumulativa).
3. El LineChartWidget renderiza múltiples líneas coloreadas cuando hay breakdown activo, una por cada valor top 5 + "Otros".
4. Se muestra una leyenda debajo del chart con los nombres y colores de cada serie.
5. El chart detail (LineChartDetail) muestra tooltip interactivo con desglose por valor al tocar un punto.

### HU-2: Tipo de gráfico — Línea vs Acumulativa (P1)

**Como** usuario del dashboard  
**Quiero** poder seleccionar entre gráfico de "Línea" normal y "Línea Acumulativa"  
**Para** ver los datos como conteo diario o como total acumulado (running sum)

**Criterios de Aceptación:**

1. Se añade el campo `lineChartMode` a `DashboardMetric` con valores `'line'` (default) | `'cumulative'`.
2. La selección del tipo de gráfico es **independiente del breakdown**: se puede usar acumulativo sin breakdown y con breakdown.
3. En modo acumulativo, los valores del eje Y son la suma acumulada (running sum) de los data points día a día.
4. El total mostrado en el header es el último valor acumulado (no la suma de todos).
5. Cuando hay breakdown + acumulativo, cada serie del breakdown se acumula por separado.
6. El selector de tipo aparece tanto en el flujo de creación como en el de edición.

### HU-3: Configuración de LineChart en creación (P2)

**Como** usuario del dashboard  
**Quiero** configurar breakdown y tipo al crear un LineChart  
**Para** no tener que editar después de crear

**Criterios de Aceptación:**

1. En AddMetricSheet, al seleccionar LineChart, se muestra un paso "lineChartConfig" similar al "barChartConfig".
2. El paso muestra: selector de Tipo (Línea / Acumulativa) + breakdown (opcional).
3. El botón dice "Continuar" para ir al paso config, y "Añadir" en el paso config.

---

## Modelo de Datos

### Cambios a `DashboardMetric`

```typescript
export interface DashboardMetric {
  // ... campos existentes ...
  
  /** Propiedad del evento para breakdown. Aplica a BarChart y LineChart. */
  breakdownProperty?: string;
  
  /** Modo visual del BarChart. Solo relevante cuando chartType === 'BarChart'. */
  barChartMode?: BarChartMode;
  
  /** Modo visual del LineChart: 'line' (serie temporal) o 'cumulative' (suma acumulada). Default: 'line'. */
  lineChartMode?: LineChartMode;
}

export type LineChartMode = 'line' | 'cumulative';
```

### Notas Técnicas

- Se reusan `useBreakdownSeries` y `usePropertyDefinitions` sin cambios (ya son genéricos).
- Se reusan `BREAKDOWN_COLORS` y `BREAKDOWN_OTHER_COLOR` para colorear las series del line chart.
- Para línea acumulativa se calcula localmente la running sum: `acc[i] = acc[i-1] + point.count`.
- `react-native-gifted-charts` LineChart acepta prop `data2`, `data3`, etc. Para múltiples series se renderizarán múltiples `<LineChart>` superpuestos o se usará la prop `dataSet` si está disponible.
- La doc del campo `breakdownProperty` en `DashboardMetric` se actualizará para decir "Aplica a BarChart y LineChart" en vez de solo BarChart.
- *(Actualizado en 015-dashboard-ui-refactor)*: El line chart sin breakdown usa gradiente de área (area fill) de Blue (`CHART_GRADIENT_START` #3B82F6) a Teal (`CHART_GRADIENT_END` #2DD4BF), con `startOpacity: 0.25` y `endOpacity: 0.05`. La línea principal es Teal (#2DD4BF). El tipo `LineChartMode` y campo `lineChartMode` se definen en `types/dashboard.ts`.

---

## Flujos Afectados

| Pantalla | Cambio |
|---|---|
| `AddMetricSheet` | Nuevo paso `lineChartConfig` (tipo + breakdown) |
| `edit-chart.tsx` | Secciones Breakdown y Tipo para LineChart |
| `LineChartWidget.tsx` | Soporte breakdown (multi-línea) + modo cumulative |
| `chart-detail.tsx` — `LineChartDetail` | Soporte breakdown + cumulative + tooltip desglose |
| `types/dashboard.ts` | Nuevo tipo `LineChartMode`, campo `lineChartMode` |

---

## Fuera de Alcance

- No se cambia el BarChart (ya tiene breakdown).
- No se agrega cumulative al BarChart.
- No se modifica la lógica de la API ni los hooks de datos.
