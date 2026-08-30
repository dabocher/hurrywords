import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Raleway } from "next/font/google";

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
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </body>
  </html>
);

export default RootLayout;
