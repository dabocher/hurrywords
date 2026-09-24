"use client";

import { useState } from "react";
import { Palabrejas } from "@/components/game/palabrejas";
import { HowToPlay } from "@/components/game/palabrejas/how-to-play";

const PalabrejasPage = () => {
    const [showHowToPlay, setShowHowToPlay] = useState(false);

    return (
        <main className="flex min-h-screen flex-col items-center gap-8 p-12">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold tracking-tight text-amber-400">
                    Palabrejas
                </h1>
                <button
                    onClick={() => setShowHowToPlay(true)}
                    className="w-8 h-8 w-full px-4 font-normal rounded-full border-2 border-amber-400 text-amber-400 font-bold text-sm
                               hover:border-amber-500 hover:text-amber-500 transition-colors flex items-center justify-center"
                    aria-label="Cómo jugar"
                >
                    ? Reglas
                </button>
            </div>
            <Palabrejas />
            <HowToPlay isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
        </main>
    );
}

export default PalabrejasPage;
