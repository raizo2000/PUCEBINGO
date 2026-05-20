"use client";

import { useState } from "react";
import { useBingo } from "@/context/BingoContext";
import { calculateSheets, formatPlayerCode } from "@/lib/bingo";
import { playersInCardBatch } from "@/lib/cards";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  downloadBlob,
  exportSheetsToPdf,
  loadSheetsForPdf,
} from "@/lib/pdf-export";

export function GeneratorPanel() {
  const {
    settings,
    updateSettings,
    generateCards,
    cardCount,
    registryMeta,
    progress,
  } = useBingo();

  const [totalInput, setTotalInput] = useState("100");
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 100, phase: "" });
  const [isPdfRunning, setIsPdfRunning] = useState(false);

  const toAdd = Math.max(1, parseInt(totalInput, 10) || 0);
  const { fullSheets: newPlayers, partialCardsOnLastSheet } = calculateSheets(toAdd);
  const isPartial = toAdd % 4 !== 0;
  const registeredPlayers = registryMeta?.maxPlayerNumber ?? Math.floor(cardCount / 4);
  const totalAfter = cardCount + toAdd;
  const playersAfter = registeredPlayers + playersInCardBatch(toAdd);
  const firstNewPlayer =
    cardCount > 0 ? formatPlayerCode(registeredPlayers + 1) : formatPlayerCode(1);
  const lastNewPlayer = formatPlayerCode(playersAfter);

  const handleGenerate = async () => {
    if (toAdd < 1) return;
    try {
      await generateCards(toAdd);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudieron generar las cartillas. Intenta de nuevo.";
      alert(msg);
    }
  };

  const lastBatch = registryMeta?.lastBatch;

  const runPdfExport = async (
    scope: "all" | "lastBatch",
    filenamePrefix: string
  ) => {
    if (cardCount === 0) {
      alert("Primero genera cartillas antes de exportar el PDF.");
      return;
    }
    if (scope === "lastBatch" && !lastBatch) {
      alert(
        "No hay una tanda reciente registrada. Genera cartillas nuevas o descarga el PDF completo."
      );
      return;
    }

    setIsPdfRunning(true);
    setPdfProgress({ current: 0, total: 100, phase: "Cargando cartillas..." });

    try {
      const sheets = await loadSheetsForPdf({
        ...(scope === "lastBatch" && lastBatch
          ? { playerFrom: lastBatch.playerFrom, playerTo: lastBatch.playerTo }
          : {}),
        onProgress: (cur, tot) => {
          setPdfProgress({
            current: Math.floor((cur / tot) * 20),
            total: 100,
            phase: `Cargando cartilla ${cur} de ${tot}...`,
          });
        },
      });

      if (sheets.length === 0) {
        alert("No se encontraron cartillas para esta tanda.");
        return;
      }

      const blob = await exportSheetsToPdf(sheets, {
        paperSize: settings.paperSize,
        includeQr: settings.includeQr,
        batchSize: 25,
        onProgress: (cur, tot, phase) => {
          setPdfProgress({ current: cur, total: tot, phase });
        },
      });

      downloadBlob(blob, `${filenamePrefix}-${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error al generar el PDF. Revisa la consola.");
    } finally {
      setIsPdfRunning(false);
      setPdfProgress({ current: 0, total: 100, phase: "" });
    }
  };

  const handleExportPdf = () =>
    void runPdfExport("all", "pucesebingo-cartillas-completo");

  const handleExportLastBatchPdf = () => {
    if (!lastBatch) return;
    const from = formatPlayerCode(lastBatch.playerFrom);
    const to = formatPlayerCode(lastBatch.playerTo);
    void runPdfExport("lastBatch", `pucesebingo-cartillas-${from}-${to}`);
  };

  const handlePrint = async () => {
    await handleExportPdf();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">Generador de cartillas</h1>
        <p className="text-slate-400">
          Cada jugador = 1 hoja con 4 cartillas. Puedes ir sumando inscripciones al mismo juego
          (ej. 2000 jugadores hoy y 1000 más mañana) sin borrar las cartillas ya generadas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
          <Input
            label="Cartillas nuevas a agregar"
            type="number"
            min={1}
            max={100000}
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            hint="1000 jugadores = 4000 cartillas. Se suman a las ya registradas."
          />

          <div className="rounded-xl bg-slate-900/50 p-4 text-sm text-slate-300">
            <p>
              <strong className="text-white">En el juego ahora:</strong>{" "}
              {cardCount.toLocaleString()} cartillas ({registeredPlayers.toLocaleString()}{" "}
              jugadores)
            </p>
            <p className="mt-2">
              <strong className="text-white">Esta tanda agrega:</strong>{" "}
              {toAdd.toLocaleString()} cartillas ({newPlayers.toLocaleString()} jugadores
              {cardCount > 0 && (
                <span className="text-indigo-300">
                  {" "}
                  · códigos {firstNewPlayer} → {lastNewPlayer}
                </span>
              )}
              )
            </p>
            <p>
              <strong className="text-white">Quedarán en total:</strong>{" "}
              {totalAfter.toLocaleString()} cartillas ({playersAfter.toLocaleString()} jugadores)
            </p>
            <p className="mt-2 text-slate-400">
              Última hoja de la tanda:{" "}
              {isPartial
                ? `${partialCardsOnLastSheet} cartilla(s) + espacios vacíos`
                : "4 cartillas completas"}
            </p>
            {registryMeta && cardCount > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Último serial usado: BG-{registryMeta.year}-
                {String(registryMeta.nextSerialIndex).padStart(7, "0")}
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Modo de cartilla</p>
            <div className="flex gap-2">
              {(["classic", "free"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateSettings({ cardMode: mode })}
                  className={[
                    "flex-1 rounded-xl px-4 py-3 font-semibold",
                    settings.cardMode === mode
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300",
                  ].join(" ")}
                >
                  {mode === "classic" ? "Clásico BINGO" : "Modo libre"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Tamaño de papel (PDF)</p>
            <div className="flex gap-2">
              {(["letter", "a4"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateSettings({ paperSize: size })}
                  className={[
                    "flex-1 rounded-xl px-4 py-2 font-semibold uppercase",
                    settings.paperSize === size
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300",
                  ].join(" ")}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={settings.includeQr}
              onChange={(e) => updateSettings({ includeQr: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            Incluir código QR en cada cartilla
          </label>

          <Button
            size="lg"
            fullWidth
            onClick={handleGenerate}
            disabled={progress.isRunning || toAdd < 1}
          >
            {progress.isRunning
              ? "Generando..."
              : cardCount > 0
                ? `Agregar ${toAdd.toLocaleString()} cartillas`
                : `Generar ${toAdd.toLocaleString()} cartillas`}
          </Button>

          {progress.isRunning && (
            <ProgressBar
              current={progress.current}
              total={progress.total}
              label={progress.phase}
            />
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
          <h2 className="text-lg font-semibold text-white">Exportar e imprimir</h2>
          <p className="text-sm text-slate-400">
            El PDF incluye todos los jugadores registrados (
            {Math.ceil(cardCount / 4).toLocaleString()} páginas con {cardCount.toLocaleString()}{" "}
            cartillas). La generación se procesa por lotes para no bloquear el navegador.
          </p>

          <Button
            size="lg"
            variant="success"
            fullWidth
            onClick={handleExportPdf}
            disabled={isPdfRunning || cardCount === 0}
          >
            📥 Descargar PDF completo
          </Button>

          <Button
            size="lg"
            variant="secondary"
            fullWidth
            onClick={handleExportLastBatchPdf}
            disabled={isPdfRunning || cardCount === 0 || !lastBatch}
          >
            📥 Descargar PDF de la última tanda
          </Button>
          {lastBatch ? (
            <p className="text-xs text-slate-500">
              Última tanda: {formatPlayerCode(lastBatch.playerFrom)} →{" "}
              {formatPlayerCode(lastBatch.playerTo)} (
              {lastBatch.cardCount.toLocaleString()} cartillas ·{" "}
              {(
                lastBatch.playerTo -
                lastBatch.playerFrom +
                1
              ).toLocaleString()}{" "}
              jugadores)
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              El PDF de la última tanda estará disponible después de generar o agregar
              cartillas.
            </p>
          )}

          <Button
            size="md"
            variant="secondary"
            fullWidth
            onClick={handlePrint}
            disabled={isPdfRunning || cardCount === 0}
          >
            🖨 Preparar para imprimir (PDF completo)
          </Button>

          {isPdfRunning && (
            <ProgressBar
              current={pdfProgress.current}
              total={pdfProgress.total}
              label={pdfProgress.phase}
            />
          )}

          <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-4 text-sm text-amber-200">
            <strong>Tip rendimiento:</strong> Para más de 500 hojas, cierra otras pestañas del
            navegador. Los seriales se guardan en IndexedDB y persisten al reiniciar la partida.
          </div>
        </div>
      </div>
    </div>
  );
}
