# CHECKPOINTS — Evaluación del estado final

> En sistemas multi-agente no se evalúa el camino, se evalúa el destino.
> Estos son los checkpoints objetivos que un juez (humano o IA) puede usar
> para decidir si el proyecto está sano.

## C1 — El arnés está completo

- [ ] Existen los 4 archivos base: `AGENTS.md`, `init.sh`, `feature_list.json`,
      `progress/current.md`.
- [ ] Existen los 3 docs: `docs/architecture.md`, `docs/conventions.md`,
      `docs/verification.md`.
- [ ] `./init.sh` termina con exit code 0 (incluye install, typecheck, lint,
      tests de Vitest y build de producción).

## C2 — El estado es coherente

- [ ] Como mucho una feature en `in_progress` en `feature_list.json`.
- [ ] Toda feature `done` tiene tests asociados que pasan.
- [ ] `progress/current.md` está vacío o describe la sesión activa
      (no contiene basura de sesiones anteriores).

## C3 — El código respeta la arquitectura

- [ ] `app/`, `components/`, `lib/` (y `convex/` si aplica) respetan las
      capas descritas en `docs/architecture.md`.
- [ ] Toda dependencia añadida a `package.json` está justificada en
      `feature_list.json` o en el informe del implementer (ver regla de
      "dependencias controladas").
- [ ] No hay `any` sin justificar, ni `console.log` de debug, ni TODOs sin
      contexto.
- [ ] `"use client"` solo aparece donde es estrictamente necesario.

## C4 — La verificación es real

- [ ] Hay al menos un test (Vitest) por componente nuevo en `components/` y
      por función nueva en `lib/`.
- [ ] Los tests de componentes usan Testing Library con queries por rol o
      `aria-label`/`data-testid`, no por clases CSS.
- [ ] `npm test` (Vitest, modo `run`) muestra > 0 tests y todos verdes.
- [ ] Si alguna feature tiene `requires_e2e: true`, su test en
      `tests/e2e/*.spec.ts` existe y pasó (`npm run test:e2e`), con el
      resultado pegado en `progress/impl_<feature>.md`.

## C5 — La sesión se cerró bien

- [ ] No hay archivos sin trackear sospechosos (`*.tmp`, `.next/`,
      `node_modules/`, `playwright-report/`, `test-results/` — todos deben
      estar en `.gitignore`).
- [ ] `progress/history.md` tiene una entrada por la última sesión.
- [ ] La última feature trabajada está reflejada en su estado correcto.

---

**Cómo usar este archivo:** un agente revisor (`.opencode/agents/reviewer.md`)
recorre cada checkbox, marca `[x]` o `[ ]`, y rechaza el cierre de sesión
si quedan boxes vacíos en C1-C5.
