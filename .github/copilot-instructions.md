# Copilot Global Instructions

## 📚 Consulta Obligatoria de Skills

**REGLA CRÍTICA — Antes de escribir, modificar o refactorizar cualquier código:**

1. **SIEMPRE** lee los archivos `SKILL.md` y/o `AGENTS.md` relevantes de `.github/skills/` según las tecnologías involucradas en la tarea:

   | Tecnología | Skills a consultar |
   |---|---|
   | React / Next.js | `react-best-practices/AGENTS.md`, `react-patterns/SKILL.md`, `react-ui-patterns/SKILL.md`, `react-state-management/SKILL.md` |
   | React Native / Mobile | `react-native-architecture/SKILL.md`, `mobile-developer/SKILL.md`, `mobile-design/SKILL.md` |
   | Node.js / Backend | `nodejs-backend-patterns/SKILL.md`, `nodejs-best-practices/SKILL.md` |
   | Tailwind CSS | `tailwind-patterns/SKILL.md`, `tailwind-design-system/SKILL.md` |
   | Chakra UI | `chakra-patterns/SKILL.md` |
   | Python | `python-patterns/SKILL.md`, `python-pro/SKILL.md`, `python-performance-optimization/SKILL.md` |
   | Seguridad | `security-auditor/SKILL.md` |
   | SEO | `programmatic-seo/SKILL.md` |
   | Prompts / Agentes | `prompt-engineering/SKILL.md`, `prompt-engineer/SKILL.md` |
   | Modernización React | `react-modernization/SKILL.md` |
   | Notion / Tareas | `notion-rules/SKILL.md` |

2. **NUNCA** comiences a escribir código sin haber leído al menos la skill principal relevante para la tarea.
3. Si la tarea involucra **múltiples tecnologías**, lee **TODAS** las skills aplicables antes de comenzar.
4. **Aplica activamente** las reglas, patrones y mejores prácticas descritas en las skills leídas.
5. Si no estás seguro de qué skill aplica, lee las que más se acerquen al contexto de la tarea.

**Ruta base de las skills:** `.github/skills/`

## � Flujo SDD — Obligatorio antes de cualquier desarrollo

**REGLA CRÍTICA ABSOLUTA — Todo desarrollo debe pasar por el flujo Spec-Driven Development (SDD). Sin excepción.**

### Antes de escribir una sola línea de código, verifica:

| Artefacto | Ubicación | Obligatorio |
|---|---|---|
| `spec.md` | `specs/NNN-feature-name/spec.md` | ✅ Siempre |
| `plan.md` | `specs/NNN-feature-name/plan.md` | ✅ Siempre |
| `tasks.md` | `specs/NNN-feature-name/tasks.md` | ✅ Siempre |

**Si alguno de estos artefactos no existe → DETENTE. No escribas código.**

---

### Flujo según tipo de pedido

#### 🆕 Nueva funcionalidad
1. Verificar si cabe en una spec existente o requiere spec nueva.
2. La spec DEBE incluir historia de usuario con criterios de aceptación.
3. Generar (o actualizar) `plan.md` con `/speckit.plan`.
4. Generar (o actualizar) `tasks.md` con `/speckit.tasks`.
5. Solo entonces comenzar la implementación.

#### 🐛 Bug reportado
1. **Primero analizar la causa raíz**:
   - ¿El comportamiento no estaba especificado / era ambiguo en el spec? → **Bug de spec**: actualizar el spec para clarificar el caso, luego regenerar plan y tasks si corresponde.
   - ¿El spec era claro y la implementación no lo respetó? → **Bug de implementación**: corregir el código sin modificar el spec (a menos que el análisis revele que la spec era incompleta).
2. En ambos casos, documentar el hallazgo en la spec antes de tocar código.

---

### Regla de sincronía — spec ↔ plan ↔ tasks

> **Siempre que se cree o modifique un `spec.md`, se deben regenerar `plan.md` y `tasks.md`** (usando `/speckit.plan` y `/speckit.tasks`) antes de continuar con la implementación.

- Un cambio en spec que afecte requisitos, entidades o flujos → regenerar plan + tasks.
- Un cambio menor (typo, clarificación sin impacto técnico) → no requiere regenerar.

---

## �🔒 Reglas Generales

- No ejecutar comandos git (commit, push, pull) a menos que el usuario lo pida explícitamente.
- Seguir las convenciones del proyecto existente.
- Consultar la documentación del proyecto en `docs/` cuando sea relevante.
