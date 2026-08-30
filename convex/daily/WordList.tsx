import { WordListItem } from "./WordListItem";

interface Word {
  _id: string;
  lemma: string;
  senses: { number: number; grammar?: string; definition: string }[];
}

interface WordListProps {
  words: Word[];
}

export const WordList = ({ words }: WordListProps) => {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">No hay palabras para este día.</p>
        <p className="text-xs mt-1 text-stone-300">
          El pool se genera automáticamente a medianoche.
        </p>
      </div>
    );
  }

  return (
    <ul>
      {words.map((word, index) => (
        <WordListItem
          key={word._id}
          index={index}
          lemma={word.lemma}
          senses={word.senses}
        />
      ))}
    </ul>
  );
};
