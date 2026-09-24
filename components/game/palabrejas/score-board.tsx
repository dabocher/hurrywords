export type ScoreBoardProps = {
  totalScore: number;
  foundCount: number;
  totalWords: number;
};

export const ScoreBoard = ({ totalScore, foundCount, totalWords }: ScoreBoardProps) => (
  <div className="flex items-center gap-6 px-6 py-3 bg-stone-800/60 rounded-2xl border border-stone-700">
    <div className="text-center">
      <p className="text-3xl font-bold text-amber-400">{totalScore}</p>
      <p className="text-xs text-stone-500 mt-0.5">puntos</p>
    </div>
    <div className="w-px h-8 bg-stone-700" />
    <div className="text-center">
      <p className="text-3xl font-bold text-stone-100">{foundCount}</p>
      <p className="text-xs text-stone-500 mt-0.5">encontradas</p>
    </div>
    <div className="w-px h-8 bg-stone-700" />
    <div className="text-center">
      <p className="text-3xl font-bold text-stone-500">{totalWords}</p>
      <p className="text-xs text-stone-500 mt-0.5">posibles</p>
    </div>
  </div>
);
