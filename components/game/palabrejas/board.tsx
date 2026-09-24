"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const MIN_BOARD_SIZE = 300;
const HEX_HEIGHT_RATIO = Math.sqrt(3);

const useHexBoardSize = (containerWidth: number) => {
  const updateSize = useCallback(() => {
    const availableHeight = Math.min(
      typeof window !== "undefined" ? window.innerHeight * 0.6 : 600,
      650,
    );
    const width = containerWidth > 0 ? containerWidth - 40 : MIN_BOARD_SIZE;
    return Math.max(Math.min(width, availableHeight), MIN_BOARD_SIZE);
  }, [containerWidth]);

  const [boardSize, setBoardSize] = useState(MIN_BOARD_SIZE);

  useEffect(() => {
    const newSize = updateSize();
    setBoardSize(newSize);

    const handleResize = () => {
      setBoardSize(updateSize());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateSize]);

  const radius = boardSize / 6;
  return { boardSize, radius };
};

const OUTER_POSITIONS = [
  { x: 0, y: -1.80 }, // top
  { x: 1.55, y: -0.9 }, // right top
  { x: 1.55, y: 0.9 }, // right bottom
  { x: 0, y: 1.8}, // bottom
  { x: -1.55, y: 0.9 }, // left bottom
  { x: -1.55, y: -0.9 }, // left top
];

type HexagonProps = {
  letter:      string;
  isCenter:    boolean;
  onClick:     () => void;
  disabled?:   boolean;
  style:       React.CSSProperties;
  isVisible:   boolean;
};

const Hexagon = ({ letter, isCenter, onClick, disabled, style, isVisible }: HexagonProps) => (
  <div
    style={{
      ...style,
      transition: "opacity 0.3s ease-in-out",
      opacity: isCenter ? 1 : 0.3,
      clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
      background: isCenter ? undefined : "#f59e0b",
      padding: isCenter ? 0 : 6,
      boxSizing: "border-box",
    }}
  >
    <button
      onClick={onClick}
      disabled={disabled}
        className={[
          "w-full h-full flex items-center justify-center",
          "text-4xl sm:text-5xl font-bold uppercase tracking-wider select-none",
          "transition-all duration-100 active:scale-90",
          "clip-path-hexagon",
          disabled ? "opacity-30 cursor-not-allowed" : "",
          isCenter
            ? "bg-amber-400 text-stone-900 hover:bg-amber-300"
            : "bg-stone-800 text-stone-100 hover:bg-stone-700",
        ].join(" ")}
      style={{
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        opacity: isCenter || isVisible ? 1 : 0,
        pointerEvents: isCenter || isVisible ? "auto" : "none",
      }}
    >
      {letter.toUpperCase()}
    </button>
  </div>
);

export type BoardProps = {
  letters:               string[];
  centerLetter:          string;
  onLetterClick:         (letter: string) => void;
  disabled?:             boolean;
  visibleExteriorIndices?: number[];
};

export const Board = ({
  letters,
  centerLetter,
  onLetterClick,
  disabled,
  visibleExteriorIndices = [],
}: BoardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { boardSize, radius } = useHexBoardSize(containerWidth);
  const outerLetters = letters.filter((l) => l !== centerLetter);

  const centerStyle: React.CSSProperties = {
    position: "absolute",
    left: boardSize / 2 - radius,
    top: boardSize / 2 - radius,
    width: radius * 2,
    height: radius * HEX_HEIGHT_RATIO,
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div ref={containerRef} className="w-full">
        <div
          className="relative mx-auto"
          style={{ width: boardSize, height: boardSize, maxWidth: "100%" }}
        >
          <Hexagon
            letter={centerLetter}
            isCenter
            onClick={() => onLetterClick(centerLetter)}
            disabled={disabled}
            style={centerStyle}
            isVisible
          />

          {OUTER_POSITIONS.map((pos, i) => {
            const letter = outerLetters[i] ?? "";
            const outerStyle: React.CSSProperties = {
              position: "absolute",
              left: boardSize / 2 + pos.x * radius - radius,
              top: boardSize / 2 + pos.y * radius - radius,
              width: radius * 2,
              height: radius * HEX_HEIGHT_RATIO,
            };
            return (
              <Hexagon
                key={letter + i}
                letter={letter}
                isCenter={false}
                onClick={() => onLetterClick(letter)}
                disabled={disabled}
                style={outerStyle}
                isVisible={visibleExteriorIndices.includes(i)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
