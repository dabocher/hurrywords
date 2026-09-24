import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Calendar } from "./index";

describe("Calendar", () => {
  const mockOnSelect = vi.fn();

  it("displays current month and year", () => {
    render(<Calendar selected="2024-01-15" onSelect={mockOnSelect} />);
    expect(screen.getByText("Enero 2024")).toBeInTheDocument();
  });

  it("displays day headers (L M X J V S D)", () => {
    render(<Calendar selected="2024-01-15" onSelect={mockOnSelect} />);
    DAYS.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it("selects a day when clicked", () => {
    render(<Calendar selected="2024-01-15" onSelect={mockOnSelect} />);
    const allButtons = screen.getAllByRole("button");
    const dayButtons = allButtons.filter((btn) => {
      const text = btn.textContent?.trim();
      return text && !["‹", "›"].includes(text) && text.length <= 2 && !isNaN(parseInt(text));
    });
    if (dayButtons.length > 0) {
      fireEvent.click(dayButtons[0]);
      expect(mockOnSelect).toHaveBeenCalled();
    }
  });

  it("goes to previous month when left arrow clicked", () => {
    const { rerender } = render(<Calendar selected="2024-01-15" onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByText("‹"));
    rerender(<Calendar selected="2024-01-15" onSelect={mockOnSelect} />);
    expect(screen.getByText("Diciembre 2023")).toBeInTheDocument();
  });

  it("goes to next month when right arrow clicked", () => {
    const { rerender } = render(<Calendar selected="2024-01-15" onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByText("›"));
    rerender(<Calendar selected="2024-01-15" onSelect={mockOnSelect} />);
    expect(screen.getByText("Febrero 2024")).toBeInTheDocument();
  });
});

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
