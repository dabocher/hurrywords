# Plan: Timer para Palabrejas

## Estructura de archivos a crear/modificar

```
hooks/
  use-timer.ts              ← NUEVO (hook reutilizable)
  use-timer.test.ts         ← NUEVO (tests del hook)

components/
  game/
    palabrejas/
      timer.tsx               ← NUEVO (componente visual del countdown)
      timer.test.tsx          ← NUEVO (tests del componente)
      game-over-overlay.tsx   ← NUEVO (modal de fin de juego)
      game-over-overlay.test.tsx  ← NUEVO (tests del overlay)
      index.tsx               ← MODIFICADO (integrar timer + overlay)

lib/
  timer-storage.ts          ← NUEVO (persistencia localStorage del timer)
  timer-storage.test.ts     ← NUEVO (tests de persistencia)

convex/
  palabrejas.ts             ← MODIFICADO (añadir mutation para registrar palabras al timeout)
```

## Detalle de cada archivo

### 1. `lib/timer-storage.ts` — Persistencia del timer

Funciones puras para guardar/cargar el estado del timer en `localStorage`.

**API:**
- `TIMER_STORAGE_KEY(date: string): string` — clave de storage compuesta por la fecha del juego.
- `saveTimerState(date: string, startedAt: number | null, timeCap: number): void` — guarda el timestamp de inicio y el time cap. Si `startedAt` es `null`, borra la entrada (juego no iniciado).
- `loadTimerState(date: string, timeCap: number): { startedAt: number | null, remaining: number }` — carga el estado. Calcula `remaining = timeCap - Math.floor((now - startedAt) / 1000)`. Si `startedAt` es `null`, devuelve `remaining = timeCap`. Si `remaining < 0`, devuelve `0`.
- `clearTimerState(date: string): void` — borra la entrada de storage.

**Detalle de implementación:**
```ts
const TIMER_STORAGE_KEY = (date: string) => `hurrywords_timer_${date}`;

export const saveTimerState = (date: string, startedAt: number | null, timeCap: number) => {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY(date), JSON.stringify({ startedAt, timeCap }));
  } catch {}
};

export const loadTimerState = (date: string, timeCap: number) => {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY(date));
    if (!raw) return { startedAt: null, remaining: timeCap };
    const { startedAt, timeCap: storedTimeCap } = JSON.parse(raw);
    if (!startedAt) return { startedAt: null, remaining: timeCap };
    const remaining = (storedTimeCap ?? timeCap) - Math.floor((Date.now() - startedAt) / 1000);
    return { startedAt, remaining: remaining < 0 ? 0 : remaining };
  } catch {
    return { startedAt: null, remaining: timeCap };
  }
};

export const clearTimerState = (date: string) => {
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY(date));
  } catch {}
};
```

### 2. `hooks/use-timer.ts` — Hook reutilizable

Hook que gestiona el countdown, persistencia y estados del timer.

**API:**
- `useTimer(duration: number, date: string)` devuelve un objeto:
  ```ts
  {
    remaining: number;       // segundos restantes (0 si expirado)
    status: "idle" | "running" | "expired";
    startTimer: () => void;  // llama al iniciar primera letra
    isExpired: boolean;      // alias de status === "expired"
  }
  ```

**Detalle de implementación:**
- Al montar, carga el estado desde `localStorage` con `loadTimerState`.
- Si `startedAt` es `null` → `status = "idle"`, `remaining = duration`.
- Si `startedAt` tiene valor y `remaining > 0` → `status = "running"`, inicia countdown.
- Si `startedAt` tiene valor y `remaining <= 0` → `status = "expired"`, `remaining = 0`.
- El countdown usa `useEffect` + `setInterval` de 1 segundo que decrementa `remaining`.
- Cuando `remaining` llega a 0 → cambia a `status = "expired"` y dispara `onEnd` si existe.
- Cada tick actualiza `localStorage` con el `startedAt` original (para que si se recarga, el tiempo restante se mantenga).
- `startTimer()` establece `startedAt = Date.now()` si estaba en `idle`.

