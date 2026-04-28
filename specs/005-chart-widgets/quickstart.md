# Quickstart: Chart Widgets — BarChartWidget y LineChartWidget

**Branch**: `005-chart-widgets` | **Phase**: 1 | **Date**: 2026-03-19

---

## Estado actual

La mayoría de los requisitos de este spec (FR-001 a FR-022) ya están implementados. Los componentes `BarChartWidget`, `LineChartWidget`, el hook `useMetricSeries`, el servicio `queryMetricSeries` y los tipos asociados están completos y funcionales.

**Lo que falta**: FR-023, FR-024, FR-025 — Campo de nombre personalizado en `AddMetricSheet`.

---

## Cambio pendiente: Nombre personalizado en AddMetricSheet

### Archivo a modificar

`app/PostHogMobile/src/components/AddMetricSheet.tsx`

### Qué hacer

1. Añadir estado `customLabel` inicializado en `''`
2. Al seleccionar evento (paso 1 → paso 2), setear `customLabel` a `selectedEvent.name`
3. En el paso `chartType`, renderizar un `TextInput` para editar el nombre
4. Deshabilitar el botón "Añadir" si `customLabel.trim().length === 0`
5. En `handleConfirm()`, pasar `customLabel.trim()` como `label`
6. En `resetSheet()`, resetear `customLabel` a `''`

### Verificación

```
1. Abrir la app → Dashboard → pulsar "+"
2. Seleccionar un evento (ej. "$pageview")
3. En paso 2, verificar que aparece un campo de texto con "$pageview" pre-rellenado
4. Editar el nombre a "Visitas Landing"
5. Confirmar → la tarjeta muestra "Visitas Landing" como título
6. Borrar todo el texto del campo → el botón "Añadir" se deshabilita
7. Cerrar y reabrir la app → el nombre "Visitas Landing" se mantiene
```

---

## Dependencias ya instaladas

```bash
# Ya en package.json — no instalar de nuevo
react-native-gifted-charts ^1.4.74
react-native-svg ^15.15.3
```

## Ejecutar la app

```bash
cd app/PostHogMobile
npx expo start --clear
```
