import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { LETTERS } from "./data";

const WORDS_PER_LETTER = 10;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export const generatePasapalabraPool = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = todayUTC();

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
