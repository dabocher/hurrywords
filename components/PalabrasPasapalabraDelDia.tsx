"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export const PalabrasPasapalabraDelDia = () => {
  const todayStr = new Date().toISOString().split("T")[0];
  const dailyWords = useQuery(api.pasapalabraPool.getTodayPasapalabraPool);

  if (dailyWords === undefined)
    return <div>Cargando las palabras del día...</div>;
  if (dailyWords.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Aún no se ha generado el pool del día ({todayStr}).</p>
      </div>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight mb-4">
        Las 36 Palabras de Hoy
      </h1>
      <ul>
        {dailyWords.map((word, index) => (
          <li key={word._id}>
            <strong>
              {index + 1}. {word.lemma}
            </strong>
            : {word.senses[0].definition}.
          </li>
        ))}
      </ul>
    </section>
  );
};
