# Soporte para formas femeninas en el diccionario

## Qué

El sistema debe reconocer y generar automáticamente las formas femeninas de palabras terminadas en `-o` (y otras terminaciones) cuando se construyen los pools de palabras para los minijuegos.

## Por qué

El diccionario RAE tiene lemas como "abandonado,da" o "paralelo, la", pero nuestro `words.jsonl` solo tiene "abandonado" y "paralelo". La información de género se perdió durante el procesamiento del diccionario.

Cuando un jugador escribe "abandonada", el sistema dice "no está en el diccionario" porque la forma femenina nunca fue agregada al pool de palabras válidas.

## Reglas de derivación de femeninos

### Terminaciones principales (alta confianza)
- `-ado` → `-ada` (ej: "abandonado" → "abandonada")
- `-ido` → `-ida` (ej: "decidido" → "decidida")

### Terminaciones secundarias (media confianza)
- `-dor` → `-dora` (ej: "vendedor" → "vendedora")
- `-tor` → `-tora` (ej: "actor" → "actora")
- `-or` → `-ora` (ej: "actor" → "actora") — solo si no es un sustantivo abstracto
- `-ón` → `-ona` (ej: "campeón" → "campeona")
- `-án` → `-ana` (ej: "alemán" → "alemana")

### Reglas de validación
La forma femenina generada se agrega SOLO si:
1. Todas sus letras están permitidas en el tablero del día
2. Contiene la letra central obligatoria
3. Tiene al menos 3 letras
4. No es un duplicado de una palabra ya agregada

## Alcance

- Aplica a **todos los minijuegos** que usen el diccionario RAE (Palabrejas, Pasapalabra, Encadenados, Ahorcado, Crucigrama).
- La generación se hace en la fase de construcción de pools diarios (convex/crons.ts o archivos específicos de cada juego).

## No incluido

- Normalización de plural (s → s, no aplica a género)
- Generación de diminutivos/aumentativos
- Casos irregulares específicos (como "bisabuelo" → "bisabuela")

