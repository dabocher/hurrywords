import { describe, expect, it, beforeEach, vi } from "vitest";
import { saveTimerState, loadTimerState, clearTimerState } from "./timer-storage";

const TEST_DATE = "2025-09-07";
const TIME_CAP = 60;

describe("timer-storage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem(key: string) {
        return store[key] ?? null;
      },
      setItem(key: string, value: string) {
        store[key] = value;
      },
      removeItem(key: string) {
        delete store[key];
      },
      clear() {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    } as Storage);
  });

  describe("saveTimerState & loadTimerState", () => {
    it("loads with no data and returns full duration", () => {
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.startedAt).toBeNull();
      expect(result.remaining).toBe(TIME_CAP);
    });

    it("saves and loads timer state correctly", () => {
      const now = Date.now();
      saveTimerState(TEST_DATE, now, TIME_CAP);
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.startedAt).toBe(now);
      expect(result.remaining).toBeCloseTo(TIME_CAP, 0);
    });

    it("calculates remaining time after 30 seconds", () => {
      const past = Date.now() - 30_000;
      saveTimerState(TEST_DATE, past, TIME_CAP);
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.remaining).toBeLessThanOrEqual(30);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("caps remaining at 0 when time has expired", () => {
      const past = Date.now() - 70_000;
      saveTimerState(TEST_DATE, past, TIME_CAP);
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.remaining).toBe(0);
    });

    it("handles null startedAt correctly", () => {
      saveTimerState(TEST_DATE, null, TIME_CAP);
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.startedAt).toBeNull();
      expect(result.remaining).toBe(TIME_CAP);
    });

    it("returns full duration when startedAt is in the future", () => {
      const future = Date.now() + 10_000;
      saveTimerState(TEST_DATE, future, TIME_CAP);
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.remaining).toBeGreaterThanOrEqual(TIME_CAP);
    });

    it("uses provided timeCap as fallback when stored timeCap is missing", () => {
      const now = Date.now();
      localStorage.setItem(`hurrywords_timer_${TEST_DATE}`, JSON.stringify({ startedAt: now }));
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.startedAt).toBe(now);
      expect(result.remaining).toBeCloseTo(TIME_CAP, 0);
    });

    it("handles corrupt JSON gracefully", () => {
      localStorage.setItem(`hurrywords_timer_${TEST_DATE}`, "not valid json");
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.startedAt).toBeNull();
      expect(result.remaining).toBe(TIME_CAP);
    });

    it("handles missing startedAt property gracefully", () => {
      localStorage.setItem(`hurrywords_timer_${TEST_DATE}`, JSON.stringify({ somethingElse: 123 }));
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.startedAt).toBeNull();
      expect(result.remaining).toBe(TIME_CAP);
    });
  });

  describe("clearTimerState", () => {
    it("removes the timer state from localStorage", () => {
      saveTimerState(TEST_DATE, Date.now(), TIME_CAP);
      clearTimerState(TEST_DATE);
      const result = loadTimerState(TEST_DATE, TIME_CAP);
      expect(result.startedAt).toBeNull();
      expect(result.remaining).toBe(TIME_CAP);
    });
  });
});
