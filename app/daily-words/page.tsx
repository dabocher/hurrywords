import { DailyWords } from "@/components/game/daily-words";

const DailyWordsPage = () => (
    <main className="flex min-h-screen flex-col items-center gap-8 p-16">
        <h1 className="text-2xl font-semibold tracking-tight text-red-300">
            Palabras del día
        </h1>
        <p className="text-lg text-gray-400">
            Las 36 palabras mágicas asignadas a la partida de hoy.
        </p>
        <DailyWords />
    </main>
);

export default DailyWordsPage;
