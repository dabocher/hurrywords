# Tasks: Soporte para formas femeninas

## Task 1: Crear `convex/words.ts`

**Descripción:** Funciones de normalización de género para derivar femeninos a partir de terminaciones.

**Pasos:**
- Crear archivo `convex/words.ts`.
- Implementar `deriveFeminineForm(lemma: string): string | null` con reglas:
  - `-ado` → `-ada` (alta confianza)
  - `-ido` → `-ida` (alta confianza)
  - `-dor` → `-dora`
  - `-tor` → `-tora`
  - `-or` → `-ora` (con exclusiones: amor, color, dolor, flor, etc.)
  - `-ón` → `-ona`
  - `-án` → `-ana`
  - `-el` → `-ela` (baja confianza)
  - `-ez` → `-eza`
- Implementar `hasFeminineForm(lemma: string): boolean`.
- Implementar `getFeminineForms(lemma: string): string[]`.

**Acceptance criteria:**
- `deriveFeminineForm("abandonado")` → `"abandonada"`
- `deriveFeminineForm("decidido")` → `"decidida"`
- `deriveFeminineForm("vendedor")` → `"vendedora"`
- `deriveFeminineForm("actor")` → `"actora"`
- `deriveFeminineForm("campeón")` → `"campeona"`
- `deriveFeminineForm("alemán")` → `"alemana"`
- `deriveFeminineForm("amor")` → `null`
- `deriveFeminineForm("color")` → `null`
- `deriveFeminineForm("canción")` → `null` (no aplica)
- `deriveFeminineForm("abuela")` → `null` (ya es femenino)

---

## Task 2: Tests de `convex/words.ts`

**Descripción:** Tests unitarios para las funciones de derivación.

**Pasos:**
- Crear `convex/words.test.ts`.
- Tests para cada regla de derivación.
- Tests para exclusiones.
- Tests para casos sin derivación.

**Acceptance criteria:**
- Todos los tests pasan.
- Cobertura de las reglas principales (-ado, -ido, -dor, -tor, -or, -ón, -án).
- Tests de exclusiones (-or con raíces sin femenino).
- Tests de casos sin derivación.

---

## Task 3: Integrar femeninos en Palabrejas

**Descripción:** Modificar `processPalabrejasLetter` para generar y agregar formas femeninas.

**Pasos:**
- Importar `deriveFeminineForm` desde `convex/words.ts`.
- En el loop de `processPalabrejasLetter`, para cada palabra válida:
  1. Llamar `deriveFeminineForm(norm)`.
  2. Si existe femenina:
     - Verificar que no sea duplicada.
     - Verificar que todas sus letras estén en `config.letters`.
     - Verificar que contenga `config.centerLetter`.
     - Agregar a `newWords` con el `wordId` del original.

**Acceptance criteria:**
- Las palabras terminadas en -ado generan su femenina.
- Las palabras terminadas en -ido generan su femenina.
- La femenina pasa la validación de letras permitidas.
- Si la femenina no pasa la validación (ej: tiene letra no permitida), no se agrega.
- No se agregan duplicados.
- El contador de `validWords` aumenta después de aplicar esta feature.

---

## Task 4: Integrar femeninos en Pasapalabra

**Descripción:** Modificar `convex/pasapalabraPool.ts` y `convex/pasapalabraDaily.ts` para usar derivación de femeninos.

**Pasos:**
- En `pasapalabraPool.ts`, derivar femeninos para palabras con terminaciones relevantes.
- En `pasapalabraDaily.ts`, mismo patrón.
- Considerar que Pasapalabra tiene 26 palabras (una por letra), la derivación femenina debe respetar la estructura del pool.

**Acceptance criteria:**
- Las palabras de Pasapalabra con terminaciones relevantes generan su femenina.
- La femenina se agrega al pool si pasa las validaciones.
- No se rompen los pools existentes.

---

## Task 5: Verificación final

**Descripción:** Ejecutar todo el suite de tests y verificar build.

**Pasos:**
- Ejecutar `npm test` → todos los tests deben pasar.
- Ejecutar `tsc --noEmit` → sin errores.
- Ejecutar `npm run build` → compilación exitosa.
- Verificar manualmente que las palabras femeninas se generan correctamente.

**Acceptance criteria:**
- 0 errores de TypeScript.
- 0 tests fallidos.
- Build exitoso.
- Palabras como "abandonada" y "cansada" se generan a partir de "abandonado" y "cansado".
