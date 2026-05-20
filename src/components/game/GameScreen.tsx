"use client";

import { useBingo } from "@/context/BingoContext";
import { MAX_NUMBER_PRESETS, remainingCount, getLetterForNumber } from "@/lib/bingo";
import { Button } from "@/components/ui/Button";
import { NumberGrid } from "./NumberGrid";

export function GameScreen() {
  const { game, setMaxNumbers, drawNumber, togglePause, resetGame } = useBingo();
  const remaining = remainingCount(game.maxNumbers, game.drawnNumbers);
  const lastLetter = game.lastDrawn
    ? getLetterForNumber(game.lastDrawn, game.maxNumbers)
    : "";

  return (
    <div className="space-y-6">
      {/* Panel superior: último número y controles */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center shadow-xl">
          <p className="mb-2 text-sm uppercase tracking-widest text-slate-400">
            Último número sorteado
          </p>
          {game.lastDrawn ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-amber-400 sm:text-6xl md:text-8xl">
                {lastLetter}
              </span>
              <span className="mt-2 text-6xl font-black text-white sm:text-8xl md:text-9xl">
                {game.lastDrawn}
              </span>
            </div>
          ) : (
            <p className="py-8 text-3xl text-slate-500 sm:text-5xl">—</p>
          )}
          {game.isPaused && (
            <p className="mt-4 animate-pulse text-xl font-bold text-amber-400">
              ⏸ PARTIDA EN PAUSA
            </p>
          )}
        </div>

        <div className="flex min-w-[280px] flex-col gap-3">
          <Button size="xl" onClick={() => drawNumber()} disabled={game.isPaused || remaining === 0}>
            🎲 Sortear número
          </Button>
          <Button size="lg" variant="secondary" onClick={togglePause}>
            {game.isPaused ? "▶ Reanudar" : "⏸ Pausar"}
          </Button>
          <Button size="lg" variant="danger" onClick={resetGame}>
            🔄 Reiniciar partida
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sorteados", value: game.drawnNumbers.length },
          { label: "Restantes", value: remaining },
          { label: "Máximo", value: game.maxNumbers },
          { label: "Estado", value: game.isPaused ? "Pausa" : "Activo" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center"
          >
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-white sm:text-3xl">{value}</p>
          </div>
        ))}
      </div>

      {/* Configuración máximo de números */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
        <p className="mb-3 text-sm font-medium text-slate-300">
          Cantidad máxima de números
        </p>
        <div className="flex flex-wrap gap-2">
          {MAX_NUMBER_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxNumbers(n)}
              className={[
                "rounded-xl px-4 py-2 font-semibold transition-colors",
                game.maxNumbers === n
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={25}
            max={200}
            value={game.maxNumbers}
            onChange={(e) => setMaxNumbers(Number(e.target.value) || 75)}
            className="w-24 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-center text-white"
            title="Personalizado"
          />
        </div>
      </div>

      {/* Historial */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">
          Historial ({game.drawnNumbers.length})
        </h2>
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto sm:max-h-40">
          {[...game.drawnNumbers].reverse().map((n, i) => (
            <span
              key={`${n}-${i}`}
              className={[
                "inline-flex min-w-[48px] items-center justify-center rounded-lg px-2 py-1 font-bold",
                i === 0 ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-white",
              ].join(" ")}
            >
              {getLetterForNumber(n, game.maxNumbers)}
              {n}
            </span>
          ))}
          {game.drawnNumbers.length === 0 && (
            <p className="text-slate-500">Aún no se han sorteado números</p>
          )}
        </div>
      </div>

      {/* Cuadrícula de números */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Tablero de números</h2>
        <NumberGrid
          maxNumbers={game.maxNumbers}
          drawnNumbers={game.drawnNumbers}
          lastDrawn={game.lastDrawn}
        />
      </div>
    </div>
  );
}
