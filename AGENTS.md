# AGENTS.md

Reglas de proyecto para agentes de IA (Opencode). Léelas antes de generar o modificar código.

## Flujo de trabajo para nuevas features (Spec-Driven Development)

**No implementes una feature nueva directamente.** Sigue este flujo en orden, usando los comandos de `.opencode/command/`:

1. `/specify <descripción>` → genera `specs/<slug>/spec.md` (qué y por qué, sin detalles técnicos).
2. `/plan <slug>` → genera `specs/<slug>/plan.md` (cómo, respetando este archivo y `docs/game-design.md`).
3. `/tasks <slug>` → genera `specs/<slug>/tasks.md` (checklist de tareas pequeñas y verificables).
4. `/implement <slug>` → ejecuta las tareas de `tasks.md` una a una.

Cada fase espera mi aprobación antes de pasar a la siguiente. El detalle de qué debe contener cada fase está en el propio archivo de cada comando (`.opencode/command/specify.md`, etc.) — no lo dupliques aquí.

## Proyecto

Hurrywords: conjunto de juegos de palabras conectados entre sí (Palabreja, Pasapalabra, Encadenados, Ahorcado, Crucigrama) mediante un pool de palabras mágicas compartido por usuario y día.

**Antes de tocar lógica de puntuación, generación de pools, temporizadores o reglas de cualquier minijuego, lee [`docs/game_design.md`](./docs/game-design.md).** Ese documento es la fuente de verdad del diseño funcional (reglas de puntuación, tamaños de pool, palabras mágicas, etc.) y cambia con más frecuencia que este archivo — no dupliques esas reglas aquí.

## Stack

- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **Base de datos / backend**: Convex.io
- **Paradigma**: Programación funcional

## Reglas de estilo de código (obligatorias)

### Funciones

- **Siempre arrow functions**, nunca `function` declarations ni `function` expressions.
  ```ts
  // ✅ Correcto
  const getUser = (id: string) => { ... }

  // ❌ Incorrecto
  function getUser(id: string) { ... }
  ```
- Componentes de React también como arrow functions con export const:
  ```ts
  // ✅ Correcto
  export const UserCard = ({ user }: UserCardProps) => { ... }

  // ❌ Incorrecto
  export default function UserCard({ user }: UserCardProps) { ... }
  ```
- Prohibido `class`. Sin clases, sin `this`. Usar composición de funciones y hooks.
- Preferir funciones puras: mismo input → mismo output, sin efectos secundarios ocultos.
- Evitar mutación directa. Usar spread (`{...obj}`, `[...arr]`), `map`, `filter`, `reduce` en vez de loops imperativos cuando aporte claridad.
- No usar `let` salvo que sea estrictamente necesario (acumuladores, reasignación real). Preferir `const`.

### TypeScript

- `strict: true` en `tsconfig.json`. No desactivar reglas de strict mode.
- **Prohibido `any`**. Si el tipo es incierto, usar `unknown` y hacer narrowing.
- Tipar explícitamente los parámetros y el retorno de funciones exportadas/públicas. Se puede inferir el retorno en funciones internas simples.
- Usar `type` para uniones, intersecciones y props de componentes. Usar `interface` solo si se necesita `extends`/declaration merging.
- Reutilizar los tipos generados por Convex (`Doc<"table">`, `Id<"table">`, validadores de `convex/values`) en vez de redefinir tipos a mano para entidades de la base de datos.
- Evitar type assertions (`as X`) salvo casos justificados y comentados.

### Condicionales

- Para **expresiones** (asignar un valor, un retorno, o renderizado condicional en JSX), preferir el operador ternario sobre `if/else`:
  ```ts
  // ✅ Correcto
  const label = isActive ? "Activo" : "Inactivo";

  return isLoading ? <Spinner /> : <UserList users={users} />;

  // ❌ Evitar (if/else solo para asignar un valor)
  let label;
  if (isActive) {
    label = "Activo";
  } else {
    label = "Inactivo";
  }
  ```
