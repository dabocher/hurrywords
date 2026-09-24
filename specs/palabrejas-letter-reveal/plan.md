# Plan: Letras ocultas y revelado progresivo en Palabrejas

## Estructura de archivos a crear/modificar

```
hooks/
  use-letter-reveal.ts              ← NUEVO (lógica de revelado/desaparición)
  use-letter-reveal.test.ts         ← NUEVO (tests del hook)

components/game/palabrejas/
  board.tsx                         ← MODIFICADO (prop isVisible en Hexagon)
  board.test.tsx                    ← MODIFICADO (tests de visibilidad)
  index.tsx                         ← MODIFICADO (botón iniciar, countdown, integración hook)

convex/
  palabrejas.ts                     ← MODIFICADO (checkWord acepta visibleLetters)
```

## Detalle de cada archivo

### 1. `hooks/use-letter-reveal.ts` — Lógica de revelado/desaparición

Hook que gestiona el ciclo completo de revelado progresivo y desaparición de letras exteriores.

**API:**
```ts
type RevealPhase = "hidden" | "countdown" | "revealing" | "all-visible" | "disappearing";

interface UseLetterRevealReturn {
  phase: RevealPhase;
  visibleExteriorIndices: number[];
  countdownSeconds: number;
  gameStarted: boolean;
  onStart: () => void;
  allLetters: string[]; // las 6 letras exteriores
}
```

**Lógica interna:**
- `visibleExteriorIndices` se calcula a partir del `elapsedTime` (tiempo desde `onStart`).
- **Countdown** (0-5s): 3 revelados en t=4, t=2, t=0.
- **Revelando** (0-15s tras countdown): 1 revelado cada 5s hasta completar 6.
- **All-visible**: las 6 letras visibles.
- **Desapareciendo** (cuando `timerRemaining < 30`): 1 desaparición cada 5s.
- Bidireccional: si toca revelar una ya escondida, reaparece.

**Detalles de implementación:**
```ts
import { useState, useEffect, useCallback, useRef } from "react";

export type RevealPhase = "hidden" | "countdown" | "revealing" | "all-visible" | "disappearing";

const COUNTDOWN_DURATION = 5;
const REVEAL_INTERVAL = 5;
const REVEAL_COUNTDOWN_REVEALS = 3;
const DISAPPEAR_INTERVAL = 5;
const DISAPPEAR_TRIGGER_REMAINING = 30;

export const useLetterReveal = (allLetters: string[]) => {
  const [phase, setPhase] = useState<RevealPhase>("hidden");
  const [visibleExteriorIndices, setVisibleExteriorIndices] = useState<number[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [letterOrder] = useState(() => shuffleIndices());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shuffleIndices = () => {
    const indices = [0, 1, 2, 3, 4, 5];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  const onStart = useCallback(() => {
    setPhase("countdown");
    setCountdownSeconds(COUNTDOWN_DURATION);
    setVisibleExteriorIndices([]);
    setGameStarted(false);
    setElapsedTime(0);

    countdownRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        const next = prev - 1;
        // Revelados en countdown: 4s, 2s, 0s
        if (next === 4 || next === 2 || next === 0) {
          setVisibleExteriorIndices((current) => {
            const count = Math.floor((COUNTDOWN_DURATION - next));
            return [...current, letterOrder[current.length] ?? current.length];
          });
        }
        if (next <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          setPhase("revealing");
          setGameStarted(true);
        }
        return next;
      });
    }, 1000);
  }, [letterOrder]);

  // Revelado progresivo durante el juego
  useEffect(() => {
    if (phase !== "revealing" && phase !== "all-visible" && phase !== "disappearing") return;
    if (!gameStarted) return;

    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + REVEAL_INTERVAL;
        // Revelar: cada 5s hasta 6 letras
        const totalReveals = REVEAL_COUNTDOWN_REVEALS + Math.floor(next / REVEAL_INTERVAL);
        if (totalReveals <= 6) {
          setVisibleExteriorIndices((current) => {
            if (current.length >= 6) return current;
            const nextIndex = current.length;
            if (!current.includes(letterOrder[nextIndex])) {
              return [...current, letterOrder[nextIndex]];
            }
            return current;
          });
        }
        return next;
      });
    }, REVEAL_INTERVAL * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, gameStarted, letterOrder]);

  // Disparición cuando quedan < 30s (se maneja desde el componente padre con el timer)
  // El hook expone una función para trigger la desaparición
  const triggerDisappear = useCallback((timerRemaining: number) => {
    if (timerRemaining >= DISAPPEAR_TRIGGER_REMAINING) return;
    const elapsedForDisappear = DISAPPEAR_TRIGGER_REMAINING - timerRemaining;
    const disappearCount = Math.floor(elapsedForDisappear / DISAPPEAR_INTERVAL);
    const hiddenIndices = new Set([...Array(6).keys()].filter((i) => !visibleExteriorIndices.includes(i)));

    setVisibleExteriorIndices((current) => {
      // Eliminar las primeras letras que aún están visibles
      const toRemove = Math.min(disappearCount, current.length);
      if (toRemove === 0) return current;
      // Seleccionar cuáles quitar (las más antiguas visibles)
      const indicesToRemove = new Set(
        current.slice(0, toRemove)
      );
      return current.filter((_, i) => !indicesToRemove.has(current[i]));
    });
  }, [visibleExteriorIndices]);

  return {
    phase,
    visibleExteriorIndices,
    countdownSeconds,
    gameStarted,
    onStart,
    triggerDisappear,
    allLetters: allLetters.slice(0, 6),
  };
};
```

