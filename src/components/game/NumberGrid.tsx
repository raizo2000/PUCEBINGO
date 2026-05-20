"use client";

import { getLetterForNumber } from "@/lib/bingo";

interface NumberGridProps {
  maxNumbers: number;
  drawnNumbers: number[];
  lastDrawn: number | null;
}

export function NumberGrid({ maxNumbers, drawnNumbers, lastDrawn }: NumberGridProps) {
  const drawnSet = new Set(drawnNumbers);

  return (
    <div className="grid grid-cols-5 gap-1 sm:grid-cols-10 sm:gap-1.5 md:grid-cols-[repeat(15,minmax(0,1fr))] lg:gap-2">
      {Array.from({ length: maxNumbers }, (_, i) => i + 1).map((num) => {
        const drawn = drawnSet.has(num);
        const isLast = num === lastDrawn;
        const letter = getLetterForNumber(num, maxNumbers);

        return (
          <div
            key={num}
            className={[
              "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-center transition-all",
              "text-xs font-bold sm:text-sm md:text-base",
              drawn
                ? "border-emerald-500/50 bg-emerald-600/90 text-white shadow-md"
                : "border-slate-700 bg-slate-800/60 text-slate-400",
              isLast ? "scale-110 ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950" : "",
            ].join(" ")}
          >
            <span className="absolute left-0.5 top-0.5 text-[8px] font-normal opacity-60 sm:text-[10px]">
              {letter}
            </span>
            {num}
          </div>
        );
      })}
    </div>
  );
}
