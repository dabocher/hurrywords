# Bitácora histórica (append-only)

> Cada vez que se cierra una sesión, su resumen se añade aquí.
> No edites entradas anteriores. Solo añades al final.

---

## Sesión inicial — scaffold del harness

- **Features cerradas:** #1 `counter_component`, #2 `format_currency_lib`,
  #3 `home_page_renders`.
- **Resumen:** scaffold inicial de `ejemplo-harness-nextjs` (Next.js App
  Router + TypeScript + Tailwind + Vitest + Testing Library + Playwright).
  `init.sh` verificado en verde (install, typecheck, lint, vitest, build).
- **Pendiente para la próxima sesión:** feature #4 `counter_reset_button`.

---

## Sesión 2 — feature #4 `counter_reset_button`

- **Feature cerrada:** #4 `counter_reset_button` (APPROVED, ver
  `progress/review_counter_reset_button.md`).
- **Resumen:** botón "reset" en `Counter.tsx` que vuelve al valor `initial`
  (no a 0), deshabilitado cuando ya está en ese valor. 3 tests nuevos.
  `./init.sh` en verde (11 tests, build OK).
- **Pendiente para la próxima sesión:** feature #5 `convex_notes_list`
  (primera feature que toca `convex/`; requiere instalar la dependencia
  `convex` y justificarlo, ver `docs/architecture.md`).
