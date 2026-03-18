# ⚙️ Especificaciones Funcionales — Plan n' Trip

Este documento define la lógica de negocio, flujos de datos y comportamientos esperados del sistema. Cualquier desviación de estas reglas se considera un **Bug Funcional**.

---

## 1. Landing Page


### 1.1. 🧭 Navegación y Header

#### Barra de Navegación (Navbar)
- **Comportamiento Responsive:**
  - **Desktop:** Muestra enlaces de texto y botones de acción (Iniciar Sesión/Registrarse) visibles.
  - **Mobile:** Oculta los enlaces y muestra un **Menú Hamburguesa**. Al hacer clic, debe desplegar un Drawer lateral.
- **Selector de Idioma:**
  - Debe permitir cambiar entre ES/EN.
  - **Acción:** Al seleccionar un idioma, todo el texto de la página debe actualizarse instantáneamente sin recargar la página.
  - **Persistencia:** La preferencia debe guardarse en `localStorage` para futuras visitas.
- **Navegación Interna (Smooth Scroll):**
  - Los enlaces "Características", "Cómo Funciona", "Destinos" no recargan la página.
  - **Acción:** Desplazamiento suave (Smooth Scroll) hasta la sección correspondiente en la Landing Page.
- **Botones de Acceso:**
  - **"Iniciar Sesión":** Redirige a `/login`.
  - **"Registrarse":** Redirige a `/register`.
  - **"Planntrip" (Logo):** Vuelve al inicio / Top of page.

#### Detección de Sesión (Lógica de Clerk)
- **Si el usuario YA está logueado:**
  - Redirige a `/dashboard` inmediatamente.
  - Al hacer clic en el boton planntrip que esta arriba a la izquierda, redirige a `/dashboard` inmediatamente.

---

### 1.2. ⚡ Hero Section (Pantalla Principal)

#### Botones de Llamada a la Acción (CTA)
- **Botón Principal ("Comenzar Gratis"):**
  - Si el usuario es nuevo: Redirige a `/register`.

#### Mockup Interactivo (Product Preview)
- **Visualización:** Muestra una representación de la interfaz del itinerario (Dashboard/Mapa) en un contenedor estilizado (Glassmorphism).
- **Interacción:** Puede tener animaciones sutiles (elementos flotantes) pero no es un carrusel de imágenes tradicional.

---

### 1.3. 🎛️ Sección de Características (Interactive Tabs)

#### Sistema de Pestañas
- **Layout:**
  - **Izquierda/Arriba:** Lista de funcionalidades (Tabs) seleccionables (ej: "Itinerarios Inteligentes", "Control de Gastos").
  - **Derecha/Abajo:** Panel de contenido que cambia dinámicamente según el Tab seleccionado.
- **Comportamiento:**
  - **Estado Activo:** El Tab seleccionado se ilumina (Cian) y muestra un indicador visual.
  - **Contenido:** Al hacer clic, cambia inmediatamente la imagen ilustrativa y el texto descriptivo asociado sin recargar.
  - **Auto-Play (Opcional):** Puede rotar automáticamente si el usuario no interactúa.

#### Visualización de Tarjetas (Grid de Destinos)
- Sección "Explora el mundo" más abajo.
- Tarjetas con imagen full-bleed y textos superpuestos.
- Hover: Zoom suave en la imagen.

---

### 1.4. 🦶 Cierre y Footer

#### CTA Final (Pre-Footer)
- **Botón "Comenzar Gratis":** Debe tener la misma lógica de redirección que el botón del Hero (verificar si está logueado o no).

#### Enlaces Legales
- **Privacidad y Términos:**
  - Deben ser enlaces funcionales que lleven a `/privacy` y `/terms`.
- **Redes Sociales:**
  - Los iconos de LinkedIn/Instagram deben abrir los perfiles oficiales en una nueva pestaña.

---

### 1.5. 🔍 SEO y Performance (No visible)

- **Meta Tags:** La página debe tener definidos `title` y `description` correctos para SEO.
- **Carga de Imágenes:** Las imágenes del carrusel deben usar `lazy loading` o estar optimizadas para no bloquear el renderizado inicial (LCP).

---

## 2. Páginas de Autenticación (login y register)

### 2.1. 🎨 Layout y Diseño General (Split Screen)

#### Comportamiento Desktop (Pantallas grandes)
- **Estructura:** La pantalla debe dividirse en dos columnas de 50% de ancho cada una.
- **Columna Izquierda (Inspiracional):**
  - **Fondo:** Imagen de alta calidad (Mapa azulado/Viaje) con un overlay oscuro para contraste.
  - **Contenido:**
    - Título: "Planifica, viaja y disfruta" (Texto Blanco).
    - Subtítulo: "Olvídate de pasar horas investigando..." (Texto Blanco/Gris claro).
    - Cita/Filosofía: Recuadro translúcido en la parte inferior con la frase de filosofía de marca.
- **Columna Derecha (Formulario):**
  - Fondo: Color sólido (Blanco en Light Mode, Gris Oscuro `gray.900` en Dark Mode).
  - Contenido: El componente de Clerk centrado vertical y horizontalmente.

