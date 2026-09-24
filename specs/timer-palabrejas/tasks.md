# Tasks: Timer para Palabrejas

## Task 1: Crear `lib/timer-storage.ts`

**Descripción:** Funciones puras de persistencia del timer en localStorage.

**Pasos:**
- Crear archivo `lib/timer-storage.ts` con:
  - `TIMER_STORAGE_KEY(date)` — clave compuesta por fecha.
  - `saveTimerState(date, startedAt, timeCap)` — guarda estado.
  - `loadTimerState(date, timeCap)` — carga y calcula `remaining`.
  - `clearTimerState(date)` — borra entrada.

**Acceptance criteria:**
- `loadTimerState` con `startedAt: null` → `{ remaining: 60 }`.
- `loadTimerState` con `startedAt` hace 30s, `timeCap: 60` → `{ remaining: 30 }`.
- `loadTimerState` con `startedAt` hace 70s, `timeCap: 60` → `{ remaining: 0 }`.
- `loadTimerState` sin datos previos → `{ remaining: 60 }`.
- Graceful handling de JSON corrupto (return fallback).

**Tests:** `lib/timer-storage.test.ts` (7 tests)

---

## Task 2: Crear hook `hooks/use-timer.ts`

**Descripción:** Hook reutilizable que gestiona countdown, persistencia y estados.

**Pasos:**
- Crear `hooks/use-timer.ts` con:
  - `useTimer(duration: number, date: string)` → `{ remaining, status, startTimer, isExpired }`.
  - Carga estado de localStorage al montar.
  - Countdown con `setInterval` de 1s cuando status = "running".
  - Persiste `startedAt` en cada tick.
  - `startTimer()` inicia el countdown desde idle.

**Acceptance criteria:**
- Estado inicial: `status = "idle"`, `remaining = duration`.
- `startTimer()` → `status = "running"`.
- Countdown decrementa de 60 a 0.
- Al llegar a 0: `status = "expired"`, `remaining = 0`.
- Al montar con estado persistente de `running` (startedAt hace 20s, duration 60) → `remaining = 40`.
- Al montar con estado persistente de `expired` (startedAt hace 70s, duration 60) → `remaining = 0`.
- No memory leaks: interval se limpia al desmontar.

**Tests:** `hooks/use-timer.test.ts` (6 tests)

---

## Task 3: Crear componente `<Timer>`

**Descripción:** Componente visual del countdown numérico.

**Pasos:**
- Crear `components/game/palabrejas/timer.tsx` con:
  - Props: `{ remaining, status }`.
  - Formato `MM:SS`.
  - Colores por rango: idle=stone-500, >30s=emerald-400, >10s=amber-400, <=10s=red-400, expired=red-500.
  - Estilo: texto grande, centrado, debajo del ScoreBoard.

**Acceptance criteria:**
- Muestra `01:00` cuando status = "idle".
- Muestra `00:45` cuando remaining = 45.
- Tiene clase `text-emerald-400` cuando remaining > 30.
- Tiene clase `text-amber-400` cuando remaining > 10 y <= 30.
- Tiene clase `text-red-400` cuando remaining <= 10.
- Tiene clase `text-red-500` cuando status = "expired".
- Formato siempre MM:SS (ej: `00:05` no `0:5`).

**Tests:** `components/game/palabrejas/timer.test.tsx` (7 tests)

---

## Task 4: Crear componente `<GameOverOverlay>`

**Descripción:** Modal de fin de juego con resultados.

**Pasos:**
- Crear `components/game/palabrejas/game-over-overlay.tsx` con:
  - Props: `{ score, words, onNextGame, onClose }`.
  - Overlay semi-transparente (`bg-stone-950/80`).
  - Título "¡Se acabó el tiempo!".
  - Puntuación total grande.
  - Listado de palabras encontradas (scrollable).
  - Botón "Siguiente juego" (mock).
  - Botón "Cerrar".

**Acceptance criteria:**
- Muestra score en texto grande.
- Muestra cada palabra en el listado.
- Botón "Siguiente juego" existe y llama a `onNextGame`.
- Botón "Cerrar" existe y llama a `onClose`.
- Overlay cubre toda el área de juego (fixed/absolute positioning).
- Listado de palabras con scroll si hay muchas.

**Tests:** `components/game/palabrejas/game-over-overlay.test.tsx` (7 tests)

---

## Task 5: Integrar Timer en Palabrejas

**Descripción:** Modificar `components/game/palabrejas/index.tsx` para usar el timer.

**Pasos:**
1. Importar `useTimer`, `Timer`, `GameOverOverlay`.
2. Crear timer: `useTimer(60, getTodayStr())`.
3. Conectar `startTimer` a `handleLetterClick` (si status = "idle").
4. `useEffect` para detectar `isExpired` → set `gameOver = true`.
5. Añadir `<Timer>` debajo de `<ScoreBoard>`.
6. Añadir `<GameOverOverlay>` condicional al final del return.
7. Bloquear letras del Board cuando `isExpired || gameOver`.
8. Bloquear input en `handleSubmit` cuando expirado.

**Acceptance criteria:**
- Timer arranca al primer input válido (primer click en letra).
- Countdown visible y actualizado en tiempo real.
- Al expirar, overlay aparece con score y palabras.
- Letras del Board se deshabilitan al expirar.
- `handleSubmit` no procesa palabras cuando expirado.
- Timer persiste al recargar la página (mantiene tiempo restante).
- Si se recarga sin haber empezado, timer arranca desde 60s.

**Tests:** No se añaden tests unitarios al componente principal (es un integration component). La integración se verifica con E2E manual.

---

## Task 6: Añadir mutation placeholder en Convex

**Descripción:** Mutation para registrar palabras encontradas al timeout.

**Pasos:**
- Añadir `registerTimeoutWords` mutation en `convex/palabrejas.ts`.
- Por ahora: placeholder que devuelve `{ registered: true }`.
- La integración real con el pool del siguiente juego se hace después.

**Acceptance criteria:**
- Mutation existe y acepta `{ date, words }`.
- No throws al llamarla.
- Comentada en código la intención futura de integración.

**Tests:** No aplica (mutation de placeholder).

---

## Task 7: Tests generales y verificación

**Descripción:** Ejecutar todo el suite de tests y verificar build.

**Pasos:**
- Ejecutar `npm test` → todos los tests (existentes + nuevos) deben pasar.
- Ejecutar `tsc --noEmit` → sin errores.
- Ejecutar `npm run build` → compilación exitosa.
- Verificación manual del flujo completo de timer.

**Acceptance criteria:**
- 0 errores de TypeScript.
- 0 tests fallidos.
- Build exitoso.
- Flujo manual verificado: timer arranca, countdown corre, persiste, overlay aparece.
