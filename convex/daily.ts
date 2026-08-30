// convex/daily.ts
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

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
      console.log("Pool de " + today + " ya existe.");
      return existing._id;
    }

    const threshold = Math.random();
    const ids: any[] = [];

    const upper = await ctx.db
      .query("rae_words")
      .withIndex("by_random", (q) => q.gte("randomOrder", threshold))
      .take(POOL_SIZE);
    for (const w of upper) ids.push(w._id);

    if (ids.length < POOL_SIZE) {
      const lower = await ctx.db
        .query("rae_words")
        .withIndex("by_random", (q) => q.lt("randomOrder", threshold))
        .take(POOL_SIZE - ids.length);
      for (const w of lower) ids.push(w._id);
    }

    const poolId = await ctx.db.insert("daily_pool", {
      date: today,
      wordIds: ids,
    });
    console.log(
      "Pool de " + today + " creado con " + ids.length + " palabras.",
    );
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
