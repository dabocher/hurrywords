# Informe del implementer — Feature #4 `counter_reset_button`

## Archivos modificados

- `components/Counter.tsx` — añadido tercer botón con `aria-label="reiniciar"`.
  `onClick` llama a `setCount(initial)` (no a `setCount(0)`, para respetar
  un `initial` distinto de cero). `disabled={count === initial}`.
- `components/Counter.test.tsx` — añadidos 3 tests: reset tras incrementar,
  reset tras decrementar, y botón disabled en el estado inicial /
  habilitado tras un cambio.

## Diseño

- **Por qué `setCount(initial)` y no `setCount(0)`:** la prop `initial` ya
  existía y puede ser distinta de 0 (ver test `reset returns to initial
  after incrementing`, que usa `initial={5}`). Resetear a 0 a secas habría
  violado el criterio de aceptación "vuelve exactamente a la prop initial".
- **Por qué `disabled` en vez de ocultar el botón:** mantiene el layout
  estable (no hay salto de botones al hacer click) y comunica visualmente
  que "ya estás en el valor inicial" sin un mensaje aparte.
- Sin nuevas dependencias, sin nuevas capas, sin tocar `lib/` ni `app/`.

## Output del último `./init.sh`

```
── 7. Tests unitarios / componentes (Vitest) ────────────
✓ components/Counter.test.tsx (7 tests) 370ms
✓ lib/format-currency.test.ts (4 tests) 16ms

 Test Files  2 passed (2)
      Tests  11 passed (11)
[OK]    Todos los tests de Vitest pasan

── 8. Build de producción ───────────────────────────────
✓ Compiled successfully in 8.0s
  Finished TypeScript in 5.3s ...
✓ Generating static pages using 1 worker (4/4) in 176ms
[OK]    next build completado sin errores

── 9. Resumen ──────────────────────────────────────────
[OK]    Entorno listo. Puedes empezar a trabajar.
```

11 tests verdes (8 previos + 3 nuevos para `counter_reset_button`).

## Estado final en `feature_list.json`

Feature #4 `counter_reset_button` → `status: "done"`. No quedan features en
`in_progress`.