#### Comportamiento Mobile (Pantallas pequeñas)
- **Estructura:** Diseño de "Fondo Inmersivo".
- **Fondo:** La imagen del mapa azul debe ocupar toda la pantalla (`100vh`, `100vw`).
- **Contenido:**
  - El formulario de Clerk debe aparecer como una **Tarjeta Centrada** (Card) flotando sobre la imagen.
  - **Ocultamiento:** Los textos grandes de marketing (Título/Subtítulo) deben ocultarse en móvil para evitar solapamientos y ruido visual.

#### Selector de Idioma:
  - Debe permitir cambiar entre ES/EN.
  - **Acción:** Al seleccionar un idioma, todo el texto de la página debe actualizarse instantáneamente sin recargar la página.
  - **Persistencia:** La preferencia debe guardarse en `localStorage` para futuras visitas.
---

### 2.2. 🔑 Página de Inicio de Sesión (`/login`)

#### Componentes de UI
- **Header:** Debe estar simplificado. Solo debe mostrar:
  1. Logo de Plan n' Trip (Izquierda).
  2. Toggle de Tema (Luna/Sol).
  3. **NO** debe mostrar el botón "Iniciar Sesión" (redundante).
- **Formulario (Clerk):**
  - **Botón Principal:** Debe usar el **Gradiente de Marca** (Azul-Teal), nunca el color rosa/fucsia por defecto.
  - **Botones Sociales:** Google, Apple, Facebook (Estilo outline o gris suave).
  - **Inputs:** Email y Contraseña.

#### Lógica de Negocio
- **Redirección de Éxito:** Al autenticarse correctamente, el usuario debe ser redirigido a `/dashboard`.
- **Redirección si ya está logueado:** Si un usuario con sesión activa intenta entrar a `/sign-in`, debe ser rebotado automáticamente a `/dashboard` (Middleware).
- **Manejo de Errores:** Si las credenciales son incorrectas, el componente debe mostrar el mensaje de error *inline* (dentro de la tarjeta), sin recargar la página.

---

### 2.3. 📝 Página de Registro (`/Register`)

#### Componentes de UI
- **Consistencia Visual:** Debe usar exactamente el mismo Layout (Split Screen / Mobile Background) que el Login.
- **Diferenciación de Texto (Columna Izq):**
  - Título: "Tu pasaporte a viajes perfectos".
  - Subtítulo: Enfocado en "Únete gratis".
- **Formulario (Clerk):**
  - Debe solicitar campos adicionales si es necesario (Nombre, Apellido).
  - El botón "Continuar/Registrarse" debe tener el **Gradiente de Marca**.

#### Lógica de Negocio
- **Flujo de Verificación:** Al completar el registro, Clerk enviará un código de verificación al email. La UI debe cambiar para pedir ese código.
- **Post-Registro:**
  - Una vez verificado, el usuario se considera "Nuevo".
  - Redirigir a `/dashboard` (o a un flujo de Onboarding si existiera).
- **Enlace Cruzado:** Debe existir un link claro "Ya tengo cuenta" que lleve a `/sign-in`.

---

### 2.4. 🌙 Modo Oscuro (Dark Mode)

- **Integración:** La página de autenticación debe respetar la preferencia de tema del sistema o del toggle.
- **Adaptación del Formulario:**
  - El contenedor del formulario de Clerk debe cambiar su fondo a oscuro (`#171923` o similar) para fusionarse con el fondo de la columna derecha en desktop.
  - Los textos dentro del formulario deben cambiar a blanco/gris claro automáticamente.

---


## 3. Formulario de Generación de Itinerario

### 3.1. 🌍 Internacionalización (i18n)
- **Alcance:** Todos los textos visibles (etiquetas, placeholders, tooltips, opciones de selectores y mensajes de error) deben ser dinámicos.
- **Trigger:** El cambio de idioma en el `Navbar` (ES/EN) debe actualizar el formulario instantáneamente sin perder los datos ya ingresados.

---

### 3.2. 📝 Campos del Formulario

#### A. Destino (`destination`)
- **Componente:** Input de Texto con integración a **Google Places Autocomplete**.
- **Regla:** Campo **Obligatorio**.
- **Comportamiento:**
  - Debe mostrar sugerencias de ciudades al escribir.
  - Al seleccionar, debe guardar el objeto de ubicación (Nombre, Coordenadas, País).

#### B. Fechas (`startDate`, `endDate`)
- **Componente:** Date & Time Picker (o DatePicker con selectores de hora).
- **Reglas:**
  - Campos **Obligatorios**.
  - `fechaFin` > `fechaInicio`.
  - **Límite Plan Free:** Si la diferencia de días es mayor a **7**, el sistema debe mostrar un aviso (Toast/Alert) y ajustar la fecha final o bloquear la selección.

#### C. Logística
- **Movilidad (`mobility`):**
  - **Tipo:** Segmented Control / Botones de opción exclusiva.
  - **Opciones:**
    1. 🚶 A Pie / Transporte Público (Default).
    2. 🚗 En Auto.