**Código del hook:**
```ts
import { useState, useEffect, useCallback, useRef } from "react";
import { loadTimerState, saveTimerState } from "@/lib/timer-storage";

export type TimerStatus = "idle" | "running" | "expired";

export const useTimer = (duration: number, date: string) => {
  const [remaining, setRemaining] = useState(duration);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Cargar estado persistente al montar
  useEffect(() => {
    const { startedAt, remaining: loadedRemaining } = loadTimerState(date, duration);
    startedAtRef.current = startedAt;

    if (startedAt) {
      setRemaining(loadedRemaining);
      setStatus(loadedRemaining > 0 ? "running" : "expired");
      if (loadedRemaining <= 0) {
        setStatus("expired");
      }
    }
  }, [date, duration]);

  // Efecto de countdown cuando está corriendo
  useEffect(() => {
    if (status !== "running") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  // Guardar persistencia cada vez que cambia el estado
  useEffect(() => {
    if (status === "running" && startedAtRef.current) {
      saveTimerState(date, startedAtRef.current, duration);
    }
    if (status === "idle") {
      saveTimerState(date, null, duration);
    }
  }, [status, remaining, date, duration]);

  const startTimer = useCallback(() => {
    if (status === "idle") {
      startedAtRef.current = Date.now();
      setStatus("running");
      saveTimerState(date, startedAtRef.current, duration);
    }
  }, [status, date, duration]);

  return { remaining, status, startTimer, isExpired: status === "expired" };
};
```

### 3. `components/game/palabrejas/timer.tsx` — Componente visual

Renderiza el countdown numérico con colores según tiempo restante.

**Props:**
```ts
type TimerProps = {
  remaining: number;
  status: TimerStatus;
};
```

**Detalle de implementación:**
- Formatea `remaining` como `MM:SS` (ej: `00:45`).
- Colores por rango (usando clases de Tailwind):
  - `status === "idle"` → `text-stone-500` (gris, muestra `01:00`).
  - `remaining > 30` → `text-emerald-400` (verde).
  - `remaining > 10` → `text-amber-400` (amarillo).
  - `remaining <= 10` → `text-red-400` (rojo).
  - `status === "expired"` → `text-red-500` (rojo intenso).
- Estilo: texto grande, centrado, debajo del ScoreBoard.

### 4. `components/game/palabrejas/game-over-overlay.tsx` — Modal de fin

Overlay que cubre el tablero al expirar el timer.

**Props:**
```ts
type GameOverOverlayProps = {
  score: number;
  words: FoundWord[];
  onNextGame: () => void;
  onClose: () => void;
};
```

**Detalle de implementación:**
- Overlay semi-transparente (`bg-stone-950/80`) que cubre toda el área de juego.
- Contenido centrado:
  - Título: "¡Se acabó el tiempo!"
  - Puntuación total grande.
  - Número de palabras encontradas.
  - Listado de palabras encontradas (scrollable, estilo compacto).
  - Botón "Siguiente juego" (mock: llama a `onNextGame` que por ahora no hace nada).
  - Botón "Cerrar" (cierra el overlay, devuelve al usuario al juego bloqueado).

### 5. Modificación de `components/game/palabrejas/index.tsx`

Integración del timer y game over overlay.

**Cambios:**

1. **Importar nuevo hook y componentes:**
   ```ts
   import { useTimer } from "@/hooks/use-timer";
   import { Timer } from "./timer";
   import { GameOverOverlay } from "./game-over-overlay";
   ```

2. **Estado adicional:**
   ```ts
   const [gameOver, setGameOver] = useState(false);
   ```

3. **Crear timer:**
   ```ts
   const { remaining, status, startTimer, isExpired } = useTimer(60, getTodayStr());
   ```

4. **Conectar `startTimer` al primer input válido:**
   - En `handleLetterClick`, si `status === "idle"`, llamar `startTimer()`.
   - Esto hace que el timer arranque apenas se presiona la primera letra.

5. **Bloquear input cuando expira:**
   - Si `isExpired` o `gameOver`, los botones de letras y el input se deshabilitan.
   - En `handleSubmit`, añadir chequeo: `if (isExpired || gameOver) return;`

6. **Detectar expiración y mostrar overlay:**
   - `useEffect` que cuando `isExpired` se vuelve `true`, establece `gameOver = true`.

7. **Agregar `<Timer>` debajo del `<ScoreBoard>`:**
   ```tsx
   <Timer remaining={remaining} status={status} />
   ```

8. **Agregar `<GameOverOverlay>` al final del return:**
   ```tsx
   {gameOver && (
     <GameOverOverlay
       score={totalScore}
       words={foundWords}
       onNextGame={() => {}}
       onClose={() => setGameOver(false)}
     />
   )}
   ```

