const formatDisplayDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

interface DaySummaryCardProps {
  date: string;
  wordCount: number | null; // null = cargando
}

export const DaySummaryCard = ({ date, wordCount }: DaySummaryCardProps) => (
  <div className="mt-4 rounded-xl bg-white border border-stone-200 p-4 shadow-sm">
    <p className="text-xs text-stone-400 mb-0.5">Día seleccionado</p>
    <p className="text-sm font-medium text-stone-800 capitalize">
      {formatDisplayDate(date)}
    </p>
    {wordCount !== null && (
      <p className="text-xs text-stone-400 mt-2">
        {wordCount === 0 ? "Sin pool generado" : `${wordCount} palabras mágicas`}
      </p>
    )}
  </div>
);
