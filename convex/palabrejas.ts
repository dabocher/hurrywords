import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ── Helpers ────────────────────────────────────────────────────────────────

const VOWELS = ["a", "e", "i", "o", "u"];

export const normalizeStr = (s: string) =>
  s.toLowerCase()
    .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ú/g, "u").replace(/ü/g, "u");

export const uniqueLetters = (s: string) =>
  [...new Set(normalizeStr(s).split(""))].filter((c) => /^[a-zñ]$/.test(c));

export const isValidForPalabrejas = (
  lemma: string,
  letters: string[],
  center: string
): boolean => {
  const norm = normalizeStr(lemma);
  if (norm.length < 3) return false;
  if (!norm.includes(center)) return false;
  return [...norm].every((c) => letters.includes(c));
};

export const isPalabreja = (normalizedWord: string, letters: string[]) =>
  letters.every((l) => normalizedWord.includes(l));

export const calculateScore = (
  normalizedWord: string,
  letters: string[],
  isMagic: boolean
): number => {
  const len = normalizedWord.length;
  const isP = isPalabreja(normalizedWord, letters);
  const base = len;
  const magicScore = isMagic ? base * 3 : base;
  const palabrejaBonus = isP ? 10 : 0;
  return magicScore + palabrejaBonus;
};

// ── Generación por fases ───────────────────────────────────────────────────
// Convex limita a 32.000 docs leídos por ejecución.
// Con ~5.000 palabras/letra × 7 letras = 35.000 → excede el límite.
// Solución: una función por letra, encadenadas con scheduler.runAfter(0).
//
// Flujo:
//   generateDailyPalabrejas (cron 00:00)
//     └─ schedules processPalabrejasLetter(letterIndex=0, cursor=null)
//          └─ procesa página de letra 0, si hay más páginas se reschedula,
//             si no pasa a letterIndex=1, hasta terminar todas las letras.

export const generateDailyPalabrejas = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("palabrejas_daily")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existing) {
      console.log("Palabrejas de " + today + " ya existe.");
      return existing._id;
    }

    // Elegir palabra semilla con exactamente 7 letras únicas
    let letters: string[] = [];
    let centerLetter = "";

    const threshold = Math.random();
    const sample = await ctx.db
      .query("rae_words")
      .withIndex("by_random", (q) => q.gte("randomOrder", threshold))
      .take(400);

    for (const word of sample) {
      const ul = uniqueLetters(word.lemma);
      if (ul.length === 7 && VOWELS.some((v) => ul.includes(v)) && word.lemma.length >= 6) {
        letters = ul;
        centerLetter = ul.find((l) => VOWELS.includes(l)) ?? ul[0];
        console.log("Semilla: " + word.lemma + " → [" + ul.join(",") + "] central=" + centerLetter);
        break;
      }
    }

    if (letters.length === 0) {
      letters = ["a", "e", "r", "s", "l", "n", "c"];
      centerLetter = "a";
      console.log("Usando letras de fallback.");
    }

    // Crear config inicial (validWords vacío, se llena por fases)
    const configId = await ctx.db.insert("palabrejas_daily", {
      date: today,
      letters,
      centerLetter,
      validWords: [],
      done: false,
    });

    console.log("Config creada. Iniciando procesamiento letra por letra...");

    // Arrancar procesamiento de la primera letra
    await ctx.scheduler.runAfter(0, internal.palabrejas.processPalabrejasLetter, {
      date: today,
      letterIndex: 0,
      cursor: null,
    });

    return configId;
  },
});

/**
 * Procesa una página de palabras para una letra concreta.
 * Se auto-reschedula hasta procesar todas las páginas de todas las letras.
 * Cada llamada lee como máximo ~3.000 docs, bien por debajo del límite de 32k.
 */
