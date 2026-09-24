import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameOverOverlay } from "./game-over-overlay";

const MOCK_WORDS = [
  { normalizedLemma: "hola", displayLemma: "Hola", score: 1, isMagic: false, isPalabreja: false },
  { normalizedLemma: "mundo", displayLemma: "Mundo", score: 1, isMagic: true, isPalabreja: false },
];

describe("GameOverOverlay", () => {
  it("shows the score", () => {
    render(<GameOverOverlay score={42} words={MOCK_WORDS} onNextGame={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows word count", () => {
    render(<GameOverOverlay score={0} words={MOCK_WORDS} onNextGame={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("2 palabras encontradas")).toBeInTheDocument();
  });

  it("shows singular word count with 1 word", () => {
    render(<GameOverOverlay score={0} words={[MOCK_WORDS[0]]} onNextGame={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("1 palabra encontrada")).toBeInTheDocument();
  });

  it("shows the list of words", () => {
    render(<GameOverOverlay score={0} words={MOCK_WORDS} onNextGame={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("Mundo")).toBeInTheDocument();
  });

  it("has Next Game button", () => {
    render(<GameOverOverlay score={0} words={MOCK_WORDS} onNextGame={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Siguiente juego")).toBeInTheDocument();
  });

  it("has Close button", () => {
    render(<GameOverOverlay score={0} words={MOCK_WORDS} onNextGame={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Cerrar")).toBeInTheDocument();
  });

  it("calls onNextGame when Next Game button is clicked", () => {
    const onNextGame = vi.fn();
    const onClose = vi.fn();
    render(<GameOverOverlay score={0} words={MOCK_WORDS} onNextGame={onNextGame} onClose={onClose} />);
    fireEvent.click(screen.getByText("Siguiente juego"));
    expect(onNextGame).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close button is clicked", () => {
    const onNextGame = vi.fn();
    const onClose = vi.fn();
    render(<GameOverOverlay score={0} words={MOCK_WORDS} onNextGame={onNextGame} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
