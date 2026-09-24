import { FoundWord } from "@/lib/palabrejas-utils";
import { FoundWords } from "./found-words";

export type GameOverOverlayProps = {
  score: number;
  words: FoundWord[];
  onNextGame: () => void;
  onClose: () => void;
};

export const GameOverOverlay = ({
  score,
  words,
  onNextGame,
  onClose,
}: GameOverOverlayProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80"
    role="dialog"
    aria-modal="true"
    aria-label="Fin del juego"
  >
    <div className="flex flex-col items-center gap-4 bg-stone-900 rounded-2xl border border-stone-700 px-8 py-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-stone-100">Se acab el tiempo</h2>

      <div className="flex flex-col items-center gap-1">
        <span className="text-5xl font-bold text-amber-400">{score}</span>
        <span className="text-sm text-stone-500">puntos</span>
      </div>

      <p className="text-stone-400">
        {words.length} {words.length === 1 ? "palabra encontrada" : "palabras encontradas"}
      </p>

      {words.length > 0 && (
        <div className="w-full">
          <FoundWords words={words} />
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={onNextGame}
          className="px-6 py-2 rounded-xl font-bold bg-amber-400 text-stone-900
                     hover:bg-amber-300 transition-colors"
        >
          Siguiente juego
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl font-medium bg-stone-800 text-stone-300
                     hover:bg-stone-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
);
