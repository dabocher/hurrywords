# Tareas Pendientes — Hurrywords

## Minijuego Palabrejas

### 1. Documentación de reglas del minijuego
- **Descripción:** Crear un archivo `.md` con las reglas completas del minijuego Palabrejas.
- **Contenido esperado:**
  - Objetivo del juego
  - Cómo se forman las palabras
  - Sistema de puntuación
  - Reglas de letras visibles/ocultas
  - Countdown inicial y revelado progresivo
  - Fase de desaparición de letras
  - Palabras mágicas y Palabreja
  - Condiciones de fin de juego
- **Archivo destino:** `docs/reglas-palabrejas.md`

### 2. Componente "How to Play" de Palabrejas
- **Descripción:** Crear un componente reutilizable que explique las reglas del juego al usuario.
- **Componente:** `components/game/palabrejas/how-to-play.tsx`
- **Contenido esperado:**
  - Título: "Cómo jugar a Palabrejas"
  - Explicación visual del tablero hexagonal
  - Instrucciones paso a paso:
    1. Presiona "Iniciar juego" para comenzar
    2. Observa el countdown de 5 segundos
    3. Las letras aparecen progresivamente
    4. Forma palabras con las letras visibles
    5. La letra central es obligatoria en cada palabra
    6. Mínimo 4 letras por palabra
    7. ¡Las palabras mágicas valen 3 veces más!
  - Sistema de puntuación resumido
  - Botón para cerrar el modal/panel
- **Comportamiento:**
  - Puede abrirse como modal o panel lateral
  - Accesible desde un botón "?" o "Cómo jugar" en la página principal
  - Se cierra con botón, tecla Escape o clic fuera del modal
