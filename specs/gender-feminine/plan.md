# Plan: Soporte para formas femeninas

## Estructura de archivos a crear/modificar

```
convex/
  words.ts                 ← NUEVO (funciones de normalización de género)
  words.test.ts            ← NUEVO (tests de derivación de femeninos)
  palabrejas.ts            ← MODIFICADO (usar deriveFeminineForm en processPalabrejasLetter)
  pasapalabraPool.ts       ← MODIFICADO (usar deriveFeminineForm)
  pasapalabraDaily.ts      ← MODIFICADO (usar deriveFeminineForm)
```

## Detalle de implementación

### 1. `convex/words.ts` — Funciones de normalización de género

Archivo nuevo que centraliza la lógica de derivación de formas femeninas.

**Funciones principales:**

#### `deriveFeminineForm(lemma: string): string | null`

Genera la forma femenina de una palabra a partir de su terminación.

```ts
export const deriveFeminineForm = (lemma: string): string | null => {
  const norm = lemma.toLowerCase().trim();

  // Reglas de derivación (en orden de prioridad)

  // -ado → -ada (alta confianza)
  if (norm.endsWith("ado")) {
    return norm.slice(0, -3) + "ada";
  }

  // -ido → -ida (alta confianza)
  if (norm.endsWith("ido")) {
    return norm.slice(0, -3) + "ida";
  }

  // -dor → -dora (media confianza)
  if (norm.endsWith("dor")) {
    return norm.slice(0, -3) + "dora";
  }

  // -tor → -tora (media confianza)
  if (norm.endsWith("tor")) {
    return norm.slice(0, -3) + "tora";
  }

  // -or → -ora (solo si la raíz + 'a' tiene sentido)
  // Excluir: palabras que terminan en -or que son sustantivos abstractos
  // o que no tienen forma femenina (amor, color, dolor, etc.)
  if (norm.endsWith("or") && norm.length > 3) {
    const root = norm.slice(0, -2);
    // Excluir raíces comunes sin femenino
    const noFeminineRoots = new Set(["amor", "color", "dolor", "flor", "sal", "voz", "sol", "pan", "mar", "mal", "bien", "tal", "cual", "don", "fin", "bien", "cien", "mil"]);
    if (!noFeminineRoots.has(norm)) {
      return root + "ora";
    }
  }

  // -ón → -ona
  if (norm.endsWith("ón") && norm.length > 3) {
    return norm.slice(0, -2) + "ona";
  }

  // -án → -ana
  if (norm.endsWith("án") && norm.length > 3) {
    return norm.slice(0, -2) + "ana";
  }

  // -el → -ela (baja confianza, casos raros)
  if (norm.endsWith("el") && norm.length > 3) {
    return norm.slice(0, -2) + "ela";
  }

  // -l → -la (baja confianza, muy raro)
  if (norm.endsWith("l") && norm.length > 3 && !norm.endsWith("al") && !norm.endsWith "el") {
    return norm.slice(0, -1) + "la";
  }

  // -r → -ra (baja confianza, muy raro)
  if (norm.endsWith("r") && norm.length > 3 && !norm.endsWith("ar") && !norm.endsWith("or") && !norm.endsWith("er") && !norm.endsWith("ir") && !norm.endsWith("der") && !norm.endsWith("tor")) {
    return norm.slice(0, -1) + "ra";
  }

  // -z → -za (no cambia, pero por seguridad)
  // -ez → -eza
  if (norm.endsWith("ez") && norm.length > 3) {
    return norm.slice(0, -2) + "eza";
  }

  return null; // No hay regla para esta terminación
};
```

**Notas de implementación:**
- La función siempre devuelve minúsculas.
- Si la palabra no tiene una regla de derivación conocida, devuelve `null`.
- Las reglas se aplican en orden de prioridad (alta confianza primero).
- Se excluyen raíces comunes que no tienen forma femenina.

#### `hasFeminineForm(lemma: string): boolean`

Helper que indica si una palabra tiene forma femenina derivable.

```ts
export const hasFeminineForm = (lemma: string): boolean => {
  return deriveFeminineForm(lemma) !== null;
};
```

#### `getFeminineForms(lemma: string): string[]`

