import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DaySummaryCard } from "./index";

describe("DaySummaryCard", () => {
  it("displays formatted date", () => {
    render(<DaySummaryCard date="2024-01-15" wordCount={36} />);
    const dateText = screen.getByText(/2024/i);
    expect(dateText).toBeInTheDocument();
  });

  it("displays word count when provided", () => {
    render(<DaySummaryCard date="2024-01-15" wordCount={36} />);
    expect(screen.getByText("36 palabras mágicas")).toBeInTheDocument();
  });

  it("shows 'Sin pool generado' when wordCount is 0", () => {
    render(<DaySummaryCard date="2024-01-15" wordCount={0} />);
    expect(screen.getByText("Sin pool generado")).toBeInTheDocument();
  });

  it("does not show word count when null", () => {
    const { container } = render(<DaySummaryCard date="2024-01-15" wordCount={null} />);
    expect(container.querySelector("p.text-xs.text-stone-400.mt-2")).not.toBeInTheDocument();
  });
});
