# Plan de Revisión Hurrywords

## Orden de ejecución (según solicitud del usuario)

### BLOQUE 1: Tests primero (spec-driven development)
1. **Feature #1**: Tests para funciones puras de `convex/palabrejas.ts`
   - normalizeStr, uniqueLetters, isValidForPalabrejas, isPalabreja, calculateScore
   
2. **Feature #2**: Tests para componentes de UI
   - ScoreBoard, WordInput, FoundWords, HexBoard
   
3. **Feature #3**: Corregir `vitest.setup.ts` (import obsoleto)
   
4. **Feature #4**: Verificación baseline del proyecto

### BLOQUE 2: Violaciones de AGENTS.md
5. **Feature #5**: Corregir `export const` en componentes
6. **Feature #6**: Cambiar `interface` → `type` en props de componentes
7. **Feature #7**: Unificar `PalabrasMagicasDelDia` duplicado
8. **Feature #8**: Eliminar `palabrasMagicasDaily.ts` antiguo
9. **Feature #9**: Corregir imports relativos → `@/*` alias
10. **Feature #10**: Mover lógica de Palabrejas a `lib/`

### BLOQUE 3: Errores de TypeScript
11. **Feature #11**: Corregir `PalabrasPasapalabraDelDia.tsx` (6 errores TS)
12. **Feature #12**: Corregir `Palabrejas.tsx` líneas 110-112 (3 errores TS)

### BLOQUE 4: Arquitectura y limpieza
13. **Feature #13**: Corregir `ConvexClientProvider` para hot-reload
14. **Feature #14**: Reemplazar `format-currency.ts` por utilidades reales
15. **Feature #15**: Verificación final completa

---

## Resumen de problemas encontrados

### TypeScript errores (bloqueantes)
- `PalabrasPasapalabraDelDia.tsx`: 6 errores - trata `{ date, entries }` como `Word[]`
- `Palabrejas.tsx:110-112`: 3 errores - asigna `undefined` a campos `number`/`boolean`

### Violaciones AGENTS.md
- Componentes usan `export default` en vez de `export const Component = () =>`
- Usan `interface` para props de componentes (debe ser `type`)
- Lógica de negocio dentro del componente (debe estar en `lib/`)
- Duplicación de `PalabrasMagicasDelDia.tsx` en `components/` y `convex/daily/`
- Imports relativos en vez de `@/*` alias

### Duplicación
- `palabrasMagicasDaily.ts` y `daily.ts` tienen funciones idénticas
- `PalabrasMagicasDelDia.tsx` duplicado en dos directorios

### Tests faltantes
- Cero tests para componentes de UI
- Cero tests para funciones puras de Palabrejas
- `vitest.setup.ts` con import obsoleto
