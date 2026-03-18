# Casos de Prueba (Test Suite)

# 🧪 Casos de Prueba (Test Cases) — Plan n' Trip

Este documento define la suite de pruebas para validar la calidad funcional y visual de la aplicación.
Está diseñado para ser ejecutado por agentes de QA (Antigravity) o testers humanos.

---

## 🔐 Módulo 1: Autenticación & Acceso

### [TC-001] - Validación de Login desde Landing Page
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.1 / 2.2)
- **Precondición:** Usuario no logueado.
- **Pasos:**
  1. Navegar a la Landing Page (`/`).
  2. Clic en el botón "Iniciar Sesión" del Header.
  3. Ingresar credenciales válidas en el formulario de Clerk.
  4. Clic en "Continuar/Iniciar Sesión".
- **Validación Funcional:** El sistema debe redirigir al `/dashboard` en menos de 3 segundos.
- **Validación Diseño:** Verificar que el botón de login tenga el gradiente de marca (Azul-Teal) y no el color rosa por defecto.

---

## 🏠 Módulo 2: Dashboard

### [TC-002] - Estado Vacío (Empty State)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 4.2)
- **Precondición:** Usuario nuevo sin itinerarios creados.
- **Pasos:**
  1. Navegar a `/dashboard`.
  2. Verificar el contenido central.
- **Validación Funcional:** NO debe aparecer la lista de viajes. Debe aparecer la tarjeta de "Nuevo Itinerario".
- **Validación Diseño:** La tarjeta debe tener borde punteado (`dashed`) y el botón "Comenzar ahora" debe tener estilo primario.

---

## ✨ Módulo 3: Generador de Itinerarios

### [TC-003] - Generación con IA (Flujo Completo)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 3.3)
- **Precondición:** Usuario en `/generate`.
- **Pasos:**
  1. Escribir Destino: "Madrid, España".
  2. Seleccionar Fechas: [Mañana] a [Pasado Mañana] (2 días).
  3. Seleccionar Ritmo: "Tranquilo".
  4. Clic en "Generar Itinerario".
- **Validación Funcional:** 
  1. Redirige a pantalla de carga (Loading).
  2. Tras esperar, redirige automáticamente a `/itinerary/[id]`.
  3. El itinerario creado contiene actividades pobladas.
- **Validación Diseño:** La pantalla de carga debe mostrar la animación Lottie del avión y mensajes de texto rotativos.

### [TC-004] - Creación Manual (Plantilla en Blanco)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 3.3)
- **Precondición:** Usuario en `/generate`.
- **Pasos:**
  1. Escribir Destino: "Roma, Italia".
  2. Seleccionar Fechas: [Mañana] a [Pasado Mañana].
  3. Clic en el botón secundario "Crear plantilla en blanco".
- **Validación Funcional:** Redirige **inmediatamente** al editor. Los días existen pero sin actividades.
- **Validación Diseño:** El botón secundario debe ser discreto (Ghost/Outline) y estar debajo del principal.

### [TC-005] - Restricción de Días (Plan Free)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 3.2 - Fechas)
- **Precondición:** Usuario con Plan Free.
- **Pasos:**
  1. En `/generate`, seleccionar un rango de fechas de 10 días.
- **Validación Funcional:** Debe aparecer un Toast/Notificación de advertencia. La fecha final debe ajustarse automáticamente al día 7 o bloquear la selección.
- **Validación Diseño:** El Toast debe ser de tipo Warning (Amarillo/Naranja).

---

## 📋 Módulo 4: Edición de Itinerario

### [TC-006] - Reordenar Actividad (Drag & Drop)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 6.2)
- **Precondición:** Itinerario con al menos 2 actividades en un día.
- **Pasos:**
  1. Arrastrar la segunda actividad y soltarla antes de la primera.
- **Validación Funcional:** El orden de los elementos cambia en la lista. La hora de inicio se recalcula (la actividad movida toma la hora inicial).
- **Validación Diseño:** Al arrastrar, la tarjeta debe tener sombra elevada (efecto de levantamiento).

