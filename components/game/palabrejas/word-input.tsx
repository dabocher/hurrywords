"use client";

export type WordInputProps = {
  letters:      string[];
  centerLetter: string;
  onDelete:     () => void;
  onClear:      () => void;
  onSubmit:     () => void;
  feedback:     { text: string; type: "error" | "success" | "magic" | "palabreja" | "hidden" } | null;
};

export const WordInput = ({
  letters,
  centerLetter,
  onDelete,
  onClear,
  onSubmit,
  feedback,
}: WordInputProps) => {
  const feedbackColors = {
    error:     "text-red-400",
    success:   "text-emerald-400",
    magic:     "text-amber-400",
    palabreja: "text-purple-400",
    hidden:    "text-stone-500",
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs">
      {/* Letras de la palabra actual */}
      <div className="min-h-8 bg-stone-800 rounded-md px-2 flex items-center gap-0.5">
        {letters.length === 0 ? (
          <span className="text-stone-600 text-lg tracking-widest">· · ·</span>
        ) : (
          letters.map((l, i) => (
            <span
              key={i}
              className={[
                "text-2xl font-bold uppercase tracking-wide",
                l === centerLetter ? "text-amber-400" : "text-stone-100",
              ].join(" ")}
            >
              {l}
            </span>
          ))
        )}
      </div>

      {/* Feedback */}
      <div className="h-5 text-sm font-medium">
        {feedback && (
          <span className={feedbackColors[feedback.type]}>{feedback.text}</span>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDelete}
          disabled={letters.length === 0}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-red-800 text-stone-300
                     hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="font-bold" > ←</span>Borrar
        </button>
        <button
          onClick={onSubmit}
          disabled={letters.length < 3}
          className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-400 text-stone-900
                     hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Enviar
        </button>
        <button
          onClick={onClear}
          disabled={letters.length === 0}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-stone-800 text-stone-300
                     hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
