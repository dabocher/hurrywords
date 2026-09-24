export type FoundWord = {
  normalizedLemma: string;
  displayLemma:    string;
  score:           number;
  isMagic:         boolean;
  isPalabreja:     boolean;
};

const STORAGE_KEY = (date: string) => `palabrejas_${date}`;

const todayStr = () => new Date().toISOString().split("T")[0];

export const getTodayStr = todayStr;

export const loadFoundWords = (date: string): FoundWord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(date));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveFoundWords = (date: string, words: FoundWord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY(date), JSON.stringify(words));
  } catch {}
};
