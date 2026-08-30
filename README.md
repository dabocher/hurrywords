# ejemplo-harness-nextjs

Proyecto de ejemplo que demuestra los principios de **Harness Engineering**
aplicados a una app Next.js (App Router) + TypeScript + Tailwind, con
Vitest/Testing Library para tests unitarios y Playwright para e2e.

> El código de la aplicación es deliberadamente simple (un contador y una
> función de formateo). Lo importante de este repo no es **qué** hace, sino
> **cómo** está estructurado para que un agente de IA pueda trabajar sobre
> él de forma autónoma y verificable, sin quedar atascado pidiendo permiso
> para instalar dependencias.

## Cómo está organizado el arnés

| Pilar                               | Manifestación en este repo                                        |
| ------------------------------------- | --------------------------------------------------------------------- |
| **1. El repositorio ES el sistema** | `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/`, `docs/` |
| **2. Orquestación multi-agente**    | `.opencode/agents/leader.md`, `implementer.md`, `reviewer.md`       |
| **3. Supervisión y mejora**         | `CHECKPOINTS.md`, hooks en `.opencode/settings.json`, `tests/`    |

## Diferencia clave frente a un harness de stdlib

`init.sh` **instala las dependencias él mismo** (`npm ci` / `npm install`)
como parte de la verificación, antes de correr typecheck/lint/tests/build.
El agente nunca necesita pedir permiso para instalar un paquete ni inventar
un workaround porque falte uno: si `package.json` cambió, `init.sh` lo
refleja en `node_modules` automáticamente. Esto es lo que evita el bucle
infinito de "falta una dependencia pero el arnés no me deja instalarla".

Añadir una dependencia nueva sigue requiriendo justificación (ver
`docs/architecture.md` → "Dependencias controladas"), pero esa justificación
es documental, no un bloqueo técnico.

## Para empezar

```bash
./init.sh
```

Si todo está verde, abre `AGENTS.md` y sigue desde ahí.

## Para usar la app (humanos)

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Probarlo tú mismo con un agente de código

Si te descargas el repo y abres tu agente (Claude Code, OpenCode, etc.) en
la raíz, ya estás dentro del arnés: `AGENTS.md` fuerza al modelo a actuar
como `leader` (orquesta, no edita código).

Receta rápida:

1. `./init.sh` — debe terminar verde (install, typecheck, lint, vitest, build).
2. Abre `feature_list.json` y deja al menos una feature con `status: "pending"`.
   Ya hay una preparada: `#5 convex_notes_list`. Si todas están en `done`,
   añade una nueva al final del array o reabre una existente.
3. Lanza tu agente en la raíz del repo.
4. Pídele literalmente: **«implementa la siguiente feature pendiente»**.

Lo que verás en chat:

- El **leader** anuncia el plan, lanza un `implementer` y luego un `reviewer`.
- Por chat **no pasa código** — solo referencias del tipo
  `done -> progress/impl_<feature>.md`. Esa es la regla anti-teléfono-descompuesto.

Dónde queda la traza de cada subagente (esto es la "visualización" persistente):

| Archivo                        | Quién lo escribe | Qué contiene                                |
| -------------------------------- | ------------------ | ---------------------------------------------- |
| `progress/current.md`          | leader            | Plan vivo de la sesión                      |
| `progress/impl_<feature>.md`   | implementer       | Archivos tocados + output de los tests      |
| `progress/review_<feature>.md` | reviewer          | Checklist contra `docs/` y `CHECKPOINTS.md` |
| `feature_list.json`            | implementer       | `pending` → `in_progress` → `done`          |
| `progress/history.md`          | leader            | Resumen append-only al cerrar la sesión     |

Abre `progress/` en tu editor mientras el agente trabaja: cada informe
aparece en cuanto el subagente termina. Así puedes auditar paso a paso quién
decidió qué — el contenido no circula por chat, vive en disco y queda
versionado.

## Estructura

```
.
├── AGENTS.md              # Mapa para agentes (divulgación progresiva)
├── CHECKPOINTS.md         # Criterios de "estado final correcto"
├── feature_list.json      # Alcance: una feature a la vez
├── init.sh                # Verificación e inicialización (instala deps)
├── progress/
│   ├── current.md         # Sesión activa (estado vivo)
│   └── history.md         # Bitácora append-only
├── docs/
│   ├── architecture.md    # Qué significa "buen trabajo", capas, Convex
│   ├── conventions.md     # Estilo, nombres, errores (TS/React/Tailwind)
│   └── verification.md    # Cómo verificar que funciona (Vitest/Playwright)
├── .opencode/
│   ├── agents/             # Definiciones de líder, implementador, revisor
│   └── settings.json       # Hooks que automatizan la verificación
├── app/                    # App Router: páginas, layouts, route handlers
├── components/             # Componentes de UI reutilizables
├── lib/                    # Lógica pura, sin JSX, testeable sin DOM
├── convex/                 # Funciones de Convex (cuando una feature lo requiera)
└── tests/
    └── e2e/                 # Tests Playwright (solo features con requires_e2e)
```

## Aprendizajes que ilustra este proyecto

- **Divulgación progresiva** en `AGENTS.md`: el agente no recibe todas las
  reglas de golpe, recibe un mapa para buscarlas bajo demanda.
- **Una feature a la vez** validado por `init.sh` (rechaza más de un
  `in_progress` en `feature_list.json`).
- **Estado en disco**, no en chat: `progress/current.md` y `history.md`
  sobreviven a reinicios y context windows reventadas.
- **Verificación ejecutable real**: `init.sh` instala dependencias, hace
  typecheck, lint, corre Vitest y hace `next build` — no se fía de lo que
  diga el agente.
- **Patrón Líder-Trabajador-Revisor**: el líder no implementa, el
  implementador no se autoaprueba, el revisor no edita código.
- **Anti teléfono-descompuesto**: los subagentes escriben sus resultados
  en archivos y solo devuelven una referencia ligera.
- **Dependencias como decisión documentada, no como bloqueo técnico**: se
  pueden instalar paquetes nuevos, pero cada uno se justifica por escrito.
# hurrywords
