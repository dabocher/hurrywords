# Hurrywords — diseño del juego

Especificación funcional del producto. Consulta este documento antes de tocar lógica de puntuación, generación de pools, temporizadores o reglas de cualquier minijuego.

## Descripción general

Hurrywords es un conjunto de juegos de palabras independientes entre sí, pero conectados mediante un pool de **palabras mágicas** compartido dentro de la partida de un mismo día de un mismo usuario.

## Minijuegos

| Juego | Estado | Descripción |
|---|---|---|
| Palabreja | En proyecto | A partir de un conjunto de letras predeterminado, el usuario forma palabras que se cotejan contra el diccionario completo (sin pool propio). Es el primer juego de la secuencia. |
| Pasapalabra / rosco | Activo | Una definición por cada letra del abecedario (26 palabras). |
| Encadenados | Activo | Palabras encadenadas: la última sílaba de una palabra determina la sílaba inicial de la siguiente. |
| Ahorcado | Activo | Adivinar letras; cada fallo dibuja una parte del cuerpo. |
| Crucigrama (Cruciwords) | En proyecto | Sin especificación cerrada todavía. |

## Finalidad y modos de juego

- Cada juego puede jugarse **de forma independiente**.
- Si el usuario completa **todos** los juegos, opta a la **puntuación global** del día.

## Pool de palabras mágicas

- Tamaño fijo: **36 palabras mágicas** por usuario y día.
- Se distribuyen **aleatoriamente** entre los juegos del día.
- **Origen de las palabras mágicas**: las que el usuario acierta en Palabreja (el primer juego, sin pool propio) se añaden al pool de palabras del día **de ese usuario**, y desde ahí alimentan a los juegos siguientes (p. ej. Encadenados usa palabras acertadas en juegos precedentes).

## Conjunto de palabras por juego (pool diario)

Cambia cada día, **excepto en Palabreja** (que usa el diccionario completo, sin pool asignado).

| Juego | Palabras del pool | Palabras mágicas incluidas |
|---|---|---|
| Ahorcado | 26 | 6 |
| Pasapalabra | 26 (una por letra) | 6 |
| Encadenados | 26 | 6 |
| Palabreja | todo el diccionario | — (es la fuente, no el destino) |
| Cruciwords | por definir | por definir |

## Puntuación

### Por palabra

| Longitud | Puntos |
|---|---|
| 2 a 5 letras | 1 |
| 6 a 11 letras | 2 |
| 12 o más letras | 3 |

- **Palabra mágica**: coeficiente **x3** sobre los puntos base de esa palabra.
- **Palabra fallida**: **-1 punto**, independientemente de la longitud.

### Por tiempo

- Cada juego tiene un tiempo asignado.
- Si se resuelve antes de agotar el tiempo, **el tiempo restante se suma a la puntuación** del juego.

### Agregación

- Cada juego puntúa **por separado**.
- La puntuación de cada juego se **acumula también en una puntuación total** (solo aplica a la puntuación global si se han completado todos los juegos, ver "Finalidad").
- Rankings por periodo: **diario, semanal, mensual y anual**.

## Pendiente de definir

- Reglas concretas de Crucigrama/Cruciwords (tamaño de pool, palabras mágicas incluidas, mecánica de generación del tablero).
- Duración exacta del tiempo asignado a cada juego (ya confirmado: Palabreja = 1 minuto).
