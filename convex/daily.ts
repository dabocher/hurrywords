import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeStr } from "./palabrejas";

const POOL_SIZE = 36;

export const generateDailyPool = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("daily_pool")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existing) {
      console.log("Pool diario de " + today + " ya existe.");
      return existing._id;
    }

    const palabrejasConfig = await ctx.db
      .query("palabrejas_daily")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (!palabrejasConfig) {
      throw new Error(
        "No existe config de Palabrejas para " + today +
        ". Ejecuta primero generateDailyPalabrejas."
      );
    }

    const { validWords } = palabrejasConfig;

    if (validWords.length < POOL_SIZE) {
      console.warn("Solo hay " + validWords.length + " palabras válidas.");
    }

    const shuffled = [...validWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, POOL_SIZE);
    const wordIds  = selected.map((vw) => vw.wordId);

    const poolId = await ctx.db.insert("daily_pool", {
      date:    today,
      wordIds: wordIds as any,
    });

    console.log("Pool de " + today + " creado con " + wordIds.length + " palabras.");
    return poolId;
  },
});

export const getTodayPool = query({
  args: { dateStr: v.string() },
  handler: async (ctx, { dateStr }) => {
    const pool = await ctx.db
      .query("daily_pool")
      .withIndex("by_date", (q) => q.eq("date", dateStr))
      .first();

    if (!pool) return [];

    const words = await Promise.all(pool.wordIds.map((id) => ctx.db.get(id)));
    return words.filter(Boolean);
  },
});
