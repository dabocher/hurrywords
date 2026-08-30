import { describe, expect, it } from "vitest";
import { formatCurrency } from "./format-currency";

describe("formatCurrency", () => {
  it("formats whole euros", () => {
    expect(formatCurrency(1000)).toMatch(/^10,00\s€$/);
  });

  it("formats cents correctly", () => {
    expect(formatCurrency(1099)).toMatch(/^10,99\s€$/);
  });

  it("supports a different currency and locale", () => {
    expect(formatCurrency(1000, { currency: "USD", locale: "en-US" })).toBe("$10.00");
  });

  it("throws on non-integer cents", () => {
    expect(() => formatCurrency(10.5)).toThrow(RangeError);
  });
});
