# Tasks: Letras ocultas y revelado progresivo en Palabrejas

## Task 1: Crear `hooks/use-letter-reveal.ts`

**Descripción:** Hook que gestiona el ciclo completo de revelado y desaparición de letras exteriores.

**Pasos:**
- Crear archivo `hooks/use-letter-reveal.ts` con:
  - Tipo `RevealPhase = "hidden" | "countdown" | "revealing" | "all-visible" | "disappearing"`.
  - Hook `useLetterReveal(allLetters: string[])` que devuelve:
    - `phase`: fase actual del ciclo.
    - `visibleExteriorIndices`: índices (0-5) de las letras exteriores visibles.
    - `countdownSeconds`: segundos del countdown (5→0), 0 en resto.
    - `gameStarted`: true cuando el countdown llega a 0.
    - `onStart()`: inicia el countdown de 5s.
    - `triggerDisappear(timerRemaining: number)`: reduce letras visibles cuando quedan < 30s.
  - Lógica de countdown: revelados en t=4, t=2, t=0 (3 letras).
  - Lógica de revelado progresivo: 1 letra cada 5s hasta completar 6.
  - Lógica de desaparición: 1 letra cada 5s cuando `timerRemaining < 30`.
  - Bidireccional: si toca revelar una ya escondida, reaparece.
  - Selección aleatoria determinística por partida (shuffle al inicio).

**Acceptance criteria:**
- Estado inicial: `phase = "hidden"`, `visibleExteriorIndices = []`, `gameStarted = false`.
- `onStart()` cambia a `phase = "countdown"`, `countdownSeconds = 5`.
- Countdown 4s: `visibleExteriorIndices.length === 1`.
- Countdown 2s: `visibleExteriorIndices.length === 2`.
- Countdown 0s: `gameStarted = true`, `visibleExteriorIndices.length === 3`, `phase = "revealing"`.
- Revelado progresivo: cada 5s aumenta en 1 hasta llegar a 6.
- `triggerDisappear(28)` reduce letras visibles.
- No hay índices duplicados en `visibleExteriorIndices`.
- `triggerDisappear` es bidireccional (reaparece si toca revelar).

**Tests:** `hooks/use-letter-reveal.test.ts` (8 tests)

---

## Task 2: Tests de `hooks/use-letter-reveal.ts`

**Descripción:** Tests unitarios para el hook de revelado.

**Pasos:**
- Crear `hooks/use-letter-reveal.test.ts`.
- Tests para cada fase del ciclo.
- Tests para bidireccionalidad.
- Tests para no duplicación de índices.

**Acceptance criteria:**
- Todos los tests pasan.
- Cobertura de: hidden, countdown, revealing, all-visible, disappearing.
- Test de bidireccionalidad (reaparición).
- Test de no duplicación.

---

## Task 3: Modificar `components/game/palabrejas/board.tsx` — Prop `isVisible`

**Descripción:** El componente `Hexagon` recibe una prop `isVisible` para controlar su opacidad.

**Pasos:**
- Añadir `isVisible: boolean` a las props de `Hexagon` (default `true`).
- Si `isVisible === false`: `opacity: 0`, `pointer-events: none`.
- Si `isVisible === true`: opacity normal.
- Añadir `transition-opacity duration-300 ease-in-out` a la transición.
- El `Board` recibe nueva prop `visibleExteriorIndices: number[]`.
- Cada Hexagon exterior recibe `isVisible={visibleExteriorIndices.includes(index)}`.
- El Hexagon central siempre es `isVisible={true}`.

**Acceptance criteria:**
- Hexagon con `isVisible={false}` tiene `opacity: 0` en el DOM.
- Hexagon con `isVisible={false}` tiene `pointer-events: none`.
- Hexagon con `isVisible={true}` tiene `opacity: 1`.
- Transición CSS `transition-opacity` presente en todos los Hexagon.
- Board renderiza correctamente según `visibleExteriorIndices`.
- Central siempre visible.

**Tests:** `components/game/palabrejas/board.test.tsx` (4 tests nuevos)

---

## Task 4: Tests de visibilidad en Board

**Descripción:** Tests para verificar el comportamiento de `isVisible` en Hexagon y Board.

**Pasos:**
- En `board.test.tsx`, añadir:
  - `isVisible={false}` → `opacity: 0` y `pointer-events: none`.
  - `isVisible={true}` → `opacity: 1` y `pointer-events: auto`.
  - Board con `visibleExteriorIndices` parcial → solo esas letras visibles.
  - Central siempre visible independientemente de `visibleExteriorIndices`.

**Acceptance criteria:**
- 4 tests nuevos pasan.
- 0 regression en tests existentes.

---

## Task 5: Integrar `useLetterReveal` en `components/game/palabrejas/index.tsx`

**Descripción:** Integrar el hook de revelado, botón "Iniciar juego", countdown visual y conexión con el timer.

