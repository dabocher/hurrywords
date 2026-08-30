// convex/alphabet.ts
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

const SPANISH_ALPHABET = "abcdefghijklmnñopqrstuvwxyz".split("");

export const generateAlphabetPool = internalMutation({
  handler: async (ctx) => {
    const selectedWords = [];

    for (const letter of SPANISH_ALPHABET) {
      // Generamos un "tiro de dardos" aleatorio para hoy entre 0 y 1
      const dailyRandom = Math.random();

      // Buscamos la primera palabra de esa letra cuyo número sea mayor al que generamos
      let word = await ctx.db
        .query("rae_words")
        .withIndex("by_letter_random", (q) =>
          q.eq("firstLetter", letter).gte("randomOrder", dailyRandom),
        )
        .first();

      // Si el random fue muy alto (ej. 0.99) y no hay nadie por encima,
      // damos la vuelta al círculo y cogemos el primero desde 0.
      if (!word) {
        word = await ctx.db
          .query("rae_words")
          .withIndex("by_letter_random", (q) => q.eq("firstLetter", letter))
          .first();
      }

      if (word) {
        selectedWords.push({ letter: letter, wordId: word._id });
      }
    }

    const today = new Date().toISOString().split("T")[0];

    await ctx.db.insert("alphabet_pool", {
      date: today,
      words: selectedWords,
    });
  },
});
