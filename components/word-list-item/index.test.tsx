import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WordListItem } from "./index";

describe("WordListItem", () => {
  it("displays word with capitalization", () => {
    render(<WordListItem index={0} lemma="casa" senses={[{ number: 1, definition: "Edificio" }]} />);
    expect(screen.getByText("Casa")).toBeInTheDocument();
  });

  it("displays definition", () => {
    render(<WordListItem index={0} lemma="casa" senses={[{ number: 1, definition: "Edificio para vivir" }]} />);
    expect(screen.getByText("Edificio para vivir.")).toBeInTheDocument();
  });

  it("displays number", () => {
    render(<WordListItem index={2} lemma="casa" senses={[{ number: 1, definition: "Edificio" }]} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows grammar when present", () => {
    const { container } = render(
      <WordListItem index={0} lemma="casa" senses={[{ number: 1, grammar: "n.f.", definition: "Edificio" }]} />
    );
    const grammarEl = container.querySelector(".text-indigo-500");
    expect(grammarEl).toHaveTextContent("n.f.");
  });

  it("shows dash when no senses", () => {
    const { container } = render(
      <WordListItem index={0} lemma="casa" senses={[]} />
    );
    const dashElement = container.querySelector(".text-stone-500");
    expect(dashElement?.textContent).toContain("—");
  });
});
