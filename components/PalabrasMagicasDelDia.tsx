"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar } from "../convex/daily/Calendar";
import { DaySummaryCard } from "../convex/daily/DaySummaryCard";
import { WordList } from "../convex/daily/WordList";

const todayStr = () => new Date().toISOString().split("T")[0];

export const PalabrasMagicasDelDia = () => {
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const dailyWords = useQuery(api.daily.getTodayPool, {
    dateStr: selectedDate,
  });

  const isLoading = dailyWords === undefined;
  const words = dailyWords ?? [];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-1">
            Diccionario RAE
          </p>
          <h1 className="text-3xl font-bold text-stone-900">
            Palabras del día
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Columna izquierda: calendario + resumen */}
          <div className="lg:w-72 shrink-0">
            <Calendar selected={selectedDate} onSelect={setSelectedDate} />
            <DaySummaryCard
              date={selectedDate}
              wordCount={isLoading ? null : words.length}
            />
          </div>

          {/* Columna derecha: lista de palabras */}
          <div className="flex-1 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-700">
                Las 36 palabras mágicas
              </h2>
              {!isLoading && words.length > 0 && (
                <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2.5 py-1 rounded-full">
                  {words.length} palabras
                </span>
              )}
            </div>

            <div className="px-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                </div>
              ) : (
                <WordList words={words as any} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