- **Accesibilidad (`withBaby`):**
  - **Tipo:** Switch / Toggle.
  - **Label:** "¿Viajas con bebé/niños?".
  - **Lógica UX:** Si el usuario activa este switch, y el ritmo estaba en "Intenso", el sistema debería sugerir visualmente o cambiar el estado a "Moderado" (aunque permitir que el usuario lo fuerce a Intenso si desea).

#### D. Ritmo del Viaje (`pace`)
- **Tipo:** Tarjetas de selección única (Radio Cards).
- **Opciones:**
  1. 🌿 **Tranquilo (Relaxed):** Prioriza descanso.
  2. ⚖️ **Moderado (Moderate):** Balanceado (Default).
  3. ⚡ **Intenso (Intense):** Maximiza actividades.
- **Validación:** Obligatorio (debe tener un default).

#### E. Configuración Horaria
- **Inicio del Día:** Hora por defecto `08:00 AM`.
- **Fin del Día:** Hora por defecto `10:00 PM`.
- **Validación:** `Fin` debe ser posterior a `Inicio`.

#### F. Días Tranquilos (`quietDays`)
- **Componente:** Switch + Selector de Fechas Múltiple.
- **Comportamiento:**
  - **Switch OFF:** El selector de fechas está oculto o deshabilitado.
  - **Switch ON:** Habilita un selector que permite marcar fechas específicas DENTRO del rango seleccionado en el paso B.

#### G. Hospedaje (`accommodation`)
- **Tipo:** Input de Texto (Opcional).
- **Uso:** Texto libre para ayudar a la IA a optimizar el punto de partida de las rutas.

---

### 3.3. 🚀 Acciones y Flujos

#### Botón Principal: "Generar Itinerario" (IA)
- **Estilo:** Gradiente de marca, prominente.
- **Lógica al hacer Clic:**
  1. **Validación:** Verifica que Destino y Fechas existan.
  2. **Check de Estado:** Verifica si ya existe una generación en curso para este usuario (prevención de doble submit).
  3. **Navegación:** Redirige a la pantalla de **Carga/Espera** (Loading Screen con animación Lottie).
  4. **Backend:** Inicia el proceso de generación con OpenAI.

#### Botón Secundario: "Crear plantilla en blanco" (Manual)
- **Estilo:** Texto simple o botón ghost debajo del principal.
- **Lógica al hacer Clic:**
  1. **Validación:** Verifica SOLO Destino y Fechas. Ignora el resto.
  2. **Acción:** Crea un itinerario vacío en la base de datos (estructura de días sin actividades).
  3. **Navegación:** Redirige inmediatamente a la pantalla de **Edición/Detalle**.

---

### 3.4. 📱 Especificaciones Mobile (Responsive)
- **Layout:**
  - Los inputs de fecha (Llegada/Partida) deben apilarse verticalmente (`flex-direction: column`) en pantallas pequeñas.
  - La sección de Ritmo debe adaptar su grid para ser legible (scroll horizontal o stack vertical compacto).
- **Teclado:** El botón de Generar debe permanecer accesible o el formulario debe tener suficiente padding inferior para que el teclado no lo tape.

---

### 3.5 💾 Manejo de Errores
- **API Error:** Si la solicitud de generación falla inmediatamente (ej: Server Error 500), debe mostrar un Toast rojo y no redirigir a la pantalla de carga.
- **Timeout:** La pantalla de carga debe manejar la lógica de espera larga.

---

## 4. Dashboard o home (mis itinerarios)

### 4.1. 🧭 Layout General y Header

#### Estructura
- **Contenedor:** Ancho máximo restringido (`Container maxW="container.xl"`) para mantener el contenido centrado en pantallas grandes.
- **Header de la Página:**
  - **Título:** "Mis Itinerarios" con **Gradiente de Marca** (Pink->Blue).
  - **Icono:** Icono 3D de avión o Emoji, alineado con el texto.
  - **Subtítulo:** Texto gris descriptivo ("Explora tus próximos viajes...").

---

### 4.2. 📭 Estado Vacío (Empty State)

**Condición:** Se muestra cuando el usuario **NO** tiene ningún itinerario creado en la base de datos.

#### Componente: `EmptyTripCard`
- **Diseño:**
  - Tarjeta con borde punteado (`dashed`) y fondo blanco/transparente.
  - Icono central `+` grande con gradiente.
- **Acción Principal:**
  - Botón: "Comenzar ahora" (Estilo: Solid Brand Gradient).
  - **Comportamiento:** Al hacer clic, redirige a `/generate`.
- **Texto de Ayuda:** Mensaje invitando al usuario a crear su primera aventura.

---

### 4.3. 📂 Listado de Itinerarios (Populated State)

**Condición:** Se muestra cuando el usuario tiene 1 o más itinerarios.

#### Grid de Visualización
- **Layout:**
  - **Desktop:** Grid de 3 columnas (`SimpleGrid columns={3}`).
  - **Tablet:** 2 columnas.
  - **Mobile:** 1 columna.
