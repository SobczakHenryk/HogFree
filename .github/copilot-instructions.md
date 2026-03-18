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

## 🔒 Reglas Generales

- No ejecutar comandos git (commit, push, pull) a menos que el usuario lo pida explícitamente.
- Seguir las convenciones del proyecto existente.
- Consultar la documentación del proyecto en `docs/` cuando sea relevante.
