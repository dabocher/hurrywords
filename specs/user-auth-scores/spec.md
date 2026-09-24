# Spec: Login de usuarios y registro de puntuaciones

## Problema

Actualmente Hurrywords se juega de forma anónima. No hay forma de:
- Identificar al jugador
- Registrar y almacenar sus puntuaciones
- Comparar resultados con otros jugadores mediante rankings públicos

## Objetivo

Implementar un sistema de autenticación y registro de puntuaciones que permita:
1. Que los usuarios se registren e inicien sesión (email/password + Google OAuth)
2. Que las puntuaciones de cada juego se guarden en la base de datos
3. Que exista un ranking público visible (diario, semanal, mensual, anual)
4. Que las palabras mágicas del día sean compartidas globalmente (no por usuario)

## Reglas de negocio

- Cada usuario tiene un perfil con `display_name`, `email` y `avatar_url` opcional
- Las puntuaciones se registran por juego y por día
- El ranking es público: cualquier usuario ve las puntuaciones de todos
- Las 36 palabras mágicas del día son las mismas para todos los usuarios (pool global)
- Solo se suma al ranking total si el usuario ha completado todos los juegos del día
- Rankings por período: diario, semanal, mensual, anual

## Criterios de aceptación

1. Un usuario puede registrarse con email/password o Google
2. Un usuario puede cerrar sesión
3. Al completar Palabrejas (game over), la puntuación se guarda en Convex
4. Existe una tabla de clasificación visible desde el home o el juego
5. El ranking muestra top 100 por período (día/semana/mes/año)
6. Si el usuario no está logueado, puede ver el ranking pero no guardar puntuaciones
7. Las palabras mágicas se comparten globalmente (no hay tabla de magic_pool por usuario)
