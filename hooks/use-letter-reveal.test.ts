import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLetterReveal } from "./use-letter-reveal";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("useLetterReveal", () => {
  it("estado inicial: phase=hidden, visible=[], gameStarted=false", () => {
    const { result } = renderHook(() => useLetterReveal());
    expect(result.current.phase).toBe("hidden");
    expect(result.current.visibleExteriorIndices).toEqual([]);
    expect(result.current.countdownSeconds).toBe(0);
    expect(result.current.gameStarted).toBe(false);
  });

  it("onStart() cambia a countdown con countdownSeconds=5", () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    expect(result.current.phase).toBe("countdown");
    expect(result.current.countdownSeconds).toBe(5);
    expect(result.current.gameStarted).toBe(false);
    expect(result.current.visibleExteriorIndices).toEqual([]);
  });

  it("countdown 4s: visibleExteriorIndices.length === 1", async () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    await wait(1050);
    expect(result.current.countdownSeconds).toBe(4);
    expect(result.current.visibleExteriorIndices.length).toBe(1);
  }, 3000);

  it("countdown 2s: visibleExteriorIndices.length === 2", async () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    await wait(3050);
    expect(result.current.countdownSeconds).toBe(2);
    expect(result.current.visibleExteriorIndices.length).toBe(2);
  }, 5000);

  it("countdown 0s: gameStarted=true, visible.length=3, phase=revealing", async () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    await wait(5050);
    expect(result.current.countdownSeconds).toBe(0);
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.visibleExteriorIndices.length).toBe(3);
    expect(result.current.phase).toBe("revealing");
  }, 10000);

  it("revelado progresivo: cada 5s aumenta en 1 hasta 6", async () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    await wait(20050);
    expect(result.current.visibleExteriorIndices.length).toBe(6);
    expect(result.current.phase).toBe("all-visible");
  }, 30000);

  it("triggerDisappear reduce letras visibles", async () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    await wait(20050);
    expect(result.current.visibleExteriorIndices.length).toBe(6);

    act(() => {
      result.current.triggerDisappear(24);
    });

    expect(result.current.visibleExteriorIndices.length).toBeLessThan(6);
    expect(result.current.phase).toBe("disappearing");
  }, 30000);

  it("no hay índices duplicados en visibleExteriorIndices", async () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    await wait(10050);
    const indices = result.current.visibleExteriorIndices;
    const unique = new Set(indices);
    expect(unique.size).toBe(indices.length);
  }, 15000);

  it("bidireccional: letras escondidas reaparecen si toca revelar", async () => {
    const { result } = renderHook(() => useLetterReveal());
    act(() => {
      result.current.onStart();
    });
    await wait(20050);
    expect(result.current.visibleExteriorIndices.length).toBe(6);

    act(() => {
      result.current.triggerDisappear(25);
    });

    const afterDisappear = result.current.visibleExteriorIndices.length;
    expect(afterDisappear).toBeLessThan(6);

    await wait(6000);
    expect(result.current.visibleExteriorIndices.length).toBeGreaterThanOrEqual(afterDisappear);
  }, 30000);

  it("no incluye índices duplicados al hacer onStart múltiples veces", () => {
    const { result } = renderHook(() => useLetterReveal());

    act(() => {
      result.current.onStart();
    });

    act(() => {
      result.current.onStart();
    });

    const indices = result.current.visibleExteriorIndices;
    const unique = new Set(indices);
    expect(unique.size).toBe(indices.length);
  });
});
