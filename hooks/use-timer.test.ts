import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "./use-timer";

const TEST_DATE = "2025-09-07";
const DURATION = 60;

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle with full duration", () => {
    const { result } = renderHook(() => useTimer(DURATION, TEST_DATE));
    expect(result.current.status).toBe("idle");
    expect(result.current.remaining).toBe(DURATION);
    expect(result.current.isExpired).toBe(false);
  });

  it("startTimer changes status to running", () => {
    const { result } = renderHook(() => useTimer(DURATION, TEST_DATE));
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.status).toBe("running");
    expect(result.current.isExpired).toBe(false);
  });

  it("countdown decrements over time", () => {
    const { result } = renderHook(() => useTimer(DURATION, TEST_DATE));
    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.remaining).toBeLessThanOrEqual(55);
    expect(result.current.remaining).toBeGreaterThan(50);
  });

  it("reaches expired status when time runs out", () => {
    const { result } = renderHook(() => useTimer(DURATION, TEST_DATE));
    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(DURATION * 1_000 + 100);
    });
    expect(result.current.status).toBe("expired");
    expect(result.current.remaining).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it("loads running state from localStorage on mount", () => {
    vi.setSystemTime(Date.now() - 20_000);
    const startedAt = Date.now() - 20_000;
    localStorage.setItem(
      `hurrywords_timer_${TEST_DATE}`,
      JSON.stringify({ startedAt, timeCap: DURATION })
    );

    const { result } = renderHook(() => useTimer(DURATION, TEST_DATE));
    expect(result.current.status).toBe("running");
    expect(result.current.remaining).toBeLessThanOrEqual(40);
    expect(result.current.remaining).toBeGreaterThan(35);

    vi.setSystemTime(Date.now() + 20_000);
  });

  it("loads expired state from localStorage on mount", () => {
    const startedAt = Date.now() - 70_000;
    localStorage.setItem(
      `hurrywords_timer_${TEST_DATE}`,
      JSON.stringify({ startedAt, timeCap: DURATION })
    );

    const { result } = renderHook(() => useTimer(DURATION, TEST_DATE));
    expect(result.current.status).toBe("expired");
    expect(result.current.remaining).toBe(0);
  });
});
