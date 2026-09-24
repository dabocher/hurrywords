# Tasks: Login de usuarios y registro de puntuaciones

## Fase 1: Infraestructura de autenticación

- [ ] T1.1 Instalar `@convex-dev/auth`, `next-auth` y `jose`
- [ ] T1.2 Crear `convex/auth.ts` con providers Email + Google
- [ ] T1.3 Generar claves JWT con `jose` (headless, no interactivo)
- [ ] T1.4 Crear `convex/auth.config.ts` con `site`
- [ ] T1.5 Añadir schema de `users` en `convex/schema.ts` (índice `by_email`)
- [ ] T1.6 Crear `app/login/page.tsx` con formulario email/password
- [ ] T1.7 Crear `app/register/page.tsx` con formulario de registro
- [ ] T1.8 Crear `components/auth/sign-in-form.tsx`
- [ ] T1.9 Crear `components/auth/sign-up-form.tsx`
- [ ] T1.10 Crear `app/ConvexAuthProvider.tsx` (wrapper ConvexProvider + AuthProvider)
- [ ] T1.11 Actualizar `app/layout.tsx` para usar `ConvexAuthProvider`
- [ ] T1.12 Crear `components/auth/auth-button.tsx` (muestra login o usuario)
- [ ] T1.13 Verificar login/registro manual (round-trip)

## Fase 2: Schema y mutations de puntuaciones

- [ ] T2.1 Añadir tabla `user_game_sessions` en `convex/schema.ts`
- [ ] T2.2 Añadir tabla `leaderboard` en `convex/schema.ts`
- [ ] T2.3 Crear `convex/scores.ts` con mutation `saveGameScore`
- [ ] T2.4 Crear mutation `updateLeaderboard` (internalMutation)
- [ ] T2.5 Crear query `getLeaderboard` (daily/weekly/monthly/yearly)
- [ ] T2.6 Crear query `getUserStats`
- [ ] T2.7 Crear query `getCurrentUser`
- [ ] T2.8 Deploy schema y mutations a Convex (`npx convex deploy --yes`)

## Fase 3: UI de ranking

- [ ] T3.1 Crear `components/game/leaderboard.tsx`
- [ ] T3.2 Añadir tabs (Día/Semana/Mes/Año) en leaderboard
- [ ] T3.3 Mostrar top 100 con rank, avatar, nombre, score
- [ ] T3.4 Destacar usuario actual en el ranking
- [ ] T3.5 Mostrar mensaje "Inicia sesión" si no hay usuario
- [ ] T3.6 Añadir leaderboard a `app/page.tsx` (home)

## Fase 4: Integración con Palabrejas

- [ ] T4.1 Importar `useAuth` en `components/game/palabrejas/index.tsx`
- [ ] T4.2 Al detectar `isExpired`, llamar a `saveGameScore`
- [ ] T4.3 Calcular `totalScore` y `completed` (todos los juegos del día)
- [ ] T4.4 Actualizar `GameOverOverlay` con botón "Ver ranking"
- [ ] T4.5 Mostrar puntuación del usuario en ranking si está logueado
- [ ] T4.6 Verificar flujo completo: login → jugar → game over → score guardado → ranking actualizado

## Fase 5: Tests y verificación

- [ ] T5.1 Tests unitarios de `saveGameScore` (convex-test)
- [ ] T5.2 Tests unitarios de `getLeaderboard` (convex-test)
- [ ] T5.3 Tests unitarios de `getUserStats` (convex-test)
- [ ] T5.4 Test E2E: flujo completo login → jugar → score → ranking
- [ ] T5.5 Verificar que palabras mágicas son globales (no por usuario)
- [ ] T5.6 `tsc --noEmit` sin errores
- [ ] T5.7 `next build` sin errores
- [ ] T5.8 Deploy a producción y verificar en vivo
