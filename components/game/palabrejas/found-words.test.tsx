import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FoundWords } from "./found-words";

const mockWords = [
  { normalizedLemma: "sal", displayLemma: "Sal", score: 1, isMagic: false, isPalabreja: false },
  { normalizedLemma: "canse", displayLemma: "Canse", score: 2, isMagic: true, isPalabreja: false },
  { normalizedLemma: "canela", displayLemma: "Canela", score: 10, isMagic: true, isPalabreja: true },
];

describe("FoundWords", () => {
  it("shows empty state when no words", () => {
    render(<FoundWords words={[]} />);
    expect(screen.getByText("Aún no has encontrado ninguna palabra.")).toBeInTheDocument();
  });

  it("displays found words", () => {
    render(<FoundWords words={mockWords} />);
    expect(screen.getByText("Sal")).toBeInTheDocument();
    expect(screen.getByText("Canse")).toBeInTheDocument();
    expect(screen.getByText("Canela")).toBeInTheDocument();
  });

  it("displays score for each word", () => {
    render(<FoundWords words={mockWords} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("+10")).toBeInTheDocument();
  });

  it("shows PALABREJA badge when isPalabreja is true", () => {
    render(<FoundWords words={mockWords} />);
    expect(screen.getByText("PALABREJA")).toBeInTheDocument();
  });

  it("shows MÁGICA badge when isMagic is true", () => {
    render(<FoundWords words={mockWords} />);
    const magicBadges = screen.getAllByText(/MÁGICA/);
    expect(magicBadges.length).toBe(2);
  });

  it("shows both badges when isPalabreja and isMagic are true", () => {
    render(<FoundWords words={[mockWords[2]]} />);
    expect(screen.getByText("PALABREJA")).toBeInTheDocument();
    expect(screen.getByText("✦ MÁGICA")).toBeInTheDocument();
  });

  it("reverses word order (last found first)", () => {
    const { container } = render(<FoundWords words={mockWords} />);
    const items = container.querySelectorAll("li");
    // Last word should be first in the list
    expect(items[0].textContent).toContain("Canela");
    expect(items[items.length - 1].textContent).toContain("Sal");
  });

  it("capitalizes word display", () => {
    const lowerWords = [{ normalizedLemma: "sal", displayLemma: "sal", score: 1, isMagic: false, isPalabreja: false }];
    render(<FoundWords words={lowerWords} />);
    expect(screen.getByText("Sal")).toBeInTheDocument();
  });
});