**Problema con la lógica anterior:** La desaparición necesita saber el `timerRemaining` que viene del componente padre. Además, el revelado progresivo necesita sincronizarse con el timer del juego.

**Solución mejorada:** El hook `useLetterReveal` gestiona solo el countdown y el revelado. La desaparición se maneja en el componente `Palabrejas` con un `useEffect` que llama a una función expuesta por el hook.

### 2. `hooks/use-letter-reveal.test.ts`

Tests para:
- Estado inicial: `phase = "hidden"`, `visibleExteriorIndices = []`
- `onStart()`: `phase = "countdown"`, `countdownSeconds = 5`
- Countdown 4s: `visibleExteriorIndices.length === 1`
- Countdown 2s: `visibleExteriorIndices.length === 2`
- Countdown 0s: `gameStarted = true`, `visibleExteriorIndices.length === 3`, `phase = "revealing"`
- Revelado progresivo: cada 5s aumenta en 1 hasta llegar a 6
- Fase disappearing: reduce letras visibles
- Bidireccional: reaparición de letras escondidas
- Central nunca incluida

### 3. `components/game/palabrejas/board.tsx` — Prop `isVisible` en Hexagon

**Cambios:**
- `Hexagon` recibe nueva prop `isVisible: boolean`.
- Si `isVisible === false`: `opacity: 0`, `pointer-events: none`, `user-select: none`.
- Si `isVisible === true`: opacity normal.
- Transición CSS: `transition-opacity duration-300 ease-in-out`.
- El Board recibe `visibleExteriorIndices` del hook y las pasa a cada Hexagon.

**Código del Hexagon modificado:**
```tsx
const Hexagon = ({ letter, isCenter, onClick, disabled, style, isVisible }: HexagonProps) => (
  <div
    style={{
      ...style,
      opacity: isVisible ? 1 : 0,
      transition: "opacity 0.3s ease-in-out",
      pointerEvents: isVisible ? "auto" : "none",
    }}
  >
    ...
  </div>
);
```

**Código del Board modificado:**
```tsx
export const Board = ({
  letters,
  centerLetter,
  onLetterClick,
  disabled,
  visibleExteriorIndices,
}: BoardProps & { visibleExteriorIndices: number[] }) => {
  ...
  {OUTER_POSITIONS.map((pos, i) => {
    const isVisible = visibleExteriorIndices.includes(i);
    return <Hexagon isVisible={isVisible} ... />;
  })}
};
```

### 4. `components/game/palabrejas/index.tsx` — Integración completa

**Cambios:**
1. Importar `useLetterReveal`.
2. Crear hook: `const { phase, visibleExteriorIndices, countdownSeconds, gameStarted, onStart, triggerDisappear } = useLetterReveal(config.letters)`.
3. Estado `timerStarted` para controlar cuándo el timer de 90s arranca.
4. Botón "Iniciar juego" visible cuando `phase === "hidden"`.
5. Countdown visual (grande, centrado) visible cuando `phase === "countdown"`.
6. `useEffect` para iniciar el timer cuando `gameStarted` se vuelve true y `timerStarted` es false.
7. `handleLetterClick` solo acepta letras cuyo índice exterior está en `visibleExteriorIndices`.
8. `checkWord` se envía con el set de letras visibles.
9. `useEffect` para llamar `triggerDisappear` cuando `remaining < 30`.
10. Botón "Iniciar juego" oculta el feedback de palabras.

**Botón "Iniciar juego":**
```tsx
{phase === "hidden" && (
  <button
    onClick={onStart}
    className="px-8 py-3 bg-amber-400 text-stone-900 font-bold text-lg rounded-xl
               hover:bg-amber-300 transition-colors"
  >
    Iniciar juego
  </button>
)}
```