- **Prohibido anidar ternarios** (ternario dentro de otro ternario). Si hay más de 2 ramas o la condición es compleja, usar un `if/else`, un `switch`, o extraer la lógica a una función auxiliar (ej. un objeto de mapeo `Record<Status, string>`).
  ```ts
  // ❌ Incorrecto
  const label = status === "active" ? "Activo" : status === "pending" ? "Pendiente" : "Inactivo";

  // ✅ Correcto
  const STATUS_LABELS: Record<Status, string> = {
    active: "Activo",
    pending: "Pendiente",
    inactive: "Inactivo",
  };
  const label = STATUS_LABELS[status];
  ```
- Para **statements** con efectos secundarios (ej. `return` temprano, mutaciones, llamadas a funciones sin retorno útil), usar `if`, no ternario:
  ```ts
  // ✅ Correcto
  if (!user) return null;

  // ❌ Incorrecto (ternario usado solo por su efecto secundario)
  !user ? return null : doSomething();
  ```

### Código limpio

- Nombres descriptivos, sin abreviaturas crípticas (`usr` → `user`, `idx` → `index` solo en loops triviales).
- Funciones cortas y con una sola responsabilidad. Si una función supera ~30-40 líneas, considerar extraer sub-funciones.
- Sin lógica de negocio dentro de componentes JSX: extraer a hooks (`useX`) o funciones puras en `lib/` o `utils/`.
- Sin comentarios que expliquen "qué" hace el código obvio; sí comentarios que expliquen "por qué" ante decisiones no evidentes.
- Early returns en vez de anidar `if/else` en profundidad.
- Evitar props drilling: usar Context o composición de componentes cuando se pase el mismo prop más de 2-3 niveles.

## Next.js (App Router)

- Server Components por defecto. Usar `"use client"` solo cuando se necesite interactividad, hooks de estado o efectos del navegador.
- Data fetching desde Server Components o Server Actions siempre que sea posible; evitar `useEffect` para fetch de datos.
- Server Actions también como arrow functions, con `"use server"` al inicio del archivo o de la función.
- Rutas y carpetas siguiendo las convenciones del App Router (`app/`, `page.tsx`, `layout.tsx`, `route.ts`).
- Metadata de páginas vía el objeto `metadata` o `generateMetadata`, no `<head>` manual.

## Convex.io

- Convex es la única fuente de verdad para datos remotos. No duplicar estado del servidor en `useState`/`useReducer`; usar `useQuery`/`useMutation` de Convex directamente.
- Definir el schema en `convex/schema.ts` con `defineSchema` y `defineTable`, tipando cada campo con los validadores de `convex/values` (`v.string()`, `v.id("table")`, etc.).
- Separar claramente:
  - **Queries** (`convex/*.ts`, funciones `query`): solo lectura, sin efectos secundarios.
  - **Mutations** (`mutation`): escritura, deben validar inputs antes de escribir.
  - **Actions** (`action`): para llamadas externas (APIs, servicios de terceros); no acceden a la base de datos directamente, delegan en mutations/queries internas.
- Nombrar los archivos de funciones Convex según el dominio (`convex/users.ts`, `convex/posts.ts`), no un único `convex/api.ts` gigante.
- Usar índices (`.index(...)`) en el schema para cualquier query que filtre o ordene por un campo que no sea el `_id`.
- Autorización: validar permisos dentro de cada mutation/query, nunca confiar solo en la UI para restringir acceso.

## Estructura de carpetas sugerida

```
app/                # rutas (App Router)
components/         # componentes reutilizables (arrow functions)
convex/             # schema, queries, mutations, actions
hooks/              # custom hooks (useX)
lib/                # funciones puras / utilidades
types/              # tipos compartidos que no vienen de Convex
```

## Testing y calidad

- Antes de dar por terminada una tarea, correr `tsc --noEmit`, lint y build (`next build`) si aplica.
- No dejar `console.log` en código que se entrega; usar herramientas de logging solo si el proyecto ya las tiene configuradas.
- Si se agrega una función pura no trivial en `lib/`, agregar (o proponer) un test unitario.

## Git / commits

- Commits pequeños y descriptivos en imperativo (`add convex mutation for posts`, no `added` ni `adding`).
- No mezclar cambios de estilo/formato masivo con cambios funcionales en el mismo commit.