- **Ordenamiento (Sorting Logic):**
  - Los itinerarios deben ordenarse por **Fecha de Inicio del Viaje**.
  - **Prioridad:**
    1. Viajes Futuros y En Curso (Más próximo a hoy primero).
    2. Viajes Pasados (Más reciente primero, al final de la lista).

---

### 4.4. 🎫 Componente: Tarjeta de Viaje (`ItineraryCard`)

Cada tarjeta en el grid debe mostrar la siguiente información de forma resumida:

#### A. Cabecera (Imagen)
- **Imagen de Fondo:** Foto del destino (`coverImage`).
- **Menú de Contexto (Top Right):** Botón de 3 puntos (`Menu`) que despliega:
  - ✏️ **Editar:** Redirige a la pantalla de edición.
  - 🗑️ **Eliminar:** Abre un Modal de confirmación de borrado.

#### B. Cuerpo (Información)
- **Título:** Nombre del Itinerario (ej: "Viaje a Nueva York").
- **Ubicación:** Icono Pin 📍 + Ciudad, País.
- **Fechas:** Rango formateado (ej: "29 ene - 05 feb").
- **Logística (Icono + Texto):**
  - Debe mostrar el icono de movilidad configurado:
  - 🚗 "Auto" / 🚶 "Pie".
- **Badge de Ritmo:**
  - Píldora de color semántico según la intensidad:
  - 🌿 Tranquilo (Verde) / ⚖️ Moderado (Azul) / ⚡ Intenso (Naranja).

#### C. Footer (Presupuesto)
- **Alineación:** Extremo inferior derecho o distribuido.
- **Dato:** Icono Bolsa de Dinero 💰 + Rango de Costo Estimado (ej: "$25-32").
- **Estilo:** Texto verde oscuro o dorado para denotar dinero.

#### D. Interacción
- **Click en la tarjeta (Área general):** Redirige a `/itinerary/[id]` (Detalle del viaje).

---

### 4.5. 🗑️ Flujo de Eliminación

#### Confirmación
- Al seleccionar "Eliminar" en el menú de la tarjeta, **NO** se debe borrar inmediatamente.
- Debe abrirse un **Alert Dialog** (Modal de peligro):
  - Título: "¿Eliminar itinerario?".
  - Cuerpo: "Esta acción no se puede deshacer. Se perderán todos los datos y gastos asociados."
  - Botón Confirmar: Rojo ("Eliminar").
  - Botón Cancelar: Gris ("Cancelar").

#### Post-Eliminación
- Si la eliminación es exitosa:
  1. Mostrar Toast de éxito ("Itinerario eliminado").
  2. La tarjeta debe desaparecer de la lista sin recargar la página (actualización optimista o re-fetch).
  3. Si era el último viaje, la pantalla debe cambiar al **Estado Vacío**.

---

### 4.6. 📱 Especificaciones Mobile
- **Navegación:**
  - El Dashboard es accesible desde el Tab "Mis Viajes" en la barra inferior.
- **Layout:**
  - Las tarjetas ocupan el 100% del ancho.
  - El botón de "Nuevo Itinerario" (Empty State) debe ser lo suficientemente grande para tocar con el pulgar.

  ---
  
## 5. Detalle del Itinerario

### 5.1. 📍 Hero Card (Encabezado)

#### Visualización de Datos
- **Imagen de Fondo:** Debe mostrar la foto de la ciudad destino (`coverImage`). Si no existe, usar un gradiente de fallback.
- **Títulos:** Nombre del Itinerario, Ciudad, País.
- **Metadatos:**
  - **Fechas:** Rango formateado (ej: "29 ene - 29 ene 2026").
  - **Logística:** Iconos de Ritmo (⚡), Movilidad (🚗/🚶) y Viajeros (👤).
  - **Enlace:** "Ver todos los lugares" -> Abre Google Maps con todos los pines del viaje.

#### Widget de Presupuesto (Tarjeta Flotante)
- **Switch "Gastos Reales":**
  - **Estado Inicial:** `false` (Muestra estimado IA) si `hoy < fechaInicio`. `true` (Muestra real) si el viaje ya empezó.
  - **Lógica:** Al activar, cambia la visualización de "Rango Estimado" a "Total Gastado / Objetivo".
- **Barra de Progreso:**
  - Solo visible en modo "Gastos Reales".
  - Color dinámico: Verde (<80%), Amarillo (80-100%), Rojo (>100%).
- **Edición de Objetivo:**
  - Icono de lápiz (Web: Popover / Mobile: BottomSheet).
  - Permite establecer un `userBudget` manual que sobrescribe el estimado de la IA para el cálculo de la barra.

---

### 5.2. 🛣️ Línea de Tiempo (Timeline)

#### Estructura
- **Orden:** Cronológico estricto por hora de inicio.
- **Conectores:** Línea vertical continua entre actividades.
- **Botón "Ruta" (Travel Pill):**
  - Ubicación: Flotando sobre la línea vertical, entre dos actividades.
  - Acción: Abre Google Maps con la ruta desde `Lugar A` hasta `Lugar B` (modo caminata o auto según configuración).

