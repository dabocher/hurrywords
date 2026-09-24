"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type PasapalabraEntry = {
  wordId: string;
  letter: string;
  isMagic: boolean;
  word: {
    _id: string;
    lemma: string;
    senses: { definition: string }[];
  };
};

type PasapalabraPool = {
  date: string;
  entries: PasapalabraEntry[];
};

export const Pasapalabra = () => {
  const todayStr = new Date().toISOString().split("T")[0];
  const dailyWords = useQuery(api.pasapalabraPool.getTodayPasapalabraPool);

  if (dailyWords === undefined)
    return <div>Cargando las palabras del día...</div>;
  if (!dailyWords) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Aún no se ha generado el pool del día ({todayStr}).</p>
      </div>
    );
  }

  const entries = dailyWords.entries;

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight mb-4">
        Las 36 Palabras de Hoy
      </h1>
      <ul>
        {entries.map((entry: PasapalabraEntry, index: number) => (
          <li key={entry.word._id}>
            <strong>
              {index + 1}. {entry.word.lemma}
            </strong>
            : {entry.word.senses[0]?.definition ?? "—"}.
          </li>
        ))}
      </ul>
    </section>
  );
};
