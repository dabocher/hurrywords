"use client";

import { useState } from "react";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const todayLocal = () => new Date().toISOString().split("T")[0];

const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

interface CalendarProps {
  selected: string;
  onSelect: (date: string) => void;
}

export const Calendar = ({ selected, onSelect }: CalendarProps) => {
  const today = todayLocal();
  const [y, m] = selected.split("-").map(Number);
  const [viewYear, setViewYear] = useState(y);
  const [viewMonth, setViewMonth] = useState(m - 1);

  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((v) => v - 1);
    } else setViewMonth((v) => v - 1);
  };

  const next = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((v) => v + 1);
    } else setViewMonth((v) => v + 1);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prev}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-500"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-stone-800 tracking-wide uppercase">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={next}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-500"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-stone-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isSelected = dateStr === selected;
          const isToday = dateStr === today;
          const isFuture = dateStr > today;

          return (
            <button
              key={dateStr}
              disabled={isFuture}
              onClick={() => onSelect(dateStr)}
              className={[
                "relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                isFuture
                  ? "text-stone-300 cursor-not-allowed"
                  : "hover:bg-stone-100 cursor-pointer",
                isSelected
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
                  : "text-stone-700",
                !isSelected && isToday ? "font-bold text-indigo-600" : "",
              ].join(" ")}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
