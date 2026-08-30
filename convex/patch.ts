import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

export const addRandomFields = mutation({
  handler: async (ctx) => {
    // Al usar el índice "by_random", las palabras que NO tienen randomOrder
    // (es decir, undefined) aparecen instantáneamente las primeras.
    // Esto hace que la búsqueda tarde 0.001 segundos en lugar de fallar.
    const words = await ctx.db
      .query("rae_words")
      .withIndex("by_random")
      .take(1000);

    let patchedCount = 0;

    for (const word of words) {
      // Verificamos que la palabra realmente necesite el parche
      if (word.randomOrder === undefined) {
        let initial = word.lemma.charAt(0).toLowerCase();
        const accents: Record<string, string> = {
          á: "a",
          é: "e",
          í: "i",
          ó: "o",
          ú: "u",
        };
        if (accents[initial]) initial = accents[initial];

        await ctx.db.patch(word._id, {
          firstLetter: initial,
          randomOrder: Math.random(),
        });
        patchedCount++;
      }
    }

    // LA MAGIA DE CONVEX: Si ha encontrado palabras para parchear,
    // se vuelve a invocar a sí misma para seguir con el resto en segundo plano.
    if (patchedCount > 0) {
      await ctx.scheduler.runAfter(0, api.patch.addRandomFields);
      return `Se parchearon ${patchedCount} palabras. La siguiente ronda se ha lanzado automáticamente en segundo plano...`;
    } else {
      return `¡ÉXITO TOTAL! Ya no quedan palabras sin parchear. El diccionario está al 100%.`;
    }
  },
});
