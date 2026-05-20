"use client";

import type { BingoCard, CellValue } from "@/lib/types";
import { BINGO_LETTERS, CENTER_CELL_LABEL, isCenterCell } from "@/lib/bingo";

interface BingoCardViewProps {
  card: BingoCard;
  markedCells?: boolean[][];
  compact?: boolean;
  showMeta?: boolean;
}

function Cell({
  value,
  marked,
  compact,
}: {
  value: CellValue;
  marked?: boolean;
  compact?: boolean;
}) {
  const isFree = isCenterCell(value);
  const isEmpty = value === null;

  return (
    <div
      className={[
        "flex items-center justify-center border border-slate-600/60 font-bold transition-colors",
        compact
          ? "min-h-[32px] text-sm sm:min-h-[36px] sm:text-base"
          : "min-h-[40px] text-base sm:min-h-[48px] sm:text-lg",
        marked ? "bg-emerald-600/80 text-white ring-2 ring-emerald-400" : "bg-slate-800/90 text-white",
        isFree ? "bg-violet-700/60 text-violet-100" : "",
        isEmpty ? "bg-slate-900/50" : "",
      ].join(" ")}
    >
      {isEmpty ? "" : isFree ? CENTER_CELL_LABEL : value}
    </div>
  );
}

export function BingoCardView({
  card,
  markedCells,
  compact = false,
  showMeta = true,
}: BingoCardViewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-600 bg-slate-900/50 shadow-lg">
      {showMeta && (
        <div className="border-b border-slate-700 bg-slate-800/80 px-3 py-2">
          <p className="font-bold text-white">{card.id}</p>
          <p className="font-mono text-xs text-indigo-300">{card.serial}</p>
          <p className="text-xs text-slate-500">Jugador: {card.playerCode}</p>
        </div>
      )}
      {card.mode === "classic" && (
        <div className="grid grid-cols-5 border-b border-slate-700">
          {BINGO_LETTERS.map((letter) => (
            <div
              key={letter}
              className="flex items-center justify-center bg-indigo-900/50 py-1 text-base font-black text-indigo-200 sm:py-2 sm:text-xl"
            >
              {letter}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-5 gap-px bg-slate-700 p-px">
        {card.grid.map((row, r) =>
          row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              value={cell}
              marked={markedCells?.[r]?.[c]}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}