**Countdown visual:**
```tsx
{phase === "countdown" && (
  <div className="text-8xl font-bold text-amber-400 animate-pulse">
    {countdownSeconds}
  </div>
)}
```

**Conexión del timer:**
```tsx
const [timerStarted, setTimerStarted] = useState(false);

useEffect(() => {
  if (gameStarted && !timerStarted) {
    setTimerStarted(true);
    startTimer();
  }
}, [gameStarted, timerStarted, startTimer]);
```

**Letras visibles para validación:**
```tsx
const visibleLetters = useMemo(() => {
  const outerLetters = letters.filter((l) => l !== centerLetter);
  return [centerLetter, ...visibleExteriorIndices.map((i) => outerLetters[i])];
}, [letters, centerLetter, visibleExteriorIndices]);
```

**Trigger de desaparición:**
```tsx
useEffect(() => {
  if (status === "running" && remaining < 30) {
    triggerDisappear(remaining);
  }
}, [remaining, status, triggerDisappear]);
```

### 5. `convex/palabrejas.ts` — `checkWord` con `visibleLetters`

**Cambios:**
- `checkWord` query recibe nuevo arg opcional `visibleLetters: v.optional(v.array(v.string()))`.
- La validación de letras usa `visibleLetters` si se envía, sino `config.letters` (fallback).
- El feedback de "letras no permitidas" menciona las letras visibles.

```ts
export const checkWord = query({
  args: {
    input: v.string(),
    date: v.string(),
    visibleLetters: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { input, date, visibleLetters }) => {
    const config = await ctx.db
      .query("palabrejas_daily")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!config) return { valid: false, reason: "No hay configuración para hoy." };

    const letters = visibleLetters ?? config.letters;
    const center = visibleLetters ? visibleLetters.find((l) => config.letters.includes(l) && !config.letters.filter((x, i) => config.letters.indexOf(x) > i).includes(l)) ?? config.centerLetter : config.centerLetter;
    // ... resto de validación usando `letters` en vez de `config.letters`
  },
});
```

**Simplificación:** El centro siempre es `config.centerLetter`. Las letras permitidas son `[centerLetter, ...visibleLettersExteriores]` si se envía el arg, sino `config.letters`.

```ts
const effectiveLetters = visibleLetters ?? config.letters;
```

## Tests a implementar

### `hooks/use-letter-reveal.test.ts`
- Estado inicial: `phase = "hidden"`, `visibleExteriorIndices = []`, `gameStarted = false`
- `onStart()`: `phase = "countdown"`, `countdownSeconds = 5`
- Countdown 4s: `visibleExteriorIndices.length === 1`
- Countdown 2s: `visibleExteriorIndices.length === 2`
- Countdown 0s: `gameStarted = true`, `visibleExteriorIndices.length === 3`, `phase = "revealing"`
- Revelado progresivo: cada 5s aumenta en 1 hasta llegar a 6
- Fase disappearing: reduce letras visibles proporcionalmente al tiempo
- Bidireccional: reaparición de letras escondidas
- No incluye índice duplicado

### `components/game/palabrejas/board.test.tsx`
- Hexagon con `isVisible={false}` tiene `opacity: 0` y `pointer-events: none`
- Hexagon con `isVisible={true}` tiene `opacity: 1` y `pointer-events: auto`
- Board renderiza letras correctas según `visibleExteriorIndices`
- Transición CSS `transition-opacity` presente

## Orden de implementación

1. `hooks/use-letter-reveal.ts` — lógica de revelado (sin dependencias)
2. `hooks/use-letter-reveal.test.ts` — tests del hook
3. `components/game/palabrejas/board.tsx` — prop `isVisible` en Hexagon
4. `components/game/palabrejas/board.test.tsx` — tests de visibilidad
5. `components/game/palabrejas/index.tsx` — integración completa
6. `convex/palabrejas.ts` — `checkWord` con `visibleLetters`
7. Tests generales y verificación

## Verificación final

- `tsc --noEmit` pasa sin errores.
- `npm test` pasa todos los tests existentes + nuevos.
- `npm run build` compila exitosamente.
- Verificar manualmente:
  - Al cargar: solo central visible, botón "Iniciar juego" presente.
  - Al iniciar: countdown 5→0, letras aparecen en 4s, 2s, 0s.
  - Durante juego: letras aparecen cada 5s hasta tener todas.
  - A 30s: letras empiezan a desaparecer.
  - Solo se aceptan palabras con letras visibles.
  - Bidireccional: letras pueden reaparecer.