### [TC-007] - Agregar Lugar (Buscador)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 6.3)
- **Precondición:** En modo edición.
- **Pasos:**
  1. Clic en "+ Buscar y Agregar Lugar".
  2. Escribir "Museo" en el buscador.
  3. Clic en el botón "+" de un resultado.
- **Validación Funcional:** El modal/drawer se cierra y la actividad aparece al final de la lista del día.
- **Validación Diseño:** Las tarjetas de resultados deben mostrar foto a la izquierda y botón de acción a la derecha.

### [TC-008] - Escapada de un Día (Day Trip)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 6.4)
- **Precondición:** En modo edición, seleccionar un día con actividades.
- **Pasos:**
  1. Clic en "Planear una escapada para este día".
  2. Seleccionar un destino del modal (ej: Toledo).
  3. Confirmar la advertencia de borrado.
- **Validación Funcional:** 
  1. Las actividades anteriores se eliminan.
  2. Se cargan las nuevas actividades de la ciudad destino.
  3. El título del día cambia a "Escapada a Toledo".
- **Validación Diseño:** El modal de carga debe mostrar la animación del Autobús (Lottie).

### [TC-009] - Ajuste de Tiempo (Ripple Effect)
- **Prioridad:** Baja
- **Origen:** FUNCTIONAL_SPECS.md (Sec 6.2 - Ajuste Duración)
- **Precondición:** Itinerario con 2 actividades consecutivas (A: 09:00, B: 10:00).
- **Pasos:**
  1. Clic en el badge de duración de la actividad A.
  2. Aumentar duración en +30 min (Total 90 min).
  3. Guardar.
- **Validación Funcional:** La actividad A ahora termina a las 10:30. La actividad B se mueve automáticamente a las 10:30.

---

## 💰 Módulo 5: Billetera y Gastos

### [TC-010] - Switch de Gastos Reales
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 5.1 / 7)
- **Precondición:** En detalle de itinerario.
- **Pasos:**
  1. Activar el Switch "Gastos Reales" en la Hero Card.
- **Validación Funcional:** El monto mostrado cambia de un Rango Estimado a un Monto Exacto ($0.00 si está vacío).
- **Validación Diseño:** Aparece la barra de progreso debajo del monto.

### [TC-011] - Agregar Gasto Extra
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 5.3)
- **Precondición:** En detalle de itinerario.
- **Pasos:**
  1. Ir al final de la lista.
  2. Clic en "Agregar Gasto Extra".
  3. Ingresar: "Taxi", "20", Categoría "Transporte".
  4. Guardar.
- **Validación Funcional:** 
  1. El gasto aparece en la lista inferior "Otros Gastos".
  2. El "Total Gastado" en la Hero Card aumenta en $20.

---

## 🗺️ Módulo 6: Explorador de Destinos

### [TC-012] - Cambio de Mes Dinámico
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.2 / 9.3)
- **Precondición:** En `/explore`, visualizando una ciudad (ej: París).
- **Pasos:**
  1. Clic en el mes "Enero".
  2. Observar la sección de clima y costos.
  3. Clic en el mes "Agosto".
- **Validación Funcional:** La temperatura debe subir, los costos deben cambiar y la recomendación de ropa debe ser diferente.
- **Validación Diseño:** La tarjeta de información debe mantener su estructura de Grid sin romperse.

---

## 📱 Módulo 7: Mobile Specific

### [TC-013] - Navegación Bottom Tabs
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 4.6 / 6)
- **Precondición:** App Móvil abierta.
- **Pasos:**
  1. Tocar tab "Explorar".
  2. Tocar tab "Mis Viajes".
- **Validación Funcional:** La navegación es instantánea y mantiene el estado de cada pantalla.
- **Validación Diseño:** El icono de la pestaña activa debe estar coloreado (Azul/Teal), los inactivos en gris.

---

## 🔐 Módulo 1: Autenticación (Adicional)

### [TC-014] - Validación de Registro desde Landing Page
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.1 / 2.3)
- **Precondición:** No estar logueado.
- **Pasos:**
  1. Clic en botón "Registrarse".
  2. Ingresar credenciales validas.
  3. Clic en "Registrarse".
