# Letras ocultas y revelado progresivo en Palabrejas

## Qué

Al cargar Palabrejas, los 7 hexágonos son visibles pero solo se muestra la letra central. Las 6 letras exteriores permanecen ocultas hasta que el jugador presiona "Iniciar juego", momento en que comienza un countdown de 5 segundos con revelado progresivo. Durante el juego, las letras restantes aparecen gradualmente. Cuando quedan 30 segundos, las letras empiezan a desaparecer progresivamente (la central nunca desaparece).

## Por qué

- Añade anticipación y tensión al inicio del juego.
- Obliga al jugador a memorizar las letras antes de poder formar palabras.
- El revelado progresivo durante el juego da tiempo al jugador para adaptarse.
- La desaparición progresiva al final aumenta la dificultad y crea tensión.
- Crea una experiencia más narrativa e inmersiva que mostrar todo de golpe.

## Flujo detallado

### Fase 1: Carga de la página
- Se muestran los 7 hexágonos.
- Solo la letra central es visible.
- Las 6 letras exteriores están ocultas (opacity: 0, invisible pero el hexágono se ve).
- Aparece un botón "Iniciar juego" debajo del tablero.

### Fase 2: Countdown de 5 segundos
Se activa al presionar "Iniciar juego":
- Countdown visual de 5 → 0 segundos.
- A los 4s (quedan 4): aparece una letra exterior aleatoria.
- A los 2s (quedan 2): aparece otra letra exterior aleatoria (distinta).
- A los 0s (countdown termina): aparece una tercera letra exterior aleatoria (distinta).
- El timer del juego (90s) comienza cuando el countdown llega a 0.

### Fase 3: Juego con revelado progresivo
- Cada 5 segundos aparece una nueva letra exterior (de las restantes).
- Se revelan todas en un máximo de 15 segundos (3 intervalos × 5s).
- Una vez visibles las 6 letras, el revelado se detiene.

### Fase 4: Desaparición progresiva (30s restantes)
- Cuando quedan 30 segundos, las letras exteriores empiezan a desaparecer.
- Cada 5 segundos desaparece una letra exterior (elegida aleatoriamente).
- La letra central NUNCA desaparece.
- Las letras pueden reaparecer (bidireccional).

### Reglas de juego durante revelado
- Solo se pueden formar palabras con las letras visibles en cada momento.
- `checkWord` debe validar contra el set de letras visibles, no contra todas las letras.

## No incluido

- Animaciones complejas de partículas al revelar/esconder.
- Sonidos de revelado o desaparición.
- Persistencia del estado de revelado al recargar la página.