9. **Deshabilitar letras del Board:**
   - Pasar prop `disabled={isExpired || gameOver}` al Board para que no se puedan clickear letras.

10. **Deshabilitar WordInput:**
    - No se necesita cambiar mucho porque `handleSubmit` ya retorna si `isExpired`, pero añadir `disabled` visual para claridad.

### 6. `convex/palabrejas.ts` — Mutation para registrar palabras al timeout

Cuando el timer expira, registrar las palabras encontradas en Convex para que se integren en el pool del siguiente juego como mágicas.

**Nueva mutation:**
```ts
export const registerTimeoutWords = mutation({
  args: { date: v.string(), words: v.array(v.object({
    normalizedLemma: v.string(),
    displayLemma: v.string(),
    score: v.number(),
    isMagic: v.boolean(),
    isPalabreja: v.boolean(),
  }))},
  handler: async (ctx, { date, words }) => {
    // Guardar las palabras del timeout en la tabla de user_game_sessions
    // Para ahora, las palabras se marcan como mágicas y se persisten en el daily_pool
    // del usuario para el siguiente juego.
    // La lógica exacta dependerá de la tabla de sessions que se cree.
    // Por ahora, se hace un "no-op" que devuelve las palabras.
    return { registered: true, words };
  },
});
```

**Nota:** La integración completa con el pool del siguiente juego se hará cuando se implemente la tabla de sesiones de juego. Por ahora, las palabras se guardan en localStorage y se persisten correctamente. La mutation es un placeholder que se rellenará después.

## Tests a implementar

### `lib/timer-storage.test.ts`
- `saveTimerState` y `loadTimerState` guardan/leean correctamente.
- `loadTimerState` con `startedAt: null` devuelve `remaining = duration`.
- `loadTimerState` con `startedAt` en el futuro devuelve `remaining = duration`.
- `loadTimerState` con `startedAt` hace 30s devuelve `remaining = duration - 30`.
- `loadTimerState` con `startedAt` hace 70s devuelve `remaining = 0`.
- `clearTimerState` borra la entrada.
- Graceful handling de JSON corrupto.

### `hooks/use-timer.test.ts`
- Estado inicial es `idle` con `remaining = duration`.
- `startTimer()` cambia a `running`.
- Countdown decrementa correctamente.
- Al llegar a 0, cambia a `expired`.
- Al montar con estado persistente de `running` (startedAt hace 20s con duration 60), `remaining = 40`.
- Al montar con estado persistente de `expired` (startedAt hace 70s con duration 60), `remaining = 0`.

### `components/game/palabrejas/timer.test.tsx`
- Muestra countdown en formato `MM:SS`.
- Tiene color verde cuando `remaining > 30`.
- Tiene color amarillo cuando `remaining > 10`.
- Tiene color rojo cuando `remaining <= 10`.
- Muestra `01:00` cuando `status = "idle"`.
- Muestra color rojo intenso cuando `status = "expired"`.

### `components/game/palabrejas/game-over-overlay.test.tsx`
- Muestra puntuación total.
- Muestra número de palabras encontradas.
- Muestra listado de palabras.
- Tiene botón "Siguiente juego".
- Tiene botón "Cerrar".
- Al hacer clic en "Siguiente juego" llama a `onNextGame`.
- Al hacer clic en "Cerrar" llama a `onClose`.

## Orden de implementación

1. `lib/timer-storage.ts` — persistencia (sin dependencias)
2. `hooks/use-timer.ts` — hook (depende de timer-storage)
3. `components/game/palabrejas/timer.tsx` — componente visual (sin dependencias internas)
4. `components/game/palabrejas/game-over-overlay.tsx` — overlay (usa FoundWords)
5. `components/game/palabrejas/index.tsx` — integración (usa todos los anteriores)
6. `convex/palabrejas.ts` — mutation placeholder (independiente)
7. Tests de cada archivo (en paralelo con la implementación)

## Verificación final

- `tsc --noEmit` pasa sin errores.
- `npm test` pasa todos los tests existentes + nuevos.
- `npm run build` compila exitosamente.
- Verificar manualmente:
  - Timer arranca al primer input.
  - Timer persiste al recargar la página.
  - Timer muestra countdown con colores correctos.
  - Al expirar, overlay aparece con puntuación y palabras.
  - Letras e input se bloquean al expirar.
