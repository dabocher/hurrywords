import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBoard } from "./score-board";

describe("ScoreBoard", () => {
  it("displays totalScore", () => {
    render(<ScoreBoard totalScore={42} foundCount={5} totalWords={20} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("displays foundCount", () => {
    render(<ScoreBoard totalScore={10} foundCount={3} totalWords={15} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("displays totalWords", () => {
    render(<ScoreBoard totalScore={5} foundCount={1} totalWords={10} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows labels for each stat", () => {
    render(<ScoreBoard totalScore={0} foundCount={0} totalWords={0} />);
    expect(screen.getByText("puntos")).toBeInTheDocument();
    expect(screen.getByText("encontradas")).toBeInTheDocument();
    expect(screen.getByText("posibles")).toBeInTheDocument();
  });

  it("renders with default-like values", () => {
    const { container } = render(
      <ScoreBoard totalScore={0} foundCount={0} totalWords={26} />
    );
    // Score is first element
    const scoreText = container.querySelectorAll("p")[0];
    expect(scoreText.textContent).toBe("0");
    expect(screen.getByText("26")).toBeInTheDocument();
  });
});
