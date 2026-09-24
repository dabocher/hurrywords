"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Board } from "./board";
import { WordInput } from "./word-input";
import { ScoreBoard } from "./score-board";
import { FoundWords, type FoundWord } from "./found-words";
import { Timer } from "./timer";
import { GameOverOverlay } from "./game-over-overlay";
import { useTimer } from "@/hooks/use-timer";
import { useLetterReveal } from "@/hooks/use-letter-reveal";
import { loadFoundWords, saveFoundWords, getTodayStr } from "@/lib/palabrejas-utils";

export const Palabrejas = () => {
  const convexClient = useConvex();
  const config = useQuery(api.palabrejas.getTodayPalabrejas);

  const [currentLetters, setCurrentLetters] = useState<string[]>([]);
  const [foundWords, setFoundWords]         = useState<FoundWord[]>([]);
  const [feedback, setFeedback]             = useState<{
    text: string; type: "error" | "success" | "magic" | "palabreja" | "hidden";
  } | null>(null);
  const [isChecking, setIsChecking]         = useState(false);
  const [gameOver, setGameOver]             = useState(false);
  const [timerStarted, setTimerStarted]     = useState(false);

  const todayStr = getTodayStr();
  const { remaining, status, startTimer, resetTimer, isExpired, adjustRemaining } = useTimer(90, todayStr);
  const {
    phase,
    visibleExteriorIndices,
    countdownSeconds,
    gameStarted,
    onStart,
    triggerDisappear,
  } = useLetterReveal();

  // Cargar palabras encontradas del localStorage
  useEffect(() => {
    if (!config) return;
    setFoundWords(loadFoundWords(getTodayStr()));
  }, [config]);

  // Iniciar timer del juego cuando el countdown termina
  useEffect(() => {
    if (gameStarted && !timerStarted) {
      setTimerStarted(true);
      resetTimer();
      startTimer();
    }
  }, [gameStarted, timerStarted, startTimer, resetTimer]);

  // Trigger desaparición cuando quedan < 30s
  useEffect(() => {
    if (status === "running" && remaining < 30) {
      triggerDisappear(remaining);
    }
  }, [remaining, status, triggerDisappear]);

  const showFeedback = (
    text: string,
    type: "error" | "success" | "magic" | "palabreja" | "hidden",
    ms = 2000
  ) => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), ms);
  };

  const outerLetters = config?.letters.filter((l) => l !== config.centerLetter) ?? [];
  const visibleLetters = useMemo(() => {
    return [
      config?.centerLetter ?? "",
      ...visibleExteriorIndices.map((i) => outerLetters[i] ?? ""),
    ].filter(Boolean);
  }, [config?.centerLetter, visibleExteriorIndices, outerLetters]);

  const handleLetterClick = useCallback(
    (letter: string) => {
      if (isExpired || gameOver) return;
      if (phase === "hidden") return;
      if (status === "idle" && phase !== "countdown") startTimer();
      if (phase === "countdown") {
        setCurrentLetters((prev) => [...prev, letter]);
        return;
      }
      const isCenter = letter === config?.centerLetter;
      const exteriorIndex = outerLetters.indexOf(letter);
      if (!isCenter && exteriorIndex !== -1 && !visibleExteriorIndices.includes(exteriorIndex)) {
        showFeedback("Letra oculta", "hidden");
        return;
      }
      setCurrentLetters((prev) => [...prev, letter]);
    },
    [isExpired, gameOver, phase, status, startTimer, config?.centerLetter, outerLetters, visibleExteriorIndices],
  );

  const handleDelete = useCallback(
    () => setCurrentLetters((prev) => prev.slice(0, -1)),
    []
  );

  const handleClear = useCallback(() => setCurrentLetters([]), []);

  const handleSubmit = useCallback(async () => {
    if (!config || isChecking) return;
    if (isExpired || gameOver) return;
    if (phase === "hidden") return;
    const input = currentLetters.join("");
    if (input.length < 3) return;

    // Pre-check: ya encontrada
    const norm = input.toLowerCase();
    if (foundWords.some((w) => w.normalizedLemma === norm)) {
      showFeedback("Ya la encontraste. -5s", "error");
      adjustRemaining(-5);
      setCurrentLetters([]);
      return;
    }

    setIsChecking(true);
    try {
      const result = await convexClient.query(api.palabrejas.checkWord, {
        input,
        date: getTodayStr(),
        visibleLetters,
      });

      if (!result.valid) {
        showFeedback(result.reason ?? "No válida. -5s", "error");
        adjustRemaining(-5);
      } else {
        const newWord: FoundWord = {
          normalizedLemma: norm,
          displayLemma:    result.word?.lemma ?? norm,
          score:           result.score ?? 0,
          isMagic:         result.isMagic ?? false,
          isPalabreja:     result.isPalabreja ?? false,
        };

        const updated = [...foundWords, newWord];
        setFoundWords(updated);
        saveFoundWords(getTodayStr(), updated);
        setCurrentLetters([]);
        const timeBonus = input.length;
        adjustRemaining(timeBonus);

        if (result.isPalabreja && result.isMagic) {
          showFeedback("🌟 ¡PALABREJA MÁGICA! +" + result.score + " pts (+ " + timeBonus + "s)", "magic", 3000);
        } else if (result.isPalabreja) {
          showFeedback("⭐ ¡PALABREJA! +" + result.score + " pts (+ " + timeBonus + "s)", "palabreja", 3000);
        } else if (result.isMagic) {
          showFeedback("✦ ¡Palabra mágica! +" + result.score + " pts (+ " + timeBonus + "s)", "magic", 2500);
        } else {
          showFeedback("✓ +" + result.score + " pts (+ " + timeBonus + "s)", "success");
        }
      }
    } finally {
      setIsChecking(false);
    }
  }, [config, currentLetters, foundWords, isChecking, convexClient, adjustRemaining, visibleLetters, phase]);

  // Detectar expiración → mostrar overlay
  useEffect(() => {
    if (isExpired) setGameOver(true);
  }, [isExpired]);

  // Teclado físico
  useEffect(() => {
    if (!config) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter")     { handleSubmit(); return; }
      if (e.key === "Backspace") { handleDelete();  return; }
      if (e.key === "Escape")    { handleClear();   return; }

      const letter = e.key.toLowerCase();
      if (config.letters.includes(letter)) handleLetterClick(letter);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [config, handleSubmit, handleDelete, handleClear, handleLetterClick]);

  const totalScore = foundWords.reduce((sum, w) => sum + w.score, 0);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (config === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (config === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-500 gap-2">
        <p className="text-lg font-semibold text-stone-400">No hay Palabrejas para hoy.</p>
        <p className="text-sm">El juego se genera automáticamente a medianoche.</p>
        <p className="text-xs text-stone-600 mt-2 font-mono">
          npx convex run palabrejas:generateDailyPalabrejas
        </p>
      </div>
    );
  }

  // ── Juego ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">

      {/* Columna izquierda: tablero + input */}
      <div className="flex flex-col items-center gap-6 w-full lg:w-3/4">
        <ScoreBoard
          totalScore={totalScore}
          foundCount={foundWords.length}
          totalWords={config.totalWords}
        />

        {phase === "hidden" && (
          <button
            onClick={onStart}
            className="px-8 py-3 bg-amber-400 text-stone-900 font-bold text-lg rounded-xl
                       hover:bg-amber-300 transition-colors"
          >
            Iniciar juego
          </button>
        )}

        {phase === "countdown" && (
          <div className="text-8xl font-bold text-amber-400 animate-pulse">
            {countdownSeconds}
          </div>
        )}

        {(phase !== "hidden") && <Timer remaining={remaining} status={status} duration={90} />}

        <Board
          letters={config.letters}
          centerLetter={config.centerLetter}
          onLetterClick={handleLetterClick}
          disabled={isExpired || gameOver}
          visibleExteriorIndices={visibleExteriorIndices}
        />

        <WordInput
          letters={currentLetters}
          centerLetter={config.centerLetter}
          onDelete={handleDelete}
          onClear={handleClear}
          onSubmit={handleSubmit}
          feedback={feedback}
        />
      </div>

      {/* Columna derecha: palabras encontradas */}
      <div className="w-full lg:w-72 bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-300">Encontradas</h2>
          <span className="text-xs text-stone-600">{foundWords.length}</span>
        </div>
        <div className="px-4 py-2 max-h-[480px] overflow-y-auto">
          <FoundWords words={foundWords} />
        </div>
      </div>

      {gameOver && (
        <GameOverOverlay
          score={totalScore}
          words={foundWords}
          onNextGame={() => {}}
          onClose={() => setGameOver(false)}
        />
      )}

    </div>
  );
};