- **Validación Funcional:** Debe redirigir a `/dashboard`.
- **Validación Diseño:** Verificar gradiente en botón "Registrarse" y alineación de inputs.

---

## ⚙️ Módulo 8: Configuración y Cuenta

### [TC-015] - Persistencia de Preferencia de Idioma
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.1 / 8.3)
- **Precondición:** Usuario logueado en Dashboard (Idioma actual: Español).
- **Pasos:**
  1. Ir a Perfil > Preferencias.
  2. Cambiar Idioma a "English".
  3. Guardar cambios.
  4. Recargar la página (F5) o cerrar y abrir sesión.
- **Validación Funcional:** La interfaz debe cargar en **Inglés** automáticamente. `localStorage` debe tener la key `language` = `en`.
- **Validación Diseño:** El botón "Guardar" debe mostrar el Toast de éxito y no usar colores por defecto de Clerk.

---

## 🏠 Módulo 2: Dashboard (Gestión)

### [TC-016] - Eliminación de Itinerario (Flujo Completo)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 4.5)
- **Precondición:** Usuario con al menos 1 viaje creado.
- **Pasos:**
  1. En `/dashboard`, abrir menú de una tarjeta (...) y clic en "Eliminar".
  2. **Interacción:** Verificar aparición de Modal de Advertencia.
  3. Confirmar eliminación en el modal (Botón Rojo).
- **Validación Funcional:** El modal se cierra, aparece Toast "Eliminado", y la tarjeta desaparece de la grilla sin recargar la página.
- **Validación Diseño:** El modal debe tener fondo con desenfoque (`backdropFilter`) y botón de peligro rojo.

---

## 🗺️ Módulo 6: Explorador de Destinos (Búsqueda)

### [TC-017] - Búsqueda de Ciudad No Existente (Generación IA)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.1)
- **Precondición:** En `/explore`.
- **Pasos:**
  1. Buscar una ciudad pequeña (ej: "Salento, Colombia") que no esté en base de datos.
  2. Seleccionar del autocompletado.
- **Validación Funcional:** No debe mostrar error 404. Debe redirigir a una vista de carga mientras se generan los datos "on-the-fly".
- **Validación Diseño:** Verificar presencia de animación Lottie (Cargando) y mensajes rotativos de estado, NO un spinner simple.

---

## 1. Landing Page (Mobile)

### [TC-018] - Navegación Responsive (Mobile Drawer)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.1)
- **Precondición:** Vista en dispositivo móvil (<768px).
- **Pasos:**
  1. Clic en icono "Hamburguesa" del Navbar.
  2. Verificar despliegue del Drawer lateral.
  3. Clic en enlace "Iniciar Sesión" dentro del Drawer.
- **Validación Funcional:** El Drawer debe abrirse suavemente y la navegación debe redirigir a `/login`.
- **Validación Diseño:** El fondo del resto de la página debe oscurecerse (Overlay).

---

## ✨ Módulo 3: Generador (Errores Input)

### [TC-019] - Validación de Campos Requeridos
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 3.3 / 3.5)
- **Precondición:** En `/generate`.
- **Pasos:**
  1. Dejar destino y fechas vacíos.
  2. Clic en "Generar Itinerario".
- **Validación Funcional:** NO debe redirigir. No debe hacer llamada a API.


---

## 🧭 Módulo 1.1 - 1.5: Landing Page & Navegación (Adicionales)

### [TC-020] - Persistencia del Cambio de Idioma (Navbar)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.1 - Selector de Idioma)
- **Precondición:** Usuario en Landing Page (`/`) en idioma Español (default).
- **Pasos:**
  1. Clic en el selector de idioma en el Navbar.
  2. Seleccionar "English".
  3. Recargar la página (F5).
- **Validación Funcional:** La página carga en Inglés. La clave `i18nextLng` (o similar) en `localStorage` debe ser `en`.
- **Validación Diseño:** El selector debe mostrar la bandera/label de EN. Los textos del Hero deben estar traducidos.