export const processPalabrejasLetter = internalMutation({
  args: {
    date:        v.string(),
    letterIndex: v.number(),
    cursor:      v.union(v.string(), v.null()),
  },
  handler: async (ctx, { date, letterIndex, cursor }) => {
    const config = await ctx.db
      .query("palabrejas_daily")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!config) throw new Error("Config de Palabrejas no encontrada para " + date);

    const letter = config.letters[letterIndex];
    const PAGE_SIZE = 3000; // seguro bajo el límite de 32k

    const page = await ctx.db
      .query("rae_words")
      .withIndex("by_letter_random", (q) => q.eq("firstLetter", letter))
      .paginate({ cursor: cursor ?? null, numItems: PAGE_SIZE });

    // Filtrar palabras válidas de esta página
    const existingNorms = new Set(config.validWords.map((w) => w.normalizedLemma));
    const newWords: { wordId: any; normalizedLemma: string }[] = [];

    for (const word of page.page) {
      const norm = normalizeStr(word.lemma);
      if (!existingNorms.has(norm) && isValidForPalabrejas(word.lemma, config.letters, config.centerLetter)) {
        existingNorms.add(norm);
        newWords.push({ wordId: word._id, normalizedLemma: norm });
      }
    }

    const updatedValidWords = [...config.validWords, ...newWords];
    await ctx.db.patch(config._id, { validWords: updatedValidWords });

    if (!page.isDone) {
      // Más páginas para esta misma letra
      await ctx.scheduler.runAfter(0, internal.palabrejas.processPalabrejasLetter, {
        date,
        letterIndex,
        cursor: page.continueCursor,
      });
    } else if (letterIndex < config.letters.length - 1) {
      // Pasar a la siguiente letra
      await ctx.scheduler.runAfter(0, internal.palabrejas.processPalabrejasLetter, {
        date,
        letterIndex: letterIndex + 1,
        cursor: null,
      });
    } else {
      // Todas las letras procesadas
      await ctx.db.patch(config._id, { done: true });
      console.log(
        "✓ Palabrejas de " + date + " completado. " +
        "Letras: [" + config.letters.join(",") + "] " +
        "Central: " + config.centerLetter + " " +
        "Palabras válidas: " + updatedValidWords.length
      );
    }
  },
});

// ── Queries públicas ───────────────────────────────────────────────────────

export const getTodayPalabrejas = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const config = await ctx.db
      .query("palabrejas_daily")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (!config) return null;

    return {
      date:         config.date,
      letters:      config.letters,
      centerLetter: config.centerLetter,
      totalWords:   config.validWords.length,
      done:         config.done ?? false,
    };
  },
});

export const checkWord = query({
  args: {
    input: v.string(),
    date: v.string(),
    visibleLetters: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { input, date, visibleLetters }) => {
    const config = await ctx.db
      .query("palabrejas_daily")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!config) return { valid: false, reason: "No hay configuración para hoy." };

    const centerLetter = config.centerLetter;
    const effectiveLetters = visibleLetters ?? config.letters;
    const norm = normalizeStr(input.trim().toLowerCase());

    if (norm.length < 3)
      return { valid: false, reason: "Mínimo 3 letras." };
    if (!norm.includes(centerLetter))
      return { valid: false, reason: `Debe contener la letra central: ${centerLetter.toUpperCase()}.` };

    const illegalChars = [...norm].filter((c) => !effectiveLetters.includes(c));
    if (illegalChars.length > 0)
      return { valid: false, reason: "Contiene letras no permitidas." };

    // 1. Busca en la lista pre-computada
    let match = config.validWords.find((vw) => vw.normalizedLemma === norm);

    // 2. Red de seguridad: busca directamente en el diccionario
    //    (cubre casos en que el procesamiento por fases aún no terminó)
    if (!match) {
      const firstLetter = norm[0];
      const candidates = await ctx.db
        .query("rae_words")
        .withIndex("by_letter_random", (q) => q.eq("firstLetter", firstLetter))
        .take(4000); // seguro bajo 32k

      const dictWord = candidates.find((w) => normalizeStr(w.lemma) === norm);
      if (dictWord) match = { wordId: dictWord._id, normalizedLemma: norm };
    }

    if (!match) return { valid: false, reason: "No está en el diccionario." };

    const magicPool = await ctx.db
      .query("daily_pool")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    const isMagic = magicPool?.wordIds.some((id) => id === match!.wordId) ?? false;
    const isP = isPalabreja(norm, effectiveLetters);
    const word = await ctx.db.get(match.wordId);

    return {
      valid:       true,
      isMagic,
      isPalabreja: isP,
      score:       calculateScore(norm, effectiveLetters, isMagic),
      word,
    };
  },
});

// ── Mutation: registrar palabras al timeout ────────────────────────────────
// Cuando el timer expira, las palabras encontradas se marcan como mágicas
// para el pool del siguiente juego.
// La integración real con la tabla de user_game_sessions se completa
// cuando se implemente dicha tabla.
export const registerTimeoutWords = mutation({
  args: {
    date:    v.string(),
    words: v.array(
      v.object({
        normalizedLemma: v.string(),
        displayLemma:    v.string(),
        score:           v.number(),
        isMagic:         v.boolean(),
        isPalabreja:     v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { date, words }) => {
    // TODO: Cuando exista user_game_sessions, registrar las palabras como mágicas
    // para el siguiente juego del usuario en este día.
    // Por ahora, retorno las palabras para que el frontend las maneje localmente.
    return { registered: true, words, date };
  },
});
