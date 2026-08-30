interface Sense {
  number: number;
  grammar?: string;
  definition: string;
}

interface WordListItemProps {
  index: number;
  lemma: string;
  senses: Sense[];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const WordListItem = ({ index, lemma, senses }: WordListItemProps) => (
  <li className="flex gap-4 py-1.5 border-b border-stone-100 last:border-0">
    <span className="shrink-0 w-7 text-right text-xs font-mono text-stone-300 mt-0.5">
      {index + 1}
    </span>
    <div className="min-w-0">
      <strong className="text-stone-900 mr-2">{capitalize(lemma)}</strong>
      {senses[0]?.grammar && (
        <span className="text-xs text-indigo-500 italic mr-2">
          {senses[0].grammar}
        </span>
      )}
      <span className="text-stone-500 text-sm">
        {senses[0]?.definition ?? "—"}.
      </span>
    </div>
  </li>
);
