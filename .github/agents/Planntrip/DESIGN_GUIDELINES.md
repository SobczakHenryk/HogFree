Este documento recopila todas las decisiones visuales y de UX que hemos tomado para asegurar que la aplicación se mantenga consistente, moderna y con ese toque "Premium".

***

# 🎨 Plan n' Trip — Design System & Guidelines

Este documento define las reglas visuales y de experiencia de usuario para la aplicación web y móvil de Plan n' Trip. El objetivo es mantener una estética limpia, moderna ("Clean SaaS") y enfocada en la usabilidad.

---

## 1. 🌈 Colores y Paleta

### Identidad de Marca (Brand Identity)
Nuestra firma visual es el **Gradiente Azul-Teal**. No utilizamos colores sólidos planos para las acciones principales.

*   **Brand Gradient:** `linear-gradient(to right, blue.500, teal.400)`
*   **Hex Aproximado:** `#3182CE` → `#38B2AC`
*   **Uso:** Botones principales (CTA), Textos de Títulos "Hero", Logos, Barras de Progreso.

### Colores Semánticos (Status)
Usamos colores para comunicar estado, no decoración.

*   **✅ Éxito / Seguro / Valid:** `green.400` / `green.500` (Ej: Lugares visitados, Presupuesto bajo control).
*   **⚠️ Advertencia / Pendiente:** `orange.400` / `yellow.500` (Ej: Lugares sin evaluar, Ritmo intenso).
*   **🚨 Error / Peligro / Crítico:** `red.500` (Ej: Dislike, Eliminar, Presupuesto excedido).
*   **ℹ️ Información / Neutro:** `blue.500` (Ej: Enlaces, Badges informativos).
*   **🟣 Especial / Combo:** `purple.500` (Ej: Day Trips combinados, Badges de "2 en 1").

### Modos (Light vs Dark)
*   **Light Mode:** Fondos `white` y `gray.50`. Textos `gray.800` y `gray.600`.
*   **Dark Mode:** Fondos `gray.900` y `gray.800`. Textos `white` y `gray.300`.
*   **Regla:** Nunca usar negro puro (`#000`) ni blanco puro en textos sobre fondos de alto contraste.

---

## 2. 🔘 Botones y Acciones

### Botón Principal (Primary CTA)
Se usa para la acción más importante de la pantalla (Generar, Guardar, Login).
*   **Estilo:** Fondo con **Brand Gradient**.
*   **Texto:** Blanco, `fontWeight="bold"`.
*   **Efecto:** `_hover={{ transform: 'scale(1.02)', shadow: 'md' }}`.

### Botón Secundario
Para acciones alternativas (Cancelar, Volver).
*   **Estilo:** `variant="ghost"` o `variant="outline"`.
*   **Color:** `colorScheme="gray"` o `blue`.

### Botones en Tablas/Listas (Action Icons)
Para evitar ruido visual en listas densas.
*   **Estilo:** `IconButton` con `variant="ghost"`.
*   **Forma:** Circular (`isRound`) o cuadrado suave.
*   **Ejemplo:** Lápiz para editar, Papelera para borrar. **Nunca** usar botones rectangulares con borde ("Outline") en filas repetitivas.

### Botones de Selección (Chips/Pills)
Para filtros o categorías (ej: Tipos de comida, Ritmo).
*   **Inactivo:** Fondo `gray.100`, texto gris.
*   **Activo:** Fondo `blue.100` o `teal.100`, texto color marca y borde sutil.

---

## 3. 📝 Tipografía y Textos

*   **Fuente:** Sans-serif moderna (Inter, Roboto, o la por defecto de Chakra UI).
*   **Títulos de Página (Headers):**
    *   Deben llevar un **Icono** a la izquierda (el mismo del menú sidebar).
    *   Color: `blue.600` (Azul corporativo).
    *   Tamaño: `2xl`, `fontWeight="bold"`.
*   **Títulos Hero (Landing/Home):**
    *   Usan `bgClip="text"` con el Brand Gradient.
    *   Tamaño: `4xl` a `6xl`.
*   **Cuerpo:**
    *   Tamaño `md` o `sm`.
    *   Color: `gray.600` (Light) para lectura cómoda.

---

## 4. 📦 Componentes y Layouts

### Inputs y Formularios
*   **Estilo:** `variant="filled"` (Fondo gris suave `gray.50` / `gray.900`).
*   **Bordes:** `rounded="md"` o `lg`.
*   **Iconos:** Siempre usar `InputGroup` con icono a la izquierda para dar contexto.
*   **Validación:** Mensajes de error en rojo pequeño debajo del input, o Toast para errores generales.

