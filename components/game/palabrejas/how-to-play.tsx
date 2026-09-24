"use client";

import { useCallback, useEffect, useRef } from "react";

type HowToPlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

const STEPS = [
  {
    title: "Inicia el juego",
    description: "Presiona el botón 'Iniciar juego' para comenzar la cuenta atrás. Solo verás la letra central al principio.",
  },
  {
    title: "Cuentra atrás de 5 segundos",
    description: "Tres letras irán apareciendo en 4s, 2s y 0s. Iniciado el juego irán apareciendo las letras faltantes cada 5 segundos.",
  },

  {
    title: "Forma palabras",
    description: "Usa las letras visibles para formar palabras, mínimo 4 letras. La letra central (ámbar) es obligatoria en cada palabra.",
  },
  {
    title: "Puntuación",
    description: "Las palabras valen el número de letras que tienen. Las palabras mágicas (✦), hay 36 predeterminadas cada día, valen 3 veces más. ¡Las Palabrejas (⭐), con todas las letras del juego, dan bonus extra!",
  },
  {
    title: "¡Hurry!",
    description: "Tienes 90 segundos para encontrar el mayor número de palabras. Cuando queden 30 segundos, empezarán a desaparecer letras. Las palabras encontradas dan bonus de tiempo. Pero cuidado, los fallos o las palabras repetidas restan segundos.",
  },
];

export const HowToPlay = ({ isOpen, onClose }: HowToPlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKey);
    }

    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-100">Cómo jugar a Palabrejas</h2>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-100 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400 text-stone-900 font-bold flex items-center justify-center text-sm">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold text-stone-100 mb-1">{step.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>



        <button
          onClick={handleClose}
          className="mt-6 w-full py-3 bg-amber-400 text-stone-900 font-bold rounded-xl hover:bg-amber-300 transition-colors"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
};
