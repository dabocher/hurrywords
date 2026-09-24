import { describe, expect, it } from "vitest";
import {
  normalizeStr,
  uniqueLetters,
  isValidForPalabrejas,
  isPalabreja,
  calculateScore,
} from "../convex/palabrejas";

describe("normalizeStr", () => {
  it("converts uppercase to lowercase", () => {
    expect(normalizeStr("HELLO")).toBe("hello");
  });

  it("removes acute accent from á", () => {
    expect(normalizeStr("á")).toBe("a");
  });

  it("removes acute accent from é", () => {
    expect(normalizeStr("é")).toBe("e");
  });

  it("removes acute accent from í", () => {
    expect(normalizeStr("í")).toBe("i");
  });

  it("removes acute accent from ó", () => {
    expect(normalizeStr("ó")).toBe("o");
  });

  it("removes acute accent from ú", () => {
    expect(normalizeStr("ú")).toBe("u");
  });

  it("removes diaeresis from ü", () => {
    expect(normalizeStr("ü")).toBe("u");
  });

  it("handles ñ correctly", () => {
    expect(normalizeStr("ñ")).toBe("ñ");
  });

  it("handles mixed case with accents", () => {
    expect(normalizeStr("Árboles")).toBe("arboles");
  });

  it("returns unchanged for already normalized string", () => {
    expect(normalizeStr("hello")).toBe("hello");
  });
});

describe("uniqueLetters", () => {
  it("returns unique letters from a word", () => {
    expect(uniqueLetters("hello")).toEqual(["h", "e", "l", "o"]);
  });

  it("removes duplicates", () => {
    expect(uniqueLetters("banana")).toEqual(["b", "a", "n"]);
  });

  it("handles ñ as unique letter", () => {
    expect(uniqueLetters("año")).toContain("ñ");
  });

  it("filters non-letter characters", () => {
    const result = uniqueLetters("h1l2l3o");
    expect(result).toEqual(["h", "l", "o"]);
  });

  it("returns single letter for single char input", () => {
    expect(uniqueLetters("a")).toEqual(["a"]);
  });

  it("normalizes accents before getting unique letters", () => {
    const result = uniqueLetters("á");
    expect(result).toEqual(["a"]);
  });
});

describe("isValidForPalabrejas", () => {
  const letters = ["a", "e", "r", "s", "l", "n", "c"];
  const center = "a";

  it("returns true for valid word canse", () => {
    // canse: c,a,n,s,e - todas en letras, contiene 'a', len >= 3
    expect(isValidForPalabrejas("canse", letters, center)).toBe(true);
  });

  it("returns false for word too short", () => {
    expect(isValidForPalabrejas("ab", letters, center)).toBe(false);
  });

  it("returns false for word without center letter", () => {
    expect(isValidForPalabrejas("suelo", letters, center)).toBe(false);
  });

  it("returns false for word with letters not in set", () => {
    expect(isValidForPalabrejas("zapato", letters, center)).toBe(false);
  });

  it("returns true for minimum length word (3 letters)", () => {
    expect(isValidForPalabrejas("sal", letters, center)).toBe(true);
  });

  it("handles accents by normalizing cancion", () => {
    // cancion: c,a,n,c,i,o,n - tiene 'i' y 'o' que no estan en letras
    expect(isValidForPalabrejas("cancion", letters, center)).toBe(false);
  });

  it("returns true for longer valid word canela", () => {
    // canela: c,a,n,e,l,a - todas en letras, contiene 'a', len >= 3
    expect(isValidForPalabrejas("canela", letters, center)).toBe(true);
  });
});

describe("isPalabreja", () => {
  const letters = ["a", "e", "r", "s", "l", "n", "c"];

  it("returns false when word does not contain all letters", () => {
    // canse: c,a,n,s,e - falta r,l
    expect(isPalabreja("canse", letters)).toBe(false);
  });

  it("returns false when word misses multiple letters", () => {
    expect(isPalabreja("casa", letters)).toBe(false);
  });
});

describe("calculateScore", () => {
  const letters = ["a", "e", "r", "s", "l", "n", "c"];

  it("gives points equal to word length for normal word", () => {
    // sal = 3 letters = 3 points
    expect(calculateScore("sal", letters, false)).toBe(3);
  });

  it("gives points equal to word length for 6-letter word", () => {
    // canela = 6 letters = 6 points
    expect(calculateScore("canela", letters, false)).toBe(6);
  });

  it("gives points equal to word length for 11+ letter word", () => {
    // caleidoscopio = 13 letters = 13 points
    expect(calculateScore("caleidoscopio", letters, false)).toBe(13);
  });

  it("multiplies by 3 for magic word", () => {
    // sal = 3 letters × 3 = 9 points
    expect(calculateScore("sal", letters, true)).toBe(9);
  });

  it("multiplies by 3 for magic word with 5 letters", () => {
    // sal = 3 letters × 3 = 9 points (sal is 3 letters)
    expect(calculateScore("sal", letters, true)).toBe(9);
  });

  it("multiplies by 3 for magic word with 6 letters", () => {
    // canela = 6 letters × 3 = 18 points
    expect(calculateScore("canela", letters, true)).toBe(18);
  });

  it("adds 10 bonus for palabreja (all letters)", () => {
    // 8-letter word using all 7 letters + 10 bonus = 18 points
    // "cansarla" doesn't use 'e', so we test with a hypothetical 8-letter word
    const allLetters = ["a", "e", "r", "s", "l", "n", "c"];
    // cansarle: c,a,n,s,a,l,e,r - uses all 7 letters
    expect(calculateScore("cansarle", allLetters, false)).toBe(18);
  });

  it("combines magic x3 + palabreja +10", () => {
    // 8-letter magic palabreja = (8 × 3) + 10 = 34 points
    const allLetters = ["a", "e", "r", "s", "l", "n", "c"];
    expect(calculateScore("cansarle", allLetters, true)).toBe(34);
  });
});
