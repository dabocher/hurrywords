# Plan: Login de usuarios y registro de puntuaciones

## Contexto

- Stack: Next.js (App Router) + Convex.io + TypeScript
- Auth: `@convex-dev/auth` con Email/Password + Google OAuth
- Paradigma: Programación funcional, arrow functions, sin clases
- Reglas de estilo: ver `AGENTS.md` y `docs/game-design.md`

## 1. Schema de Convex

### Tablas nuevas

```ts
// convex/schema.ts

users: defineTable({
  display_name: v.string(),
  email: v.string(),
  avatar_url: v.optional(v.string()),
})
  .index("by_email", ["email"]),

user_game_sessions: defineTable({
  user_id: v.id("users"),
  date: v.string(),
  game: v.string(),        // "palabrejas" | "pasapalabra" | etc.
  score: v.number(),
  found_words: v.array(
    v.object({
      normalizedLemma: v.string(),
      displayLemma: v.string(),
      score: v.number(),
      isMagic: v.boolean(),
      isPalabreja: v.boolean(),
    })
  ),
  time_remaining: v.number(),
  completed: v.boolean(),
})
  .index("by_user_date", ["user_id", "date"])
  .index("by_date_score", ["date", "score"]),

leaderboard: defineTable({
  date: v.string(),
  user_id: v.id("users"),
  total_score: v.number(),
  games_completed: v.number(),
})
  .index("by_date_score", ["date", "total_score"]),
```

### Notas

- `users` se crea automáticamente con `@convex-dev/auth`. No necesitamos definirla manualmente.
- `user_game_sessions` almacena cada partida individual por juego
- `leaderboard` se recalcula cuando un usuario completa todos los juegos del día

## 2. Autenticación

### 2.1 Instalación

```bash
npm install @convex-dev/auth next-auth jose
```

### 2.2 Configuración server

`convex/auth.ts`:
```ts
import { auth } from "@convex-dev/auth";
import Email from "@convex-dev/auth/providers/Email";
import Google from "@convex-dev/auth/providers/Google";

export const [authRoutes, handler, client] = auth({
  providers: [
    Email({
      // Configuración de email (requiere SMTP)
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});
```

### 2.3 Configuración client

`convex/auth.config.ts`:
```ts
export default {
  site: process.env.SITE_URL,
};
```

### 2.4 Provider wrapper

Reemplazar `ConvexClientProvider` con un wrapper que incluya auth:

`app/ConvexAuthProvider.tsx`:
```ts
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@convex-dev/auth/react";
import { authClient } from "@/convex/auth";
import { useMemo, type ReactNode } from "react";

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    [],
  );

  return (
    <ConvexProvider client={convex}>
      <AuthProvider handler={authClient}>
        {children}
      </AuthProvider>
    </ConvexProvider>
  );
}
```

### 2.5 Layout

`app/layout.tsx` → cambiar `ConvexClientProvider` por `ConvexAuthProvider`

### 2.6 Páginas de auth

`app/login/page.tsx`:
- Formulario de email/password
- Botón de login con Google
- Enlace a registro si no tiene cuenta

`app/register/page.tsx`:
- Formulario de registro (email + password + display_name)

### 2.7 Componentes UI

`components/auth/sign-in-form.tsx`:
- Formulario con email y password
- Botón "Continuar con Google"
- Enlace a register

`components/auth/sign-up-form.tsx`:
- Formulario con display_name, email y password
- Enlace a login

`components/auth/auth-button.tsx`:
- Si no hay sesión: muestra "Iniciar sesión"
- Si hay sesión: muestra avatar/nombre + menú dropdown (perfil, cerrar sesión)

## 3. Mutations y Queries de puntuación

### 3.1 Mutation: saveGameScore

`convex/scores.ts`:
```ts
export const saveGameScore = mutation({
  args: {
    game: v.string(),
    score: v.number(),
    foundWords: v.array(v.object({
      normalizedLemma: v.string(),
      displayLemma: v.string(),
      wordScore: v.number(),
      isMagic: v.boolean(),
      isPalabreja: v.boolean(),
    })),
    timeRemaining: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, { game, score, foundWords, timeRemaining, completed }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No authenticated");

    // Buscar o crear usuario
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      // Crear usuario (sync con @convex-dev/auth)
      // Esto se maneja automáticamente, pero si no existe:
      const userId = await ctx.db.insert("users", {
        display_name: identity.name ?? identity.email!.split("@")[0],
        email: identity.email!,
        avatar_url: identity.image ?? undefined,
      });
      // Insertar session
      await ctx.db.insert("user_game_sessions", {
        user_id: userId,
        date: new Date().toISOString().split("T")[0],
        game,
        score,
        found_words: foundWords,
        time_remaining: timeRemaining,
        completed,
      });
      return { success: true, userId };
    }

    await ctx.db.insert("user_game_sessions", {
      user_id: user._id,
      date: new Date().toISOString().split("T")[0],
      game,
      score,
      found_words: foundWords,
      time_remaining: timeRemaining,
      completed,
    });

    // Si completó todos los juegos, actualizar leaderboard
    if (completed) {
      await ctx.scheduler.runAfter(0, internal.scores.updateLeaderboard, {
        userId: user._id,
        date: new Date().toISOString().split("T")[0],
      });
    }

    return { success: true, userId: user._id };
  },
});
```

