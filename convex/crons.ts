import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 00:00 — 1º: elige letras e inicia procesamiento encadenado (tarda ~1-2 min)
crons.daily(
  "generar palabrejas diario",
  { hourUTC: 0, minuteUTC: 0 },
  internal.palabrejas.generateDailyPalabrejas,
);

// 00:30 — 2º: 36 mágicas (30 min de margen para que palabrejas termine)
crons.daily(
  "generar pool de palabras diario",
  { hourUTC: 0, minuteUTC: 30 },
  internal.daily.generateDailyPool,
);

// 00:35 — 3º: abecedario para PasaPalabra
crons.daily(
  "generar abecedario diario",
  { hourUTC: 0, minuteUTC: 35 },
  internal.alphabet.generateAlphabetPool,
);

// 00:40 — 4º: pool de PasaPalabra
crons.daily(
  "generar pasapalabra pool",
  { hourUTC: 0, minuteUTC: 40 },
  internal.pasapalabraPool.generatePasapalabraPool,
);

export default crons;
