# Timer para Palabrejas (y minijuegos)

## Qué

Cada minijuego de Hurrywords tendrá un temporizador de 60 segundos que comienza al iniciar la partida y controla el ciclo de vida del juego: durante, expirado y fin.

## Por qué

- El tiempo es un factor de juego definido en el diseño del juego: añade presión y estrategia.
- Los jugadores deben poder recargar la página sin perder el progreso del timer.
- Al expirar el tiempo, las palabras encontradas deben integrarse en el pool de palabras del siguiente juego para mantener la cadena de palabras mágicas.
- Se necesita un componente de timer reutilizable para compartir entre todos los minijuegos futuros.

## Reglas del timer

### Comportamiento

- **Duración**: 60 segundos por minijuego.
- **Inicio**: el timer comienza cuando el usuario introduce la primera letra válida (primera acción de juego). No arranca al cargar la página.
- **Persistencia**: si el usuario recarga la página durante el juego, el tiempo restante se mantiene. Si recarga antes de empezar, el timer arranca desde 60 segundos al primer input.
- **Continuo**: el timer corre siempre, sin pausas (incluyendo durante verificaciones de palabras y animaciones).

### Expiración

- Cuando el timer llega a 0:
  - Se bloquean las letras del tablero y el campo de input (sin permitir más palabras).
  - Se muestra un overlay de "fin del tiempo" con:
    - Puntuación total alcanzada.
    - Listado de palabras encontradas.
    - Un botón "Siguiente juego" (actualmente mock; en el futuro navegará al siguiente minijuego disponible).
  - Las palabras encontradas se registran en Convex como palabras mágicas para el pool del siguiente juego.

### Visualización

- Countdown numérico visible siempre (formato `01:00` → `00:00`).
- Cambio de color del countdown a medida que disminuye el tiempo:
  - Verde/neutral: de 60s a 30s.
  - Amarillo/amber: de 29s a 10s.
  - Rojo: de 9s a 0s.
- Posición: debajo del ScoreBoard, alineado con los datos del juego.

## Alcance de esta iteración

- Timer funcional para **Palabrejas** únicamente.
- Componente `<Timer>` y hook `useTimer` reutilizables, diseñados para ser usados por otros minijuegos.
- Botón "Siguiente juego" con comportamiento mock (sin navegación real).
- Persistencia del timer via `localStorage`.
- Registro de palabras encontradas al expirar el tiempo: se marcarán como mágicas para el pool del siguiente juego.

## No incluido en esta iteración

- Animación "HURRY" cuando queden 10 segundos (prevista para una iteración futura).
- Bonus de tiempo sumado a la puntuación (no aplica a Palabrejas actualmente; se implementará en otros juegos como Pasapalabra).
- Navegación real al siguiente juego (el botón "Siguiente juego" será mock).
- Configuración de duración del timer (se mantiene en 60s fijos).