#### Tarjetas de Actividad
- **Tipos:**
  - **Lugar:** Foto, Título, Categoría, Precio, Duración.
  - **Comida:** Icono (Tenedor), Título genérico o específico.
- **Interacción (Expandir):**
  - **Web:** Acordeón. Al hacer clic, despliega descripción y tips.
  - **Mobile:** Al tocar, abre un Bottom Sheet con el detalle.
- **Acción "Visitado":**
  - **Componente:** Switch o Checkbox circular.
  - **Lógica de Gasto Automático:** Si el lugar es `GRATIS` y se marca como visitado, el sistema debe registrar automáticamente un gasto de `$0` (si no existe uno previo).

#### Audio Guías
- **Visibilidad:** Solo si el lugar tiene `audioUrl`.
- **Botón:** Icono "Play" circular.
- **Comportamiento:**
  - **Web:** Reproductor flotante o modal.
  - **Mobile:** Bottom Sheet persistente de reproducción.

---

### 5.3. 💸 Gestión de Gastos (Wallet Integration)

#### Agregar Gasto (Nivel Actividad)
- **Acceso:** Desde el detalle de la actividad (botón "Agregar Gasto" o input directo si está visitado).
- **Lógica:** El gasto se asocia al ID de esa actividad específica.

#### Agregar Gasto Extra (Nivel Día/Viaje)
- **Ubicación:** Botón ancho al final de la lista del día ("+ Agregar Gasto Extra").
- **Modal:**
  - Campos: Concepto, Monto, Categoría (Select).
  - Al guardar, se suma al total del viaje pero no se vincula a un lugar geográfico.
- **Visualización:** Lista de gastos extras renderizada al final del timeline del día.

---

### 5.4. 🧭 Navegación entre Días
- **Tabs de Fechas:**
  - Lista horizontal de días.
  - El día seleccionado debe estar resaltado (Azul/Teal).
  - Al cambiar de día, la lista de actividades se actualiza sin recargar la página completa.
- **Indicadores:**
  - Si un día es un "Day Trip", el tab debe tener un icono distintivo (🚌).

---

### 5.5. 📱 Especificaciones Mobile (Offline)

#### Persistencia
- **Descarga:** El usuario debe poder descargar el itinerario completo.
- **Modo Avión:**
  - La pantalla debe cargar desde `AsyncStorage` si no hay red.
  - Las imágenes deben estar cacheadas (si se descargaron).
- **Sincronización (Queue):**
  - Si marca "Visitado" o agrega un "Gasto" offline:
    1. Actualizar UI localmente.
    2. Guardar en cola de sync.
    3. Al volver online, enviar al backend y refrescar datos.

---

### 5.6. ⚙️ Acciones Globales
- **Likes/Dislikes:** Botones en el Header o Hero para dar feedback sobre el itinerario generado.
- **Editar:** Botón (Lápiz) que redirige al modo Edición (Drag & Drop).
- **Compartir:** Generar enlace público o PDF (Futuro).

---

## 6. Edición de Itinerario

Esta pantalla es el "Taller" donde el usuario personaliza el viaje generado por la IA. El objetivo es ofrecer flexibilidad total sin romper la lógica temporal.

---

### 6.1. 📅 Navegación por Días

#### Selector de Días (Tabs)
- **Visualización:** Lista horizontal de botones con las fechas del viaje (ej: "12 Mar", "13 Mar").
- **Comportamiento:**
  - Al hacer clic, carga las actividades de ese día específico.
  - El día seleccionado debe estar resaltado (Azul/Brand).
  - No recarga la página, solo cambia el contenido de la lista.

#### Indicadores Especiales
- Si un día ha sido convertido en **Day Trip**, su tab debe tener un icono distintivo (🚌) o un color diferente para alertar que es una escapada.

---

### 6.2. 🛣️ Lista de Actividades (Editor)

#### Reordenamiento (Drag & Drop)
- **Interacción:** El usuario puede arrastrar cualquier tarjeta y soltarla en una nueva posición dentro del mismo día.
- **Lógica de Recálculo (Auto-Schedule):**
  - Al soltar, el sistema debe recalcular automáticamente la `horaInicio` de la actividad movida y de todas las subsiguientes, basándose en la duración de la actividad anterior.
  - **Regla:** No puede haber dos actividades a la misma hora.

#### Tarjeta de Actividad (Componente)
- **Contenido:** Nombre, Hora de Inicio, Duración (Badge), Imagen (si existe) y Botones de Acción.
- **Acciones Rápidas:**
  - 🗑️ **Eliminar:** Borra la actividad y ajusta los tiempos de las siguientes (opcional: o deja un hueco libre).
  - 🔁 **Mover de Día:** (Web: Menú / Mobile: ActionSheet) Permite enviar la actividad al final de la lista de otro día.

#### Ajuste de Duración (Click-to-Edit)
- **Trigger:** Clic en el Badge de tiempo (ej: "60 min").
- **Interfaz:** Popover pequeño (Web) o BottomSheet (Mobile).
- **Controles:** Input numérico y botones rápidos `[-15m]` `[+15m]`.
- **Efecto:** Al guardar, empuja o retrae el resto de la agenda del día (Ripple Effect).

