# Arquitectura — Qué significa "hacer un buen trabajo"

> Este documento define el estándar de calidad. Los agentes revisores
> evalúan código contra este archivo. Si no está aquí, no es un requisito.

## Stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS.
- **Backend (si una feature lo requiere):** Next.js Route Handlers
  (`app/api/**/route.ts`) o Server Actions. Base de datos: Convex.
- **Gestor de paquetes:** npm. El `package-lock.json` es la fuente de verdad;
  nunca se edita a mano.
- **Tests:** Vitest + Testing Library para unitarios/componentes,
  Playwright para e2e.

## Principios

1. **Capas claras.** El proyecto separa:
   - `app/` — rutas, layouts, route handlers (App Router). Orquesta, no
     contiene lógica de negocio compleja.
   - `components/` — componentes de UI reutilizables. Reciben datos por
     props, no hacen fetch directo salvo que sean Server Components.
   - `lib/` — lógica pura (funciones, validación, formateo, clientes de
     Convex). Sin JSX, testeable sin DOM.
   - `convex/` — funciones de Convex (queries, mutations, schema), si la
     feature usa base de datos.
     No introducir capas adicionales (estado global, contextos nuevos,
     librerías de fetching) hasta que haya una razón concreta documentada
     en `feature_list.json`.

2. **Dependencias controladas.** Añadir una dependencia nueva a
   `package.json` está permitido, pero debe:
   - Justificarse en la sección `notes` de la feature en `feature_list.json`
     (qué resuelve, por qué no se puede hacer con lo ya instalado).
   - Instalarse con `npm install <paquete>` (nunca editar `package.json` a
     mano) para que `package-lock.json` quede consistente.
   - Quedar reflejada en el informe del implementer (`progress/impl_<feature>.md`).
   Sin justificación → el reviewer rechaza con `CHANGES_REQUESTED`.

3. **Server vs Client Components.** Por defecto, todo componente es Server
   Component. Solo se añade `"use client"` cuando hay estado, efectos, o
   handlers de evento en el navegador. No marcar `"use client"` "por si
   acaso".

4. **Tipado estricto.** Nada de `any` salvo justificación explícita en
   comentario. `tsc --noEmit` debe pasar sin errores ni warnings.

5. **Errores explícitos.** Los Route Handlers devuelven códigos HTTP
   correctos y un body JSON con `{ error: string }` en caso de fallo. Los
   componentes de cliente no tragan errores en silencio (usa `error.tsx` o
   estados de error explícitos).

6. **Estilos.** Solo Tailwind utility classes. No CSS-in-JS, no archivos
   `.module.css` salvo caso excepcional documentado.

## Flujo de datos (caso con Convex)

```
usuario  ─→  componente cliente ("use client")
              │
              ├─ useQuery / useMutation (convex/react)
              │
              └─→  convex/<modulo>.ts (query/mutation)
                       │
                       └─→  Convex (base de datos)
```

## Qué NO hacer

- No hacer `fetch` a APIs externas directamente desde un Client Component;
  pasa por un Route Handler o una función en `lib/`.
- No mezclar lógica de negocio dentro de archivos de `app/` cuando supera
  ~15 líneas; extrae a `lib/`.
- No leer/escribir el estado de Convex en un bucle dentro de un componente.
  Usa `useQuery`/`useMutation` tal como están pensados (reactivos).
- No añadir un sistema de configuración paralelo a `next.config.ts` /
  variables de entorno (`.env.local`).
- No commitear `.env.local` ni secretos. `.env.local` está en `.gitignore`.
