import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. MUTACIÓN: Esta función será ejecutada por el Cron Job cada noche
export const generateDailyPool = internalMutation({
  handler: async (ctx) => {
    const selectedWords = new Set<string>();
    const wordIds: any[] = [];

    // Límite de seguridad (attempts) para evitar bucles infinitos pase lo que pase
    let attempts = 0;

    // Elegir 36 palabras únicas eficientemente
    while (wordIds.length < 36 && attempts < 100) {
      attempts++;
      const randomVal = Math.random();

      // Buscamos la palabra cuyo número mágico sea justo superior al generado
      let word = await ctx.db
        .query("rae_words")
        .withIndex("by_random", (q) => q.gte("randomOrder", randomVal))
        .first();

      // Si nos pasamos de largo, damos la vuelta al principio
      if (!word) {
        word = await ctx.db.query("rae_words").withIndex("by_random").first();
      }

      // Si encontramos palabra y no está repetida, la añadimos
      if (word && !selectedWords.has(word._id)) {
        selectedWords.add(word._id);
        wordIds.push(word._id);
      }
    }

    // Calculamos la fecha de hoy en formato "DD-MM-YYYY" (UTC)
    const today = new Date().toISOString().split("T")[0];

    // Guardamos el pool en la base de datos
    await ctx.db.insert("daily_pool", {
      date: today,
      wordIds: wordIds,
    });

    return `Pool generado con ${wordIds.length} palabras.`;
  },
});

// 2. QUERY: Esta es la función que llamará tu frontend para mostrar las palabras
export const getTodayPool = query({
  args: { dateStr: v.string() }, // El frontend debe pasar la fecha, ej: "2026-06-25"
  handler: async (ctx, args) => {
    // Buscamos el pool correspondiente a la fecha enviada
    const pool = await ctx.db
      .query("daily_pool")
      .withIndex("by_date", (q) => q.eq("date", args.dateStr))
      .first();

    if (!pool) return []; // Si aún no ha corrido el cron, devolvemos vacío

    // Usamos Promise.all para recuperar los datos completos de las 36 palabras
    const words = await Promise.all(pool.wordIds.map((id) => ctx.db.get(id)));

    // Filtramos posibles nulos por seguridad y devolvemos las palabras
    return words.filter((w) => w !== null);
  },
});

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
