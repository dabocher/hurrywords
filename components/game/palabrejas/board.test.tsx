import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Board } from "./board";

describe("Board", () => {
  const mockOnLetterClick = vi.fn();
  const baseLetters = ["a", "e", "r", "s", "l", "n", "c"];
  const baseProps = {
    letters: baseLetters,
    centerLetter: "a",
    onLetterClick: mockOnLetterClick,
    visibleExteriorIndices: [0, 1, 2, 3, 4, 5],
  };

  it("renders center letter", () => {
    render(<Board {...baseProps} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders 6 outer letters", () => {
    render(<Board {...baseProps} />);
    const outerLetters = ["E", "R", "S", "L", "N", "C"];
    outerLetters.forEach((letter) => {
      expect(screen.getByText(letter)).toBeInTheDocument();
    });
  });

  it("calls onLetterClick with correct letter when center clicked", () => {
    render(<Board {...baseProps} />);
    const centerButton = screen.getByText("A");
    fireEvent.click(centerButton);
    expect(mockOnLetterClick).toHaveBeenCalledWith("a");
  });

  it("calls onLetterClick with correct letter when outer letter clicked", () => {
    render(<Board {...baseProps} />);
    const eButton = screen.getByText("E");
    fireEvent.click(eButton);
    expect(mockOnLetterClick).toHaveBeenCalledWith("e");
  });

  it("highlights center letter with amber color", () => {
    const { container } = render(<Board {...baseProps} />);
    const centerButton = screen.getByText("A");
    expect(centerButton).toHaveClass("bg-amber-400");
  });

  it("renders outer letters with stone color", () => {
    const { container } = render(<Board {...baseProps} />);
    const outerButton = screen.getByText("E");
    expect(outerButton).toHaveClass("bg-stone-800");
  });

  it("disables all buttons when disabled is true", () => {
    render(<Board {...baseProps} disabled />);
    const centerButton = screen.getByText("A");
    expect(centerButton).toBeDisabled();
    const outerButton = screen.getByText("E");
    expect(outerButton).toBeDisabled();
  });

  it("does not call onLetterClick when disabled (button has disabled attribute)", () => {
    render(<Board {...baseProps} disabled />);
    const centerButton = screen.getByText("A");
    expect(centerButton).toHaveAttribute("disabled");
    const outerButton = screen.getByText("E");
    expect(outerButton).toHaveAttribute("disabled");
  });

  it("renders buttons with hexagonal clip-path", () => {
    const { container } = render(<Board {...baseProps} />);
    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button).toHaveStyle({
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
      });
    });
  });

  it("renders board with dynamic size based on container", () => {
    const { container } = render(<Board {...baseProps} />);
    const board = container.querySelector("[style*='position: absolute']");
    expect(board).toBeTruthy();
  });

  it("isVisible={false} tiene borde ambar visible y contenido oculto", () => {
    const { container } = render(
      <Board
        letters={baseLetters}
        centerLetter="a"
        onLetterClick={mockOnLetterClick}
        visibleExteriorIndices={[0, 1, 2]}
      />
    );
    const hexWrappers = container.querySelectorAll("[style*='position: absolute']");
    const outerWrappers = Array.from(hexWrappers).slice(1);
    const hiddenWrapper = outerWrappers[3];
    const style = hiddenWrapper.getAttribute("style") ?? "";
    expect(style).toContain("rgb(245, 158, 11)");
    expect(style).toContain("clip-path");
    const button = hiddenWrapper.querySelector("button");
    expect(button).toHaveStyle({ opacity: 0 });
    expect(button).toHaveStyle({ pointerEvents: "none" });
  });

  it("isVisible={true} tiene opacity: 1 y pointer-events: auto", () => {
    const { container } = render(
      <Board
        letters={baseLetters}
        centerLetter="a"
        onLetterClick={mockOnLetterClick}
        visibleExteriorIndices={[0, 1, 2]}
      />
    );
    const hexWrappers = container.querySelectorAll("[style*='position: absolute']");
    const outerWrappers = Array.from(hexWrappers).slice(1);
    const visibleWrapper = outerWrappers[0];
    const style = visibleWrapper.getAttribute("style") ?? "";
    expect(style).toContain("rgb(245, 158, 11)");
    const button = visibleWrapper.querySelector("button");
    expect(button).toHaveStyle({ opacity: 1 });
    expect(button).toHaveStyle({ pointerEvents: "auto" });
  });

  it("Board renderiza letras correctas según visibleExteriorIndices", () => {
    const { container } = render(
      <Board
        letters={baseLetters}
        centerLetter="a"
        onLetterClick={mockOnLetterClick}
        visibleExteriorIndices={[0, 2, 4]}
      />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(7);
    const hexWrappers = container.querySelectorAll("[style*='position: absolute']");
    const outerWrappers = Array.from(hexWrappers).slice(1);
    const visibleIndices = [0, 2, 4];
    for (let i = 0; i < 6; i++) {
      const button = outerWrappers[i].querySelector("button");
      if (visibleIndices.includes(i)) {
        expect(button).toHaveStyle({ opacity: 1 });
      } else {
        expect(button).toHaveStyle({ opacity: 0 });
      }
    }
  });

  it("central siempre visible independientemente de visibleExteriorIndices", () => {
    const { container } = render(
      <Board
        letters={baseLetters}
        centerLetter="a"
        onLetterClick={mockOnLetterClick}
        visibleExteriorIndices={[]}
      />
    );
    const hexWrappers = container.querySelectorAll("[style*='position: absolute']");
    const centerWrapper = hexWrappers[0];
    expect(centerWrapper).toHaveStyle({ opacity: 1 });
    const centerButton = centerWrapper.querySelector("button");
    expect(centerButton).toHaveStyle({ opacity: 1 });
  });

  it("los hexagonos exteriores tienen contorno ambar", () => {
    const { container } = render(<Board {...baseProps} />);
    const hexWrappers = container.querySelectorAll("[style*='position: absolute']");
    const centerWrapper = hexWrappers[0];
    const outerWrappers = Array.from(hexWrappers).slice(1);
    const centerStyle = centerWrapper.getAttribute("style") ?? "";
    expect(centerStyle).not.toContain("rgb(245, 158, 11)");
    outerWrappers.forEach((wrapper) => {
      const wrapperStyle = wrapper.getAttribute("style") ?? "";
      expect(wrapperStyle).toContain("rgb(245, 158, 11)");
      expect(wrapperStyle).toContain("clip-path");
    });
  });
});
