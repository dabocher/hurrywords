"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const DailyWords = () => {
    const pool = useQuery(api.daily.getTodayPool, {
        dateStr: new Date().toISOString().split("T")[0],
    });

    if (pool === undefined) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
            </div>
        );
    }

    if (pool === null || pool.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500 gap-2">
                <p className="text-lg font-semibold text-stone-400">No hay palabras para hoy.</p>
                <p className="text-sm">El pool se genera automáticamente a medianoche.</p>
            </div>
        );
    }

    const words = pool.filter((w): w is NonNullable<typeof w> => w !== null);

    return (
        <div className="w-full max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {words.map((word) => {
                    const lemma = word.lemma ?? "";
                    const len = lemma.length;
                    const points = len <= 5 ? "1" : len <= 11 ? "2" : "3";

                    return (
                        <div
                            key={word._id}
                            className="bg-stone-900 rounded-xl border border-stone-800 px-4 py-3 flex items-center justify-between"
                        >
                            <span className="text-stone-200 font-medium">
                                {lemma}
                            </span>
                            <span className="text-xs text-stone-500 bg-stone-800 px-2 py-1 rounded">
                                {points} pts
                            </span>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-stone-600 text-center mt-4">
                {pool.length} palabras · 1 punto (2-5 letras), 2 puntos (6-11), 3 puntos (12+)
            </p>
        </div>
    );
};

export { DailyWords };
