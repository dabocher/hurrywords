import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Raleway } from "next/font/google";
import NavGames from "@/components/game/nav-games";

export const metadata: Metadata = {
  title: "ejemplo-harness-nextjs",
  description:
    "Proyecto de ejemplo: Harness Engineering aplicado a Next.js + TypeScript + Tailwind.",
};

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="es" className={`${raleway.variable} h-full antialiased`}>
    <body className="min-h-full flex flex-col font-sans">
      <ConvexClientProvider>
         <header className="flex flex-row justify-between px-4 py-2"> <h1 className="text-2xl text-center font-semibold tracking-tight text-red-300">
        Hurrywords
      </h1><NavGames/> </header>
       
        {children}</ConvexClientProvider>
    </body>
  </html>
);

export default RootLayout;
