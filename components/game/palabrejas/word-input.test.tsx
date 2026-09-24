import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WordInput } from "./word-input";

describe("WordInput", () => {
  const mockOnDelete = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnSubmit = vi.fn();

  it("shows placeholder when no letters", () => {
    render(
      <WordInput
        letters={[]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    expect(screen.getByText("· · ·")).toBeInTheDocument();
  });

  it("displays typed letters", () => {
    const { container } = render(
      <WordInput
        letters={["c", "a", "n"]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    const letterSpans = container.querySelectorAll("span.text-2xl");
    expect(letterSpans).toHaveLength(3);
  });

  it("highlights center letter in amber", () => {
    const { container } = render(
      <WordInput
        letters={["c", "a", "n"]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    const centerLetterEl = container.querySelector(".text-amber-400");
    expect(centerLetterEl).toBeInTheDocument();
  });

  it("delete button is disabled when no letters", () => {
    render(
      <WordInput
        letters={[]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    const deleteButton = screen.getByRole("button", { name: /borrar/i });
    expect(deleteButton).toBeDisabled();
  });

  it("submit button is disabled when less than 3 letters", () => {
    render(
      <WordInput
        letters={["a", "b"]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    const submitButton = screen.getByRole("button", { name: /enviar/i });
    expect(submitButton).toBeDisabled();
  });

  it("submit button is enabled when 3 or more letters", () => {
    render(
      <WordInput
        letters={["c", "a", "n"]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    const submitButton = screen.getByRole("button", { name: /enviar/i });
    expect(submitButton).toBeEnabled();
  });

  it("clear button is disabled when no letters", () => {
    render(
      <WordInput
        letters={[]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    const clearButton = screen.getByRole("button", { name: /✕/i });
    expect(clearButton).toBeDisabled();
  });

  it("calls onDelete when delete button clicked", () => {
    render(
      <WordInput
        letters={["c", "a", "n"]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /borrar/i }));
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onClear when clear button clicked", () => {
    render(
      <WordInput
        letters={["c", "a", "n"]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /✕/i }));
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when submit button clicked", () => {
    render(
      <WordInput
        letters={["c", "a", "n"]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows feedback text when provided", () => {
    render(
      <WordInput
        letters={[]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={{ text: "Error message", type: "error" }}
      />
    );
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("shows success feedback in emerald color", () => {
    render(
      <WordInput
        letters={[]}
        centerLetter="a"
        onDelete={mockOnDelete}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
        feedback={{ text: "+1 pts", type: "success" }}
      />
    );
    const feedback = screen.getByText("+1 pts");
    expect(feedback).toHaveClass("text-emerald-400");
  });
});
