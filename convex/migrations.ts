import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Convierte a mayúscula la primera letra de todas las definiciones en rae_words.
 * Ejecuta UNA SOLA VEZ:
 *   npx convex run migrations:capitalizeDefinitions
 * Vuelve a ejecutar hasta ver "✓ Completado".
 */
export const capitalizeDefinitions = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, { cursor }) => {
    const PAGE = 500;

    const page = await ctx.db
      .query("rae_words")
      .paginate({ cursor: cursor ?? null, numItems: PAGE });

    let patched = 0;
    for (const doc of page.page) {
      const updatedSenses = doc.senses.map((sense) => ({
        ...sense,
        definition:
          sense.definition.charAt(0).toUpperCase() + sense.definition.slice(1),
      }));

      await ctx.db.patch(doc._id, { senses: updatedSenses });
      patched++;
    }

    const status = page.isDone
      ? "✓ Completado"
      : `Continúa con cursor: ${page.continueCursor}`;
    console.log(`${patched} docs parchados. ${status}`);

    return {
      done: page.isDone,
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});
