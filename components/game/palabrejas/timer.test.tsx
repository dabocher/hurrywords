import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timer } from "./timer";

describe("Timer", () => {
  it("shows 01:00 when idle", () => {
    const { container } = render(<Timer remaining={60} status="idle" />);
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("shows correct MM:SS format", () => {
    render(<Timer remaining={45} status="running" />);
    expect(screen.getByText("00:45")).toBeInTheDocument();
  });

  it("shows 00:05 when remaining is 5", () => {
    render(<Timer remaining={5} status="running" />);
    expect(screen.getByText("00:05")).toBeInTheDocument();
  });

  it("has green color when remaining > 30", () => {
    const { container } = render(<Timer remaining={45} status="running" />);
    const el = container.querySelector("span");
    expect(el?.className).toContain("text-emerald-400");
  });

  it("has amber color when remaining > 10 and <= 30", () => {
    const { container } = render(<Timer remaining={25} status="running" />);
    const el = container.querySelector("span");
    expect(el?.className).toContain("text-amber-400");
  });

  it("has red color when remaining <= 10", () => {
    const { container } = render(<Timer remaining={10} status="running" />);
    const el = container.querySelector("span");
    expect(el?.className).toContain("text-red-400");
  });

  it("has red-500 when expired", () => {
    const { container } = render(<Timer remaining={0} status="expired" />);
    const el = container.querySelector("span");
    expect(el?.className).toContain("text-red-500");
  });
});