**Pasos:**
1. Importar `useLetterReveal` desde `@/hooks/use-letter-reveal`.
2. Crear hook: `const { phase, visibleExteriorIndices, countdownSeconds, gameStarted, onStart, triggerDisappear } = useLetterReveal(config.letters)`.
3. Estado `timerStarted: boolean` para controlar cuándo el timer de 90s arranca.
4. Botón "Iniciar juego" visible solo cuando `phase === "hidden"`:
   - Estilo: `px-8 py-3 bg-amber-400 text-stone-900 font-bold text-lg rounded-xl hover:bg-amber-300`.
   - Al hacer clic: llama `onStart()`.
5. Countdown visual visible solo cuando `phase === "countdown"`:
   - Texto grande (text-8xl), color amber-400, animación pulse.
6. `useEffect` para iniciar el timer cuando `gameStarted` se vuelve true:
   ```ts
   useEffect(() => {
     if (gameStarted && !timerStarted) {
       setTimerStarted(true);
       startTimer();
     }
   }, [gameStarted, timerStarted, startTimer]);
   ```
7. Calcular `visibleLetters` para validación:
   ```ts
   const outerLetters = config.letters.filter((l) => l !== config.centerLetter);
   const visibleLetters = [config.centerLetter, ...visibleExteriorIndices.map((i) => outerLetters[i])];
   ```
8. Modificar `handleLetterClick`:
   - Si la letra es la central → siempre permitida.
   - Si es exterior → verificar que su índice está en `visibleExteriorIndices`.
   - Si no es visible → mostrar feedback "Letra oculta".
9. `useEffect` para llamar `triggerDisappear` cuando `remaining < 30`:
   ```ts
   useEffect(() => {
     if (status === "running" && remaining < 30) {
       triggerDisappear(remaining);
     }
   }, [remaining, status, triggerDisappear]);
   ```
10. Ocultar botón "Iniciar juego" y countdown visual cuando el juego ya empezó.
11. Mostrar feedback "Letra oculta" con estilo diferenciado (ej: color stone-500).

**Acceptance criteria:**
- Al cargar: solo central visible, botón "Iniciar juego" presente.
- Al hacer clic en "Iniciar juego": countdown 5→0 aparece.
- Countdown 4s: aparece 1ra letra exterior.
- Countdown 2s: aparece 2da letra exterior.
- Countdown 0s: aparece 3ra letra exterior, timer de 90s arranca.
- Durante juego: letras aparecen cada 5s hasta tener todas.
- A 30s restantes: letras empiezan a desaparecer.
- Solo se aceptan palabras con letras visibles.
- Click en letra oculta → feedback "Letra oculta".
- Bidireccional: letras pueden reaparecer.

**Tests:** No se añaden tests unitarios al componente principal (es integración). Se verifica con E2E manual.

---

## Task 6: Modificar `convex/palabrejas.ts` — `checkWord` con `visibleLetters`

**Descripción:** La query `checkWord` acepta letras visibles para validación parcial.

**Pasos:**
- Añadir nuevo arg opcional a `checkWord`: `visibleLetters: v.optional(v.array(v.string()))`.
- Si `visibleLetters` se envía: usarlo en vez de `config.letters` para validación.
- El centro siempre se valida independientemente de `visibleLetters`.
- Fallback: si no se envía `visibleLetters`, usar `config.letters` (backwards-compatible).

**Código:**
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

    const effectiveLetters = visibleLetters ?? config.letters;
    const center = visibleLetters?.includes(config.centerLetter) ? config.centerLetter : config.centerLetter;

    const norm = normalizeStr(input.trim().toLowerCase());

    if (norm.length < 3)
      return { valid: false, reason: "Mínimo 3 letras." };
    if (!norm.includes(center))
      return { valid: false, reason: `Debe contener la letra central: ${center.toUpperCase()}.` };

    const illegalChars = [...norm].filter((c) => !effectiveLetters.includes(c));
    if (illegalChars.length > 0)
      return { valid: false, reason: "Contiene letras no permitidas." };

    // ... resto de validación igual
  },
});
```

**Acceptance criteria:**
- `checkWord` sin `visibleLetters` → valida con `config.letters` (comportamiento actual).
- `checkWord` con `visibleLetters` → valida solo con letras visibles.
- Centro siempre validado independientemente de `visibleLetters`.
- No regression en otros juegos que llamen a `checkWord`.

**Tests:** No aplica (query de Convex, se verifica con integración manual).

---

## Task 7: Tests generales y verificación

**Descripción:** Ejecutar todo el suite de tests y verificar build.

**Pasos:**
- Ejecutar `npm test` → todos los tests (existentes + nuevos) deben pasar.
- Ejecutar `tsc --noEmit` → sin errores.
- Ejecutar `npm run build` → compilación exitosa.
- Verificación manual del flujo completo:
  - Carga: solo central visible, botón presente.
  - Countdown: 5→0, letras en 4s, 2s, 0s.
  - Juego: letras aparecen cada 5s.
  - 30s: letras desaparecen.
  - Solo palabras con letras visibles.
  - Bidireccional: reaparición funciona.

**Acceptance criteria:**
- 0 errores de TypeScript.
- 0 tests fallidos.
- Build exitoso.
- Flujo manual verificado.
