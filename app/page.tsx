import { PalabrasMagicasDelDia } from "@/components/PalabrasMagicasDelDia";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-16">
      <h1 className="text-2xl font-semibold tracking-tight text-red-300">
        Palabras del día
      </h1>
      <PalabrasMagicasDelDia />
    </main>
  );
}