---

### 6.3. ➕ Agregar Nuevos Lugares

#### Acceso
- **Botón:** "+ Buscar y Agregar Lugar" al final de la lista o flotante.

#### Drawer/Modal de Búsqueda (Web & Mobile)
- **Estado Inicial (Descubrimiento):**
  - Muestra una grilla de **"Lugares Recomendados"** (Curados en DB) para esa ciudad.
  - Tarjetas visuales con foto grande, rating y categoría.
- **Buscador (Search):**
  - Input de texto conectado a **Google Places API**.
  - Si el usuario busca algo que no está en la DB, muestra resultados de Google con foto y dirección.
- **Filtros:** Chips para filtrar por categoría (Museos, Parques, Comida).

### Configuración al Agregar
- Al seleccionar un lugar, se abre un formulario intermedio:
  - **Hora:** Pre-llenada (al final del día) o seleccionable.
  - **Duración:** Selector rápido (1h, 2h).
  - **Botón:** "Agregar al Itinerario".

---

### 6.4. 🚌 Escapadas de un Día (Day Trips)

#### Trigger
- **Botón:** "Planear una escapada para este día" (Barra azulada arriba de la lista).

#### Flujo de Selección
1. **Llamada a IA/DB:** Consulta destinos cercanos viables (< 3h viaje).
2. **Modal de Opciones:** Muestra 4 tarjetas de destinos sugeridos.
   - Incluye **"Packs 2 en 1"** (ej: Gante + Brujas) con distintivo visual.
3. **Selección:**
   - **Advertencia:** Alerta de que se borrarán las actividades actuales del día.
4. **Generación:**
   - Animación de carga (Lottie Bus/Mapa).
   - Reemplazo total del día con el nuevo itinerario generado.

---

### 6.5. 💾 Guardado y Persistencia

#### Botón "Guardar Cambios"
- **Ubicación:** Header o Sticky Footer.
- **Comportamiento:**
  - Envía el estado actual del JSON al backend.
  - **Enriquecimiento (Post-Guardado):** Si se agregaron lugares nuevos manualmente que no tienen fotos/detalles, se dispara un proceso en segundo plano ("Enriqueciendo...") para buscar esa info en Google Places y actualizar el itinerario después.

#### Validación
- No permitir guardar si hay días vacíos (opcional) o si hay solapamientos horarios ilógicos (ej: una actividad a las 3 AM por error de cálculo).

---

## 7. Billetera de Viajes (`/gastos`)

### 7.1. 📊 Dashboard Principal (Resumen)

#### Tarjetas de KPIs (Globales)
- **Total Gastado:** Suma de todos los gastos (`gastoReal`) de todos los itinerarios activos e históricos del usuario.
  - *Formato:* Moneda local del usuario o USD por defecto.
- **Viajes con Gastos:** Cantidad de itinerarios donde `gastoReal > 0`.
- **Promedio por Viaje:** `Total Gastado / Viajes con Gastos`.

#### Lista de Tarjetas de Viaje (Grid)
- **Visualización:** Una tarjeta "Fintech Style" por cada itinerario que tenga al menos 1 gasto registrado (o presupuesto activo).
- **Datos de la Tarjeta:**
  - Badge "% GASTADO": Calculado como `(GastoTotal / PresupuestoObjetivo) * 100`.
    - Verde: 0-79%
    - Amarillo: 80-100%
    - Rojo: >100%
  - Título del Viaje + Ubicación.
  - Monto Gastado (Grande) vs Presupuesto Total (Pequeño).
  - Barra de progreso visual en la parte inferior.
- **Interacción:** Al hacer clic en una tarjeta, debe abrir el **Modal de Detalle** (Web) o navegar a la **Pantalla de Detalle** (Mobile).

---

### 7.2. 🧾 Detalle de Gastos (Drill-down)

#### Modal / Pantalla de Detalle
- **Resumen del Viaje:**
  - Dos cajas comparativas: "Total Gastado" (Verde) vs "Presupuesto" (Azul).
  - Barra de progreso general.

#### Desglose por Categoría
- El sistema debe agrupar automáticamente los gastos en categorías predefinidas:
  1. **Comida:** (Restaurantes, Cafés, Snacks).
  2. **Transporte:** (Vuelos, Trenes, Uber, Taxis).
  3. **Alojamiento:** (Hoteles, Airbnb).
  4. **Entradas:** (Museos, Tours, Atracciones).
  5. **Compras:** (Regalos, Ropa).
  6. **Otros:** (Todo lo demás).
- **Visualización:** Lista de barras de progreso por categoría, ordenadas de mayor a menor gasto.
- **Color Coding:** Cada categoría debe tener un color distintivo (ej: Comida=Naranja, Transporte=Azul) para facilitar la lectura.

#### Historial de Movimientos
- Lista cronológica de los últimos gastos registrados.
- Debe mostrar: Fecha, Concepto (Nombre del lugar o gasto extra) y Monto.