### [TC-021] - Rotación Automática del Carrusel (Hero)
- **Prioridad:** Baja
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.2 - Browser Mockup)
- **Precondición:** Usuario visualizando la sección Hero en Landing Page.
- **Pasos:**
  1. No interactuar con el carrusel.
  2. Esperar 6 segundos.
- **Validación Funcional:** La imagen dentro del marco del navegador debe cambiar automáticamente.
- **Validación Diseño:** La transición debe ser un desvanecimiento suave (Cross-fade), no un deslizamiento brusco.

### [TC-022] - Redirección Inteligente (Sesión Activa)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.1 - Detección de Sesión)
- **Precondición:** Usuario YA logueado (tiene cookie de sesión de Clerk).
- **Pasos:**
  1. Navegar manualmente a `http://localhost:5173/`.
  2. Observar comportamiento.
- **Validación Funcional:** El sistema no debe renderizar la Landing. Debe redirigir inmediatamente a `/dashboard`.
- **Validación Diseño:** No debe verse un "flicker" (parpadeo) del contenido de la landing antes de redirigir.

### [TC-023] - Estado "Próximamente" en App Móvil
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.3 - Bento Grid)
- **Precondición:** Scroll hasta la sección de Features (Bento Grid).
- **Pasos:**
  1. Ubicar la tarjeta "App Móvil / Offline".
  2. Intentar hacer clic en la tarjeta.
- **Validación Funcional:** No debe navegar a ninguna tienda (App Store). No debe ser clickeable como enlace.
- **Validación Diseño:** Debe tener un Badge visible que diga "PRÓXIMAMENTE" (Estilo Warning o Info).

### [TC-024] - Navegación Legal (Footer)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 1.4 - Footer)
- **Precondición:** Scroll hasta el final de la página (Footer).
- **Pasos:**
  1. Clic en "Política de Privacidad".
  2. Volver.
  3. Clic en icono "Instagram".
- **Validación Funcional:** Privacidad abre en la misma pestaña (`/privacy`). Instagram abre en **nueva pestaña** (`target="_blank"`).
- **Validación Diseño:** Los enlaces deben tener efecto Hover (cambio de color o subrayado).

---

## 🗺️ Módulo 9: Explorador de Destinos (Detallado)

### [TC-025] - Autocompletado de Ciudades (Google Places)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.1 - Hero Search)
- **Precondición:** En `/explore`.
- **Pasos:**
  1. Escribir "Tok" en el buscador principal.
  2. Esperar 500ms.
- **Validación Funcional:** Debe desplegar una lista de sugerencias restringida a ciudades (ej: "Tokyo, Japan", "Tokushima, Japan"). No deben aparecer negocios ni calles.
- **Validación Diseño:** El dropdown debe tener sombra `lg` y los items deben resaltar al pasar el mouse (`_hover`).

### [TC-026] - Navegación desde "Inspírate" (Destinos Destacados)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.1 - Sección Inspírate)
- **Precondición:** En `/explore`, scroll a la sección de tarjetas destacadas.
- **Pasos:**
  1. Clic en la tarjeta de "Kyoto".
- **Validación Funcional:** Navega inmediatamente a `/explore/kyoto` sin mostrar loading de IA (datos pre-generados).
- **Validación Diseño:** La tarjeta debe tener un efecto de escala (`scale(1.02)`) al hacer hover antes del clic.

### [TC-027] - Carga de Datos en Tiempo Real (Ciudad Nueva)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.1 - Comportamiento)
- **Precondición:** Buscador vacío.
- **Pasos:**
  1. Buscar una ciudad no popular (ej: "Cuenca, Ecuador").
  2. Seleccionar de la lista.
- **Validación Funcional:** Redirige a la URL `/explore/cuenca`. Muestra componente `CityGuideLoader`. Tras unos segundos, muestra el contenido generado.
- **Validación Diseño:** El loader NO es un spinner. Debe mostrar mensajes rotativos ("Analizando clima...", "Buscando festivales...") y animación Lottie.

### [TC-028] - Selector de Meses (Interacción)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.2 - Selector de Meses)
- **Precondición:** En vista de detalle de ciudad.
- **Pasos:**
  1. Observar el mes seleccionado por defecto (Mes actual).
  2. Clic en un mes con punto Verde (🟢).
  3. Clic en un mes con punto Rojo (🔴).
