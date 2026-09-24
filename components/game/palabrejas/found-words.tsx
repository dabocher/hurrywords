export type FoundWord = {
  normalizedLemma: string;
  displayLemma:    string;
  score:           number;
  isMagic:         boolean;
  isPalabreja:     boolean;
};

export type FoundWordsProps = {
  words: FoundWord[];
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const FoundWords = ({ words }: FoundWordsProps) => {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-600">
        <p className="text-sm">Aún no has encontrado ninguna palabra.</p>
        <p className="text-xs mt-1 text-stone-700">Haz clic en las letras para empezar.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-stone-800">
      {[...words].reverse().map((word) => (
        <li key={word.normalizedLemma} className="flex items-center justify-between py-2.5 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-stone-200 capitalize">
              {capitalize(word.displayLemma)}
            </span>
            {word.isPalabreja && (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-medium">
                PALABREJA
              </span>
            )}
            {word.isMagic && (
              <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-medium">
                ✦ MÁGICA
              </span>
            )}
          </div>
          <span className="shrink-0 text-sm font-bold text-amber-400">+{word.score}</span>
        </li>
      ))}
    </ul>
  );
};