#### Navegación Cruzada
- Botón "Ver Itinerario Completo": Debe redirigir al detalle del viaje (`/itinerary/[id]`) para que el usuario pueda editar o ver el contexto.

---

### 7.3. ➕ Registro de Gastos (Input)

#### Fuentes de Datos
El "Gasto Total" se alimenta de dos fuentes:
1.  **Gastos en Actividades:** Montos ingresados en el detalle de un lugar específico del itinerario (ej: "Almuerzo en Joe's Pizza - $20").
2.  **Gastos Extras:** Montos sueltos agregados al final del día (ej: "Taxi al hotel - $15").

#### Lógica de Presupuesto Grupal
- Si el viaje tiene `travelers > 1` y el gasto se marca como "Compartido":
  - El sistema debe dividir el monto por la cantidad de viajeros antes de sumarlo al "Gasto Personal" del usuario.
  - *Nota:* El Dashboard muestra el gasto personal, no el del grupo entero (a menos que se especifique lo contrario en la configuración).

---

### 7.4. 📱 Comportamiento Mobile & Offline

#### Estrategia de Caché (Stale-While-Revalidate)
- Al abrir la Billetera sin internet:
  - Debe mostrar inmediatamente los últimos datos guardados en `AsyncStorage`.
  - Debe mostrar un indicador visual "Modo Offline - Datos estimados".
- **Cálculo Híbrido:**
  - Si el usuario modificó un itinerario localmente (agregó un gasto offline), la pantalla de Billetera debe ser capaz de leer ese archivo local y recalcular el total mostrado, en lugar de mostrar el dato desactualizado del servidor.

#### Persistencia
- Los gráficos y barras de progreso deben renderizarse correctamente con los datos locales.

---

## 8. Gestión de Cuenta y Perfil

### 8.1. 👤 Acceso al Perfil

#### Web (Desktop)
- **Punto de Entrada:** Menú desplegable del Avatar en el Navbar -> Opción "Gestionar cuenta" (`Manage account`).
- **Comportamiento:** Abre un Modal centrado (`<UserProfile />` de Clerk).

#### Mobile (App Nativa)
- **Punto de Entrada:** Pestaña "Perfil" en la barra de navegación inferior.
- **Comportamiento:** Muestra una pantalla nativa de "Mi Perfil" con opciones de lista.

---

### 8.2. 🛡️ Pestañas Estándar (Clerk Nativo)

#### Pestaña "Perfil"
- **Visualización:**
  - Avatar actual.
  - Nombre completo.
  - Nombre de usuario (Username).
  - Correo electrónico (Principal y secundarios).
  - Cuentas conectadas (Google, Apple, Facebook).
- **Edición:**
  - El usuario puede cambiar su foto, nombre y username.
  - El usuario puede agregar/eliminar correos y vincular cuentas sociales.
  - **Validación:** Clerk maneja internamente la validación de emails y unicidad de usernames.

#### Pestaña "Seguridad"
- **Gestión de Contraseña:** Cambio de password.
- **MFA:** Configuración de Autenticación de Dos Factores (si está habilitada).
- **Sesiones Activas:** Ver y cerrar sesiones en otros dispositivos.

---

### 8.3. ⚙️ Pestaña Personalizada: "Preferencias"

**Ubicación:** Nueva pestaña en el menú lateral del modal de usuario (Web) o pantalla dedicada "Preferencias de Viaje" (Mobile).

#### Campos del Formulario
1.  **Ciudad/País de Residencia:**
    - **Tipo:** Input de Texto con Autocompletado (Google Places).
    - **Uso:** Define el punto de partida por defecto para cálculos de vuelos o sugerencias locales (Futuro).
    - **Persistencia:** Se guarda en `user.unsafeMetadata.location`.

2.  **Idioma por Defecto:**
    - **Tipo:** Select (Dropdown).
    - **Opciones:** Español (ES), English (EN).
    - **Comportamiento:**
      - Al cambiarlo y guardar, la aplicación debe recargar o cambiar el idioma de la interfaz inmediatamente (`i18next.changeLanguage`).
      - **Persistencia:** Se guarda en `user.unsafeMetadata.language`.
      - **Prioridad:** Este ajuste sobrescribe la detección automática del navegador.

#### Acción de Guardado
- **Botón "Guardar Preferencias":**
  - **Estilo:** Debe usar el **Gradiente de Marca** (Azul-Teal), no el color por defecto de Clerk.
  - **Feedback:** Mostrar un Toast "Preferencias actualizadas correctamente".

---

### 8.4. 📱 Especificaciones Mobile (App Nativa)

#### Pantalla "Editar Perfil"
- **Diferencia con Web:** No usa el modal de Clerk. Es una pantalla construida manualmente con React Native.
- **Funcionalidad:**
  - **Avatar:** Al tocar, abre la galería/cámara para subir foto. (Sube a Clerk API).
  - **Inputs:** Nombre y Apellido editables.
  - **Guardado:** Botón "Guardar Cambios" que llama a `user.update()`.

