"use client";

import { useState } from "react";
import { useBingo } from "@/context/BingoContext";
import { validateCard, winTypeLabel } from "@/lib/validation";
import { BingoCardView } from "@/components/cards/BingoCardView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { BingoCard } from "@/lib/types";

export function ValidatorPanel() {
  const { game, searchCard, searchPlayerCards } = useBingo();
  const [query, setQuery] = useState("");
  const [card, setCard] = useState<BingoCard | null>(null);
  const [playerCards, setPlayerCards] = useState<BingoCard[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");

  const activeCard = playerCards.length > 0 ? playerCards[selectedIndex] : card;

  const handleSearch = async () => {
    setError("");
    setCard(null);
    setPlayerCards([]);

    const q = query.trim();
    if (!q) return;

    const found = await searchCard(q);
    if (found) {
      setCard(found);
      return;
    }

    const byPlayer = await searchPlayerCards(q);
    if (byPlayer.length > 0) {
      setPlayerCards(byPlayer.sort((a, b) => a.cardIndex - b.cardIndex));
      setSelectedIndex(0);
      return;
    }

    setError("No se encontró cartilla con ese código, serial o jugador.");
  };

  const result = activeCard ? validateCard(activeCard, game.drawnNumbers) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">Validador de bingo</h1>
        <p className="text-slate-400">
          Busca por serial (BG-2026-0000001), código de cartilla (J001-C1) o jugador (J001).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          label="Buscar cartilla"
          placeholder="BG-2026-0000001 o J001-C1 o J001"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
          className="flex-1"
        />
        <Button size="lg" onClick={() => void handleSearch()} className="sm:self-end">
          Buscar
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-950/50 px-4 py-3 text-rose-300">{error}</p>
      )}

      {playerCards.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {playerCards.map((c, i) => (
            <button
              key={c.serial}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium",
                selectedIndex === i ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300",
              ].join(" ")}
            >
              {c.id}
            </button>
          ))}
        </div>
      )}

      {activeCard && result && (
        <div className="grid gap-6 lg:grid-cols-2">
          <BingoCardView card={activeCard} markedCells={result.markedCells} />

          <div className="space-y-4">
            <div
              className={[
                "rounded-2xl border p-6 text-center",
                result.hasBingo
                  ? "border-emerald-500 bg-emerald-950/50"
                  : "border-slate-600 bg-slate-800/50",
              ].join(" ")}
            >
              <p className="text-4xl">{result.hasBingo ? "🎉 ¡BINGO!" : "❌ Sin bingo"}</p>
              {result.hasBingo && (
                <p className="mt-2 text-xl font-semibold text-emerald-300">
                  {winTypeLabel(result.winType)}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <p className="text-sm text-slate-400">Progreso</p>
              <p className="text-2xl font-bold text-white">
                {result.matchedCount} / {result.totalNumbers} números marcados
              </p>
            </div>

            {result.missingNumbers.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
                <p className="mb-2 text-sm font-medium text-slate-300">
                  Números que faltan ({result.missingNumbers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missingNumbers.map((n) => (
                    <span
                      key={n}
                      className="rounded-lg bg-rose-900/50 px-2 py-1 font-mono text-rose-200"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 font-mono text-sm text-slate-400">
              <p>Serial: {activeCard.serial}</p>
              <p>ID: {activeCard.id}</p>
              <p>Jugador: {activeCard.playerCode}</p>
              <p>Modo: {activeCard.mode === "classic" ? "Clásico" : "Libre"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
