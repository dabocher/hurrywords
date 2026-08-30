# Convenciones de código

> Homogeneidad extrema. La IA predice mejor cuando el repositorio se parece
> a sí mismo en todas partes.

## Estilo TypeScript / React

- **Strict mode:** activado en `tsconfig.json`. No se desactiva.
- **Formato:** el que aplique ESLint (`npm run lint`). No discutir el
  formato manualmente; si ESLint no se queja, está bien formateado.
- **Imports:** usa el alias `@/*` (p. ej. `@/components/Counter`) en vez de
  rutas relativas largas (`../../components/Counter`). Externos primero,
  luego alias `@/`, luego relativos.
- **Componentes:** un componente por archivo. Nombre del archivo =
  `PascalCase.tsx` = nombre del componente exportado.
- **Funciones puras (`lib/`):** `kebab-case.ts`, export nombrado (no
  `default`) salvo en archivos especiales de Next.js (`page.tsx`,
  `layout.tsx`, `route.ts`, que sí requieren `default export`).
- **Strings:** comillas dobles `"..."`, consistente con lo que ya aplica
  Prettier/ESLint en este repo.
- **Server vs Client:** `"use client"` va en la primera línea del archivo,
  solo si el componente lo necesita (ver `docs/architecture.md`).

## Nombres

| Tipo                      | Convención       | Ejemplo                  |
| -------------------------- | ---------------- | ------------------------- |
| Componentes (archivo)      | `PascalCase.tsx` | `Counter.tsx`             |
| Funciones / variables      | `camelCase`      | `formatCurrency`          |
| Tipos / interfaces         | `PascalCase`     | `CounterProps`            |
| Constantes globales        | `UPPER_SNAKE`    | `DEFAULT_LOCALE`          |
| Archivos de lib            | `kebab-case.ts`  | `format-currency.ts`      |
| Rutas API                  | `kebab-case`     | `app/api/user-notes/route.ts` |
| Funciones de Convex        | `camelCase`      | `convex/notes.ts: list`   |

## Estructura de archivo

Cada componente de `components/` sigue este orden:

```tsx
"use client"; // solo si aplica, primera línea

import { useState } from "react"; // externos
import { formatCurrency } from "@/lib/format-currency"; // alias @/

type ComponentProps = {
  // props tipadas explícitamente, nunca `any`
};

export function Component({ ...props }: ComponentProps) {
  // ...
}
```

Cada archivo en `lib/` empieza con una exportación clara de tipos antes de
la implementación, sin JSX.

## Tests

- **Unitarios / componentes (Vitest + Testing Library):**
  - Un archivo de test junto al código: `Componente.test.tsx` o
    `funcion.test.ts` en el mismo directorio.
  - `describe("NombreUnidad", () => { it("hace algo concreto", ...) })`.
  - Para componentes: usa `screen.getByRole` / `getByLabelText` /
    `getByTestId` (en ese orden de preferencia). Evita seleccionar por
    clases CSS.
  - Nombres de test descriptivos en presente: `"increments by the given
    step on click"`, no `"test1"` o `"funciona"`.
- **E2E (Playwright):** en `tests/e2e/*.spec.ts`. Solo para flujos
  completos de usuario (navegación, formularios end-to-end), no para
  lógica que ya cubre un test unitario.

## Manejo de errores

- En `lib/`, lanza errores con clases nombradas cuando el dominio lo
  justifique:

```ts
export class ValidationError extends Error {}
```

- En Route Handlers (`app/api/**/route.ts`), captura errores de dominio y
  responde con el status HTTP correcto:

```ts
export async function POST(req: Request) {
  try {
    // ...
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
```

- En componentes de cliente, nunca tragues una promesa rechazada en
  silencio: maneja el estado de error explícitamente o deja que el
  `error.tsx` de Next.js lo capture.

## Comentarios

Por defecto **no** se escriben. Solo se permiten cuando explican un _por
qué_ no obvio (workaround documentado, invariante sutil, decisión de
arquitectura no evidente). Los nombres y los tipos deben hacer el resto.
