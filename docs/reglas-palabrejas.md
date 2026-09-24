# Reglas del Minijuego — Palabrejas

## Objetivo

Formar la mayor cantidad de palabras válidas en 90 segundos, puntuando según la longitud de las palabras y aprovechando las palabras mágicas del día.

## El Tablero

El juego muestra 7 hexágonos dispuestos en una flor:
- **1 hexágono central** (color ámbar): contiene la letra obligatoria
- **6 hexágonos exteriores** (color piedra): contienen letras adicionales

Solo se pueden formar palabras usando las letras visibles en cada momento.

## Cómo Jugar

### 1. Inicio del juego
- Al cargar la página, solo se muestra la letra central.
- Presiona **"Iniciar juego"** para comenzar.
- Aparece un countdown de 5 segundos.

### 2. Revelado de letras
Durante el countdown y el juego, las letras exteriores aparecen progresivamente:

| Momento | Letras visibles |
|---|---|
| Countdown 4s | 1ra letra exterior |
| Countdown 2s | 2da letra exterior |
| Countdown 0s | 3ra letra exterior + timer de 90s |
| Cada 5s durante el juego | 1 letra adicional hasta tener las 6 |
| 30s restantes | Las letras empiezan a desaparecer |

### 3. Formar palabras
- Escribe palabras usando las letras del tablero.
- La **letra central es obligatoria** en cada palabra.
- Mínimo **3 letras** por palabra.
- Presiona **"Enviar"** o la tecla **Enter** para validar.

### 4. Validación
- Si la palabra es válida: se muestra la puntuación y se suma tiempo.
- Si no es válida: se muestra el motivo del error y se restan 5 segundos.
- Si ya encontraste la palabra: se muestra un mensaje y se restan 5 segundos.

### 5. Fin del juego
- Cuando el timer llega a 0, se muestra un overlay con:
  - Puntuación total alcanzada
  - Listado de palabras encontradas
  - Botón "Siguiente juego" (mock)

## Puntuación

### Por longitud de palabra

| Longitud | Puntos |
|---|---|
| 3-5 letras | 1 punto |
| 6-11 letras | 2 puntos |
| 12+ letras | 3 puntos |

### Multiplicadores

| Condición | Multiplicador |
|---|---|
| Palabra mágica del día | ×3 |
| Palabra mágica + Palabreja | ×3 + bonus |

### Bonus/Malus

| Acción | Efecto |
|---|---|
| Palabra válida | +longitud segundos |
| Palabra inválida | -5 segundos |
| Palabra ya encontrada | -5 segundos |

## Términos Especiales

### Palabra Mágica
- Palabras seleccionadas aleatoriamente del pool del día.
- Valen **3 veces más** que una palabra normal.
- Se muestran con un icono ✦ al encontrarlas.

### Palabreja
- Palabra que usa **todas las 7 letras** del tablero.
- Otorga un **bonus de 10 puntos** adicional.
- Se muestra con un icono ⭐ al encontrarla.

### Palabreja Mágica
- Palabra que es **tanto mágica como Palabreja**.
- Es el hito más alto del juego.
- Se muestra con un icono 🌟 y combina ambos bonus.

## Reglas de Validación

Una palabra es válida si:
1. Está en el diccionario RAE.
2. Contiene la letra central obligatoria.
3. Solo usa letras permitidas (las visibles en ese momento).
4. Tiene al menos 3 letras.
5. No ha sido encontrada previamente en esta partida.

## Teclado Físico

- **Enter**: Enviar palabra
- **Backspace**: Borrar última letra
- **Escape**: Borrar todas las letras
- **Letras**: Añadir letra al input actual

## Consejos

- Aprovecha los primeros segundos para memorizar las letras.
- Las palabras largas puntúan más y dan más tiempo.
- Las palabras mágicas valen 3 veces más, ¡presta atención a las que encuentras!
- Las Palabrejas dan bonus extra, intenta usar todas las letras.
- Evita palabras inválidas: restan 5 segundos.
