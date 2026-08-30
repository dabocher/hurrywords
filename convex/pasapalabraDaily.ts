import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { LETTERS } from "./data";

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

export const generatePasapalabraPool = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = todayUTC();
    const WORDS_PER_LETTER = 10;
    const existing = await ctx.db
      .query("pasapalabra_pools")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existing) {
      console.log("Pool PasaPalabra de " + today + " ya existe.");
      return existing._id;
    }

    // 1. Obtener las 36 palabras mágicas de hoy (tabla: daily_pool)
    const magicPool = await ctx.db
      .query("daily_pool")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (!magicPool) {
      throw new Error(
        "No existe el pool diario de 36 palabras para " +
          today +
          ". " +
          "Ejecuta primero generateDailyPool.",
      );
    }

    const magicDocs = (
      await Promise.all(magicPool.wordIds.map((id) => ctx.db.get(id)))
    ).filter(Boolean) as any[];

    const magicByLetter = new Map<string, any[]>();
    const magicIdSet = new Set<string>();

    for (const doc of magicDocs) {
      const letter = doc.firstLetter as string | undefined;
      if (!letter) continue;
      magicIdSet.add(doc._id.toString());
      if (!magicByLetter.has(letter)) magicByLetter.set(letter, []);
      magicByLetter.get(letter)!.push(doc);
    }

    // 2. Para cada letra, seleccionar WORDS_PER_LETTER palabras normales
    const entries: { wordId: any; letter: string; isMagic: boolean }[] = [];

    for (const letter of LETTERS) {
      const threshold = Math.random();
      const picked: any[] = [];

      const upper = await ctx.db
        .query("rae_words")
        .withIndex("by_letter_random", (q) =>
          q.eq("firstLetter", letter).gte("randomOrder", threshold),
        )
        .take(WORDS_PER_LETTER * 3);

      for (const w of upper) {
        if (picked.length >= WORDS_PER_LETTER) break;
        if (!magicIdSet.has(w._id.toString())) picked.push(w);
      }

      if (picked.length < WORDS_PER_LETTER) {
        const lower = await ctx.db
          .query("rae_words")
          .withIndex("by_letter_random", (q) =>
            q.eq("firstLetter", letter).lt("randomOrder", threshold),
          )
          .take((WORDS_PER_LETTER - picked.length) * 3);

        for (const w of lower) {
          if (picked.length >= WORDS_PER_LETTER) break;
          if (!magicIdSet.has(w._id.toString())) picked.push(w);
        }
      }

      if (picked.length < WORDS_PER_LETTER) {
        console.warn(
          'Letra "' +
            letter +
            '": solo ' +
            picked.length +
            " palabras normales.",
        );
      }

      for (const w of picked) {
        entries.push({ wordId: w._id, letter, isMagic: false });
      }

      for (const magic of magicByLetter.get(letter) ?? []) {
        entries.push({ wordId: magic._id, letter, isMagic: true });
      }
    }

    const poolId = await ctx.db.insert("pasapalabra_pools", {
      date: today,
      entries,
    });

    const normalCount = entries.filter((e) => !e.isMagic).length;
    const magicCount = entries.filter((e) => e.isMagic).length;
    console.log(
      "Pool PasaPalabra de " +
        today +
        " creado: " +
        normalCount +
        " normales + " +
        magicCount +
        " mágicas = " +
        entries.length +
        " total.",
    );

    return poolId;
  },
});

export const getTodayPasapalabraPool = query({
  args: {},
  handler: async (ctx) => {
    const today = todayUTC();
    const pool = await ctx.db
      .query("pasapalabra_pools")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (!pool) return null;
    return resolvePool(ctx, pool);
  },
});

export const getPasapalabraPoolByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const pool = await ctx.db
      .query("pasapalabra_pools")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!pool) return null;
    return resolvePool(ctx, pool);
  },
});

async function resolvePool(ctx: any, pool: any) {
  const entries = await Promise.all(
    pool.entries.map(async (entry: any) => {
      const word = await ctx.db.get(entry.wordId);
      return word ? { ...entry, word } : null;
    }),
  );
  return {
    date: pool.date,
    entries: entries.filter(Boolean),
  };
}
