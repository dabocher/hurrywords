import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WordList } from "./index";

const mockWords = [
  { _id: "1", lemma: "casa", senses: [{ number: 1, definition: "Edificio" }] },
  { _id: "2", lemma: "perro", senses: [{ number: 1, definition: "Animal" }] },
];

describe("WordList", () => {
  it("shows empty state when no words", () => {
    render(<WordList words={[]} />);
    expect(screen.getByText("No hay palabras para este día.")).toBeInTheDocument();
  });

  it("displays word list", () => {
    render(<WordList words={mockWords} />);
    expect(screen.getByText("Casa")).toBeInTheDocument();
    expect(screen.getByText("Perro")).toBeInTheDocument();
  });

  it("shows definitions", () => {
    render(<WordList words={mockWords} />);
    expect(screen.getByText("Edificio.")).toBeInTheDocument();
    expect(screen.getByText("Animal.")).toBeInTheDocument();
  });

  it("renders numbered list items", () => {
    const { container } = render(<WordList words={mockWords} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);
  });
});
