# Verificación — Cómo demostrar que tu trabajo funciona

> "Funciona en mi cabeza" no cuenta. Esto es lo único que cuenta como
> prueba de que una feature está terminada.

## La fuente de verdad es `./init.sh`

`init.sh` ejecuta, en orden, todo lo que decide si el repo está sano:
instala dependencias, type-checks, lint, tests unitarios (Vitest) y build
de producción. Una feature **no está `done`** hasta que `./init.sh` termina
en verde (exit code 0).

## Qué corre cada verificación y por qué

| Comando                | Qué detecta                                              |
| ----------------------- | --------------------------------------------------------- |
| `npm install`           | Que las dependencias declaradas instalan limpio.          |
| `npm run typecheck`     | Errores de tipos (`tsc --noEmit`), sin emitir archivos.   |
| `npm run lint`          | Estilo, imports rotos, reglas de React/Next.js (ESLint).  |
| `npm test`              | Tests unitarios y de componentes (Vitest, modo `run`).    |
| `npm run build`         | Que la app compila para producción (detecta errores que el dev server no muestra, como problemas de Server/Client Components). |

`npm run test:e2e` (Playwright) **no** corre dentro de `init.sh` por
defecto, porque requiere los browsers de Playwright instalados
(`npx playwright install`) y un servidor levantado; es más lento. Se corre
explícitamente cuando la feature toca un flujo de usuario completo (ver
`feature_list.json` → campo `requires_e2e`). Si una feature lo requiere,
el implementer lo ejecuta y pega el resultado en su informe.

## Cómo escribir tests que sirvan de prueba real

- **No mockees lo que estás probando.** Si testeas `formatCurrency`, no
  mockees `Intl.NumberFormat`.
- **Para componentes:** renderiza con Testing Library y interactúa como lo
  haría un usuario (`userEvent.click`, no `fireEvent` salvo necesidad). Si
  el test no falla cuando rompes la feature a propósito, el test no sirve.
- **Para lib/ pura:** cubre el camino feliz, al menos un caso límite, y al
  menos un caso de error si la función puede lanzar.
- **Para Convex (si aplica):** usa el modo de testing de Convex
  (`convex-test`) en vez de mockear el cliente a mano, si el proyecto lo
  tiene instalado. Si no está instalado y una feature lo necesita, repórtalo
  como `blocked` — no lo instales sin pasar por la regla de "dependencias
  controladas" de `docs/architecture.md`.

## Antes de marcar `done`

1. `./init.sh` termina con exit code 0.
2. Si la feature tiene `requires_e2e: true` en `feature_list.json`, además
   corriste `npm run test:e2e` y pegaste el resultado en
   `progress/impl_<feature>.md`.
3. No quedan `console.log` de debug, ni `// TODO` sin issue/contexto, ni
   componentes con `"use client"` innecesario.
4. El reviewer ha emitido `APPROVED` en `progress/review_<feature>.md`.
