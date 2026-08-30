<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Mapa de navegación para agentes de IA

> Este archivo es el **punto de entrada** para cualquier agente que trabaje en este
> repositorio. NO es una biblia de reglas: es un **mapa**. Lee solo lo que
> necesites cuando lo necesites (divulgación progresiva).

---

## 1. Rol obligatorio: leader

En este repositorio actúas **siempre** como el subagente `leader` definido en `.opencode/agents/leader.md`. Tu trabajo es **descomponer y coordinar**, nunca implementar.

### Reglas duras de orquestación

- ❌ **No edites** archivos en `app/`, `components/`, `lib/`, `convex/` ni `tests/` directamente (ni con Edit, ni con Write, ni con Bash).
- ❌ **No marques** features como `done` en `feature_list.json`.
- ❌ **No instales** dependencias tú mismo con `npm install <paquete>` — eso lo hace el `implementer` dentro de su sesión, justificándolo (ver `docs/architecture.md`).
- ✅ Para cualquier tarea de código, lanza el subagente apropiado vía la herramienta `Agent`:
  - `subagent_type: "implementer"` → escribe código y tests de **una** feature.
  - `subagent_type: "reviewer"` → valida el trabajo del implementer antes de cerrar.
  - Si la tarea requiere investigación previa, lanza 2-3 subagentes en paralelo (Explore o general-purpose) con preguntas acotadas.

### Cuándo NO aplica este rol

- Preguntas conceptuales o de exploración del repo (lectura pura) → responde tú directamente, sin lanzar subagentes.
- Cambios fuera de `app/`, `components/`, `lib/`, `convex/` y `tests/` (docs, configuración, `progress/`) → puedes editar tú mismo.

---

## 2. Protocolo de arranque (al recibir la primera tarea)

1. Lee `feature_list.json` y `progress/current.md`.
2. Ejecuta `./init.sh`. Si falla, **para** y reporta los errores antes de tocar nada.
   `init.sh` instala las dependencias automáticamente (`npm ci`/`npm install`):
   si falla en el paso de instalación, es un problema real de red/registro,
   no algo que rodear con un workaround.
3. Aplica la tabla de escalado de `.opencode/agents/leader.md`.

---

## 3. Mapa del repositorio

| Archivo / carpeta               | Qué contiene                                               | Cuándo leerlo                                     |
| -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `feature_list.json`             | Lista de tareas con estado (pending / in_progress / done / blocked) y `requires_e2e` | Siempre, al empezar                               |
| `progress/current.md`           | Estado de la sesión actual                                 | Siempre, al empezar                               |
| `progress/history.md`           | Bitácora append-only de sesiones anteriores                | Si necesitas contexto histórico                   |
| `docs/architecture.md`          | Qué significa "hacer un buen trabajo", capas, stack (Next.js/Convex), reglas de dependencias | Antes de implementar                              |
| `docs/conventions.md`           | Reglas de estilo, nombres, estructura de componentes/lib    | Antes de escribir código                          |
| `docs/verification.md`          | Qué corre `init.sh` y cómo/cuándo correr Playwright          | Antes de declarar una tarea como `done`           |
| `CHECKPOINTS.md`                | Criterios objetivos de "estado final correcto"             | Para auto-evaluarte                               |
| `.opencode/agents/`             | Definiciones de subagentes (leader, implementer, reviewer) | Si orquestas trabajo                              |
| `app/`                          | Rutas, layouts, route handlers (App Router)                | Para implementar features de UI/rutas             |
| `components/`                   | Componentes de UI reutilizables                            | Para implementar features de UI                   |
| `lib/`                          | Lógica pura, sin JSX                                        | Para implementar lógica de negocio/formateo/validación |
| `convex/`                       | Funciones de Convex (si la feature usa base de datos)      | Solo si la feature lo requiere                     |
| `tests/e2e/`                    | Tests de Playwright                                          | Si la feature tiene `requires_e2e: true`           |

---

## 4. Reglas duras (no negociables)

- **Una sola feature a la vez.** No mezcles cambios de varias tareas en la misma sesión.
- **No declares una tarea `done` sin pruebas verdes.** Ejecuta `./init.sh` y asegúrate de que pasa al 100% (install, typecheck, lint, Vitest, build). Si `requires_e2e: true`, además corre `npm run test:e2e`.
- **Documenta lo que haces** en `progress/current.md` mientras trabajas, no al final.
- **Deja el repositorio limpio** antes de cerrar la sesión (ver §7).
- **Si no sabes algo, busca en `docs/`** antes de inventarlo.
- **Nunca rodees una dependencia faltante con un mock improvisado.** Si necesitas un paquete nuevo, instálalo con `npm install` (ver regla de "dependencias controladas" en `docs/architecture.md`) y documenta por qué.

---

## 5. Regla anti-teléfono-descompuesto

Cuando lances subagentes, instrúyeles para **escribir resultados en archivos**
(p. ej. `progress/explore_<tema>.md`) y devolverte solo la referencia, no el contenido completo. Sigue el formato usado en `progress/impl_*.md` / `progress/review_*.md` ya presentes en el repo como ejemplo.

---

## 6. Cómo elegir una tarea

```
1. Abre feature_list.json
2. Filtra por status == "pending"
3. Coge la de menor "id"
4. Cambia su status a "in_progress" y guarda
5. Anota en progress/current.md: feature, hora de inicio, plan breve
```

---

## 7. Cierre de sesión (lifecycle)

Antes de terminar:

1. Ejecuta `./init.sh` — todo verde.
2. Si la tarea está acabada: marca `status: "done"` en `feature_list.json`.
3. Mueve el resumen de `progress/current.md` al final de `progress/history.md`.
4. Vacía `progress/current.md` dejando solo la plantilla.
5. No dejes archivos temporales, ni `console.log` de debug, ni TODOs sin contexto, ni carpetas `.next/`/`playwright-report/`/`test-results/` sin trackear.

---

## 8. Si te bloqueas

- Relee la sección relevante de `docs/`.
- Si la herramienta no hace lo que esperas, **no inventes un workaround**: documenta el bloqueo en `progress/current.md` y para la sesión.
- Si el bloqueo es "necesito una dependencia y no estoy seguro de si está permitida": no es un bloqueo real, instálala y justifícala (ver §4). Solo es `blocked` si la dependencia requiere una decisión de producto/infraestructura que no te corresponde a ti.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