### 3.2 Mutation: updateLeaderboard

`convex/scores.ts`:
```ts
export const updateLeaderboard = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    const sessions = await ctx.db
      .query("user_game_sessions")
      .withIndex("by_user_date", (q) => q.eq("user_id", userId).eq("date", date))
      .collect();

    const completedGames = sessions.filter((s) => s.completed).length;
    const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);

    const existing = await ctx.db
      .query("leaderboard")
      .withIndex("by_date_score", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        total_score: totalScore,
        games_completed: completedGames,
      });
    } else {
      await ctx.db.insert("leaderboard", {
        date,
        user_id: userId,
        total_score: totalScore,
        games_completed: completedGames,
      });
    }
  },
});
```

### 3.3 Query: getLeaderboard

`convex/scores.ts`:
```ts
export const getLeaderboard = query({
  args: {
    period: v.enum(["daily", "weekly", "monthly", "yearly"]),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { period, limit = 100 }) => {
    const now = new Date();
    let startDate: string;

    switch (period) {
      case "daily":
        startDate = now.toISOString().split("T")[0];
        break;
      case "weekly":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart.toISOString().split("T")[0];
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
        break;
    }

    const sessions = await ctx.db
      .query("user_game_sessions")
      .withIndex("by_date_score", (q) => q.gte("date", startDate))
      .order("desc")
      .take(limit);

    // Agrupar por usuario y calcular score total
    const userScores = new Map<Id<"users">, { score: number; name: string; avatar?: string }>();

    for (const session of sessions) {
      const entry = userScores.get(session.user_id);
      if (entry) {
        entry.score += session.score;
      } else {
        const user = await ctx.db.get(session.user_id);
        userScores.set(session.user_id, {
          score: session.score,
          name: user?.display_name ?? "Unknown",
          avatar: user?.avatar_url,
        });
      }
    }

    return Array.from(userScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([userId, data], index) => ({
        rank: index + 1,
        userId,
        name: data.name,
        avatar: data.avatar,
        score: data.score,
      }));
  },
});
```

### 3.4 Query: getUserStats

`convex/scores.ts`:
```ts
export const getUserStats = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    const sessions = await ctx.db
      .query("user_game_sessions")
      .withIndex("by_user_date", (q) => q.eq("user_id", userId).eq("date", date))
      .collect();

    return {
      games: sessions.length,
      completed: sessions.filter((s) => s.completed).length,
      totalScore: sessions.reduce((sum, s) => sum + s.score, 0),
      wordsFound: sessions.reduce((sum, s) => sum + s.found_words.length, 0),
    };
  },
});
```

## 4. Integración con Palabrejas

### 4.1 Modificar `components/game/palabrejas/index.tsx`

- Importar `useAuth` de `@convex-dev/auth/react`
- Al detectar `isExpired`, llamar a mutation `saveGameScore`
- Pasar `foundWords`, `totalScore`, `timeRemaining`, `completed`

### 4.2 Modificar `GameOverOverlay`

- Añadir botón "Ver ranking" que abre/navega a leaderboard
- Mostrar puntuación del usuario en el ranking si está logueado

## 5. Componente Leaderboard

`components/game/leaderboard.tsx`:
- Tabs: Día / Semana / Mes / Año
- Tabla con: rank, avatar, nombre, score
- Destacar usuario actual si está logueado
- Mostrar "Inicia sesión para guardar tu puntuación" si no hay sesión

## 6. Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXTAUTH_SECRET` | Clave para sessions de NextAuth |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client secret de Google OAuth |
| `SITE_URL` | URL del sitio (http://localhost:3000 en dev) |

## 7. Consideraciones de seguridad

- Todas las mutations validan `ctx.auth.getUserIdentity()`
- Las queries de leaderboard son públicas (no requieren auth)
- Solo el usuario puede ver sus propias estadísticas detalladas
- Las passwords se gestionan automáticamente por `@convex-dev/auth`

## 8. Dependencias a instalar

```bash
npm install @convex-dev/auth next-auth jose
```
