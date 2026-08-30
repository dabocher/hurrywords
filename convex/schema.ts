// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rae_words: defineTable({
    etymology: v.optional(v.string()),
    lemma: v.string(),
    senses: v.array(
      v.object({
        definition: v.string(),
        grammar: v.optional(v.string()),
        number: v.float64(),
        register: v.optional(v.string()),
      }),
    ),

    // NUEVOS CAMPOS:
    firstLetter: v.optional(v.string()),
    randomOrder: v.optional(v.float64()),
  })
    .index("by_lemma", ["lemma"])
    // EL ÍNDICE MÁGICO: Filtra por letra y ordena por el número aleatorio
    .index("by_letter_random", ["firstLetter", "randomOrder"])
    .index("by_random", ["randomOrder"]),

  // TABLA: Guarda las 36 letras de cada día
  alphabet_pool: defineTable({
    date: v.string(),
    words: v.array(
      v.object({
        letter: v.string(),
        wordId: v.id("rae_words"),
      }),
    ),
  }).index("by_date", ["date"]),

  // TABLA: Guarda las 36 palabras de cada día
  daily_pool: defineTable({
    date: v.string(), // Formato "YYYY-MM-DD"
    wordIds: v.array(v.id("rae_words")),
  }).index("by_date", ["date"]),

  // TABLA: Guarda las 10 palabras mínimo por cada letra diariamente, para el juego pasapalabra
  pasapalabra_pools: defineTable({
    date: v.string(), // "2025-06-17"
    entries: v.array(
      v.object({
        wordId: v.id("rae_words"),
        letter: v.string(), // primera letra del lemma
        isMagic: v.boolean(), // true = viene del pool de 36 palabras
      }),
    ),
  }).index("by_date", ["date"]),
});