- **Validación Funcional:** La tarjeta inferior "Info del Mes" actualiza sus datos (Clima, Eventos, Veredicto) en cada clic sin recargar la página.
- **Validación Diseño:** El mes activo debe tener un anillo de foco o fondo de color marca. Los inactivos deben tener opacidad reducida.

### [TC-029] - Validación de Datos Climáticos (Dinámicos)
- **Prioridad:** Media
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.3 - Datos Climáticos)
- **Precondición:** En detalle de ciudad (Hemisferio Norte, ej: Londres).
- **Pasos:**
  1. Seleccionar "Enero".
  2. Seleccionar "Julio".
- **Validación Funcional:** La temperatura de Enero debe ser menor que la de Julio. La descripción debe cambiar de "Frío/Llluvioso" a "Cálido/Templado".
- **Validación Diseño:** Iconos de clima deben corresponder (Nube/Lluvia vs Sol).

### [TC-030] - Conversión desde Tarjeta de Ritmo "Tranquilo"
- **Prioridad:** Crítica (Conversión)
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.5 - Recomendación Duración)
- **Precondición:** En detalle de ciudad, sección "Cuánto tiempo ir".
- **Pasos:**
  1. Localizar tarjeta "Ritmo Tranquilo" (ej: 7 días suygeridos).
  2. Clic en "Crear itinerario de 7 días".
- **Validación Funcional:** Redirige a `/generate`. El formulario aparece pre-llenado con Ciudad, Ritmo Tranquilo y duración inteligente (Fechas ajustadas a 7 días).
- **Validación Diseño:** El botón debe ser un CTA secundario o outline, pero visible.

### [TC-031] - Visualización de Costos (Semántica)
- **Prioridad:** Baja
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.3 - Indicadores Visuales)
- **Precondición:** En detalle de ciudad cara (ej: Suiza) vs barata (ej: Vietnam).
- **Pasos:**
  1. Comparar (o simular) la visualización de costos.
- **Validación Funcional:** "Suiza" debe mostrar 4 o 5 iconos de dinero (💰💰💰💰💰). "Vietnam" debe mostrar 1 o 2.
- **Validación Diseño:** Los iconos activos deben tener color (ej: verde oscuro o dorado), los inactivos deben ser grises (`gray.300`).

### [TC-032] - Botón Flotante "Atrás" (Mobile)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.6 - Specs Mobile)
- **Precondición:** Vista Mobile (<768px), en detalle de ciudad.
- **Pasos:**
  1. Scroll hacia abajo.
  2. Verificar esquina superior izquierda sobre la imagen Hero.
  3. Clic en el botón "Atrás" (<).
- **Validación Funcional:** Vuelve a la búsqueda (`/explore`) manteniendo el estado anterior si es posible.
- **Validación Diseño:** El botón debe tener fondo blur o semitransparente para ser visible sobre cualquier imagen.

### [TC-033] - Sticky Footer "Planear Viaje" (Mobile)
- **Prioridad:** Alta
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.6 - Specs Mobile)
- **Precondición:** Vista Mobile, en detalle de ciudad.
- **Pasos:**
  1. Scroll hasta el medio de la página.
- **Validación Funcional:** Debe existir un botón fijo en la parte inferior de la pantalla.
- **Validación Diseño:** Debe ocupar todo el ancho (full width) o estar centrado flotante, con color primario (Gradiente) y sombra superior.

### [TC-034] - Manejo de Errores en Generación (Timeout)
- **Prioridad:** Baja (Edge Case)
- **Origen:** FUNCTIONAL_SPECS.md (Sec 9.1 - Comportamiento)
- **Precondición:** Simular fallo de red o timeout de la IA durante la carga.
- **Pasos:**
  1. Buscar ciudad.
  2. Esperar > 30 segundos (o forzar error).
- **Validación Funcional:** No debe quedar en loading infinito. Debe mostrar pantalla de error con botón "Reintentar".
- **Validación Diseño:** Ilustración de error amigable (no crash de código) y botón de reintento visible.