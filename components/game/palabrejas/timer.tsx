import type { TimerStatus } from "@/hooks/use-timer";

export type TimerProps = {
  remaining: number;
  status: TimerStatus;
  duration?: number;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const Timer = ({ remaining, status, duration = 60 }: TimerProps) => {
  const colorClass =
    status === "idle"
      ? "text-stone-500"
      : status === "expired"
        ? "text-red-500"
        : remaining > 30
          ? "text-emerald-400"
          : remaining > 10
            ? "text-amber-400"
            : "text-red-400";

  return (
    <div className="flex justify-center">
      <span className={`text-3xl font-bold font-mono tracking-wider ${colorClass}`}>
        {status === "idle" ? formatTime(duration) : formatTime(remaining)}
      </span>
    </div>
  );
};