Retorna todas las formas de género de una palabra.

```ts
export const getFeminineForms = (lemma: string): string[] => {
  const norm = lemma.toLowerCase().trim();
  const forms = [norm];
  const feminine = deriveFeminineForm(norm);
  if (feminine && !forms.includes(feminine)) {
    forms.push(feminine);
  }
  return forms;
};
```

### 2. Modificación de `convex/palabrejas.ts`

En `processPalabrejasLetter`, cuando se encuentra una palabra válida:
1. Generar su forma femenina con `deriveFeminineForm`.
2. Si existe y pasa las validaciones (letras permitidas, contiene central), agregarla a `newWords`.

**Cambio en `processPalabrejasLetter`:**

```ts
for (const word of page.page) {
  const norm = normalizeStr(word.lemma);
  if (!existingNorms.has(norm) && isValidForPalabrejas(word.lemma, config.letters, config.centerLetter)) {
    existingNorms.add(norm);
    newWords.push({ wordId: word._id, normalizedLemma: norm });

    // Intentar agregar la forma femenina
    const feminine = deriveFeminineForm(norm);
    if (feminine && !existingNorms.has(feminine)) {
      // Validar la forma femenina con las mismas reglas
      if (feminine.length >= 3 && 
          [...feminine].every((c) => config.letters.includes(c)) &&
          feminine.includes(config.centerLetter)) {
        existingNorms.add(feminine);
        // No añadimos wordId porque es una forma derivada, no un lema del diccionario
        // Pero necesitamos un wordId para asociar la palabra
        // Opción: buscar si existe en el diccionario, si no, usar el wordId del original
        newWords.push({ wordId: word._id, normalizedLemma: feminine });
      }
    }
  }
}
```

### 3. Modificación de `convex/pasapalabraPool.ts`

Mismo patrón: cuando se genera el pool de Pasapalabra, derivar femeninos para palabras con terminaciones relevantes.

### 4. Modificación de `convex/pasapalabraDaily.ts`

Mismo patrón.

### 5. Tests en `convex/words.test.ts`

Tests para `deriveFeminineForm`:
- `-ado` → `-ada` (alta confianza)
- `-ido` → `-ida` (alta confianza)
- `-dor` → `-dora`
- `-tor` → `-tora`
- `-or` → `-ora` (con exclusiones)
- `-ón` → `-ona`
- `-án` → `-ana`
- `-el` → `-ela`
- `-z` → no cambia (o -ez → -eza)
- Palabras sin regla → `null`
- Exclusiones: "amor", "color", "dolor" → `null`

## Archivos a crear

1. `convex/words.ts` — Funciones de normalización de género
2. `convex/words.test.ts` — Tests de derivación

## Archivos a modificar

1. `convex/palabrejas.ts` — Integrar `deriveFeminineForm` en `processPalabrejasLetter`
2. `convex/pasapalabraPool.ts` — Integrar `deriveFeminineForm`
3. `convex/pasapalabraDaily.ts` — Integrar `deriveFeminineForm`

## Orden de implementación

1. Crear `convex/words.ts` con las funciones de derivación
2. Crear `convex/words.test.ts` con tests unitarios
3. Modificar `convex/palabrejas.ts` para usar las femeninas
4. Modificar `convex/pasapalabraPool.ts`
5. Modificar `convex/pasapalabraDaily.ts`
6. Ejecutar `tsc --noEmit`, `npm test`, `npm run build`

## Consideraciones técnicas

- **wordId**: Las formas femeninas derivadas no tienen entrada propia en `rae_words`. Se puede reutilizar el `wordId` del lema original. Esto es aceptable porque la validación es por `normalizedLemma`, no por `wordId`.
- **Palabreja**: Las reglas de `isPalabreja` (usa todas las letras) se aplican tanto a la forma masculina como a la femenina.
- **Magic words**: Si la forma masculina es mágica, la femenina también lo será (comparten `wordId`).
- **Performance**: La derivación es O(1) por palabra. No afecta el tiempo de generación del pool.
- **Idempotencia**: `deriveFeminineForm("abandonada")` debería retornar `null` porque no termina en -o. No se generan formas recursivas.

