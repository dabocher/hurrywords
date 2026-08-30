import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Ejecutar todos los días a medianoche (UTC)
crons.daily(
  "generar pool de palabras diario",
  { hourUTC: 0, minuteUTC: 0 },
  internal.palabrasMagicasDaily.generateDailyPool,
);

// NUEVO CRON: Rosco Abecedario todos los días a medianoche UTC
crons.daily(
  "generar abecedario diario",
  { hourUTC: 0, minuteUTC: 0 },
  internal.alphabet.generateAlphabetPool,
);

// 00:10 UTC — genera el pool de PasaPalabra (5 min después, para que las mágicas ya existan)
crons.daily(
  "generate pasapalabra pool",
  { hourUTC: 0, minuteUTC: 10 },
  internal.pasapalabraPool.generatePasapalabraPool,
);

export default crons;