### Tarjetas (Cards)
*   **Bento Grid:** Usamos el estilo de "Cajas contenedoras" para agrupar información.
*   **Estilo:** Fondo blanco, `shadow="sm"`, `rounded="xl"`, `border="1px solid gray.100"`.
*   **Hero Cards (Imágenes):**
    *   Imagen de fondo completa.
    *   **Overlay:** Gradiente lineal negro en la parte inferior (`rgba(0,0,0,0)` a `rgba(0,0,0,0.8)`).
    *   Texto: Blanco sobre el overlay.

### Modales y Drawers
*   **Drawer (Panel Lateral):** Para ver **Detalles** o información de "Solo lectura" (Drill-down). Mantiene el contexto.
*   **Modal (Ventana Central):** Para **Acciones** rápidas, confirmaciones o formularios cortos.
*   **Estilo:** `backdropFilter="blur(5px)"` en el overlay para dar efecto de profundidad.

### Tablas
*   **Estilo:** `variant="simple"`.
*   **Full Width:** Evitar scroll horizontal si es posible.
*   **Celdas:** Usar Badges y Avatares. Nunca dejar celdas vacías; usar un guion (`—`) o icono gris para valores nulos.

---

## 5. 🚀 Feedback y Estados de Carga

### Pantallas de Carga (Long Process)
*   **Nunca** usar un spinner simple para procesos largos (IA).
*   **Usar:** Animaciones **Lottie** (Avión, Mapa, Bus).
*   **Texto:** Mensajes rotativos ("Analizando clima...", "Buscando rutas...").
*   **Progreso:** Barra de progreso con gradiente.

### Feedback de Acción
*   **Toast:** Para confirmaciones rápidas ("Guardado exitosamente").
*   **Alert:** Para advertencias en contexto (dentro de un modal).
*   **Skeleton:** Para cargas rápidas de contenido (ej: al abrir un perfil).

---

## 6. 📱 Reglas Específicas Mobile (React Native)

*   **Navegación:** Siempre usar **Bottom Tabs** para las secciones principales.
*   **Acciones:** Botones grandes y fáciles de tocar (`height >= 44px`).
*   **Listas:** Usar `FlatList` con espacio suficiente (`marginBottom`) entre tarjetas.
*   **Safe Area:** Respetar los "Notches" y barras de navegación usando `SafeAreaView` y padding dinámico.
*   **Gestos:** Preferir "Swipe" o tocar tarjetas enteras antes que botones pequeños.

---

## 7. 🚫 Lo que NO hacemos (Anti-patterns)

*   ❌ **Botón Rosa/Magenta:** Eliminado (excepto si Clerk lo fuerza, se debe sobreescribir).
*   ❌ **Bordes duros:** Evitar `borderWidth="2px"` negro o gris oscuro. Usar sombras suaves.
*   ❌ **Alertas Nativas:** No usar `window.alert()` o `Alert.alert()` para flujos normales. Usar UI personalizada.
*   ❌ **Texto sobre imágenes sin protección:** Siempre usar un gradiente o scrim oscuro detrás del texto.

---

## 8. 🌟 Landing Page & Marketing Site

Esta sección aplica **EXCLUSIVAMENTE** a las páginas públicas de marketing (`/`, `/about`, `/features`).

### Identidad Visual (Dark Glassmorphism)
La Landing Page utiliza un lenguaje visual diferente para evocar modernidad y tecnología (IA).

*   **Tema Base:** Dark Mode Only. No existe versión clara de la Landing Page.
*   **Fondo:** Tonos profundos (`#0B0C15` / Violeta oscuro) con degradados radiales sutiles.

### Paleta de Acento (Marketing)
*   **Primario:** Cian / Sky Blue (`#0EA5E9` a `#38BDF8`).
    *   Uso: Botones principales, Iconos activos, Glows.
*   **Secundario:** Violeta (`#8B5CF6`).
    *   Uso: Fondos decorativos, gradientes de texto secundario.

### Componentes de Marketing

#### Botones (Landing Only)
*   **Forma:** "Pill" (Completamente redondeados).
*   **Estilo:** Fondo sólido Cian con sombra de neón (Glow).
*   **Texto:** Negro o Blanco (según contraste óptimo).

#### Glassmorphism
Efecto cristal esmerilado usado en:
*   **Navbar Sticky:** Fondo translúcido con desenfoque (`backdrop-filter: blur(10px)`).
*   **Tarjetas de Features:** Borde sutil blanco/cian y fondo semitransparente.

#### Interactividad
*   **Scroll Suave:** Navegación interna fluida.
*   **Tabs:** Cambio inmediato de contenido sin recarga.
*   **Hover:** Efectos de brillo y escala sutiles en todos los elementos interactivos.