#### Pantalla "Preferencias"
- Pantalla separada accesible desde el menú de perfil.
- Replica los campos de Ciudad e Idioma de la web.

---

### 8.5. 🚪 Cierre de Sesión (Sign Out)

- **Acción:**
  - Web: Botón en el menú del Avatar.
  - Mobile: Botón en la pantalla de Perfil o en el Modal de Configuración.
- **Comportamiento:**
  - Limpia tokens de sesión y caché local sensible.
  - Redirige inmediatamente a la **Landing Page** (`/`).

---

## 9. Explorador de Destinos (`/explore`)

### 9.1. 🔍 Buscador y Estado Inicial

#### Hero Search
- **Input:** Autocompletado con Google Places (restringido a ciudades `(cities)`).
- **Comportamiento:**
  - Al seleccionar una ciudad, el sistema debe verificar si ya existe una guía en la base de datos local.
  - **Si existe:** Carga los datos instantáneamente.
  - **Si no existe:** Inicia el proceso de generación con IA (mostrando el componente de carga `CityGuideLoader`).

#### Sección "Inspírate" (Destinos Destacados)
- **Visualización:** Grid de 3 tarjetas con ciudades populares pre-generadas.
- **Contenido:** Imagen de alta calidad, Nombre, País y Badge "⚡ Ver ahora".
- **Interacción:** Al hacer clic, navega directamente a la vista de detalle de esa ciudad sin esperar carga.

---

### 9.2. 🏙️ Vista de Detalle de Ciudad

#### Encabezado (City Hero)
- **Información Estática:**
  - Imagen de fondo representativa.
  - Título y Subtítulo inspiracional.
  - **Tags de Identidad:** Badges que definen la ciudad (ej: "Foodies", "Cultura", "Playa"). Estos vienen del campo `traveler_match.ideal_for`.

#### Selector de Meses
- **Componente:** Lista horizontal de los 12 meses.
- **Indicador de Calidad:** Cada mes debe tener un punto de color o estilo que indique si es una buena época:
  - 🟢 Bueno / Excelente.
  - 🟡 Regular / Aceptable.
  - 🔴 No recomendado / Difícil.
- **Interacción:** Al hacer clic en un mes, **toda la tarjeta de información inferior debe actualizarse** dinámicamente con los datos de ese mes.

---

### 9.3. 📊 Tarjeta de Información Mensual (MonthCard)

Esta es la sección dinámica que responde al selector de meses.

#### Datos Climáticos y Eventos
- **Clima:** Temperatura promedio (Min/Max) y descripción breve.
- **Eventos:** Lista de festivales o eventos clave en ese mes.

#### Semáforo de Pros/Contras
- **Ventajas:** Lista con checks verdes.
- **Desventajas:** Lista con cruces rojas.
- **Lógica:** La IA debe generar estos puntos específicos para el mes seleccionado (ej: "Lluvias frecuentes" en Abril, "Calor extremo" en Agosto).

#### Indicadores Visuales (Logística)
- **Costos:** Representación visual con iconos de dinero (💰) para Alojamiento, Vuelos y Comida. Escala de 1 a 5.
- **Afluencia Turística:**
  - Visualización: Iconos de personas (👤) o barra de progreso.
  - Niveles: Baja, Media, Alta, Muy Alta.
- **Maleta:** Recomendación breve de ropa.
- **Tip del Mes:** Consejo específico y accionable (ej: "Reserva X con antelación").

#### Veredicto
- Un resumen de una frase que califica el mes seleccionado (ej: "Mes excelente por clima, pero caro").

---

### 9.4. 👤 Perfil del Destino (Sección Fija)

Esta información no cambia al seleccionar meses.
- **Ideal para:** Lista de arquetipos de viajeros (Parejas, Mochileros, Lujo).
- **No recomendado si:** Lista de "Deal breakers" (Odias el frío, Buscas playa, Presupuesto bajo).

---

### 9.5. ⏳ Recomendación de Duración

#### Tarjetas de Ritmo
- Debe mostrar 3 opciones calculadas por la IA:
  1. **Tranquilo:** Días sugeridos para ver todo con calma.
  2. **Moderado:** Días sugeridos para un ritmo normal.
  3. **Intenso:** Días mínimos para ver lo esencial corriendo.
- **Acción (Conversión):**
  - Cada tarjeta debe tener un botón o enlace: **"Crear itinerario de {X} días"**.
  - **Comportamiento:** Redirige al Generador (`/generate`) pre-llenando:
    - Destino: Ciudad actual.
    - Ritmo: El seleccionado.
    - Días: Calcula fechas ficticias o pide fechas manteniendo la duración sugerida.

---

### 9.6. 📱 Especificaciones Mobile
- **Layout:**
  - El selector de meses debe ser un scroll horizontal suave.
  - La tarjeta de información mensual debe apilar sus columnas verticalmente.
- **Navegación:**
  - Botón "Atrás" flotante en la imagen Hero para volver al buscador.
  - Botón "Planear viaje" fijo en la parte inferior (Sticky Footer) para asegurar la conversión.