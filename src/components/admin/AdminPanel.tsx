"use client";

import { useRef, useState } from "react";
import { useBingo } from "@/context/BingoContext";
import { formatBackupSize } from "@/lib/partida-backup";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function AdminPanel() {
  const {
    game,
    resetGame,
    clearCards,
    cardCount,
    registryMeta,
    progress,
    partidaName,
    setPartidaName,
    exportPartidaBackup,
    importPartidaBackup,
  } = useBingo();
  const [confirmClear, setConfirmClear] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleClearCards = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    await clearCards();
    setConfirmClear(false);
  };

  const handleExport = async () => {
    setBackupBusy(true);
    try {
      await exportPartidaBackup();
    } catch (err) {
      console.error(err);
      alert("No se pudo exportar el respaldo.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    const ok = confirm(
      `¿Restaurar la partida «${file.name}»?\n\nSe reemplazarán las cartillas y el estado de sorteo en ESTE navegador.`
    );
    if (!ok) {
      if (importInputRef.current) importInputRef.current.value = "";
      return;
    }
    setBackupBusy(true);
    try {
      await importPartidaBackup(file);
      alert("Partida restaurada correctamente. Ya puedes generar PDF o seguir el sorteo.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo importar el respaldo.");
    } finally {
      setBackupBusy(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const estimatedBackupMb =
    cardCount > 0 ? formatBackupSize(cardCount * 350) : "—";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">Administración</h1>
        <p className="text-slate-400">
          Gestiona la partida, respalda tus datos para usar otra computadora y controla las
          cartillas registradas.
        </p>
      </div>

      <section className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Usar en otra computadora</h2>
        <p className="mb-4 text-sm text-emerald-100/80">
          Exporta un archivo con toda la partida (cartillas, seriales, sorteo y configuración).
          En el otro equipo, importa ese archivo y podrás seguir generando PDF o validando
          cartillas.
        </p>

        <div className="mb-4 max-w-md">
          <Input
            label="Nombre de la partida"
            value={partidaName}
            onChange={(e) => setPartidaName(e.target.value)}
            hint="Ej: Bingo Aniversario PUCESE 2026"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="success"
            onClick={() => void handleExport()}
            disabled={backupBusy || progress.isRunning || cardCount === 0}
          >
            {backupBusy ? "Exportando..." : "📤 Exportar respaldo de partida"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => importInputRef.current?.click()}
            disabled={backupBusy || progress.isRunning}
          >
            📥 Importar respaldo en este equipo
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void handleImport(e.target.files?.[0])}
          />
        </div>
        <p className="mt-3 text-xs text-emerald-200/70">
          Tamaño estimado del respaldo: ~{estimatedBackupMb}
          {cardCount > 0 && " · Guarda el .json en Drive, USB o correo"}
        </p>
        {(progress.isRunning && progress.total > 0) || backupBusy ? (
          <div className="mt-4">
            <ProgressBar
              current={progress.current}
              total={progress.total || 1}
              label={progress.phase || "Procesando..."}
            />
          </div>
        ) : null}
        <p className="mt-4 text-xs text-slate-500">
          Próximo paso (nube): cuenta de organizador y partida sincronizada sin archivo manual.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Estado de la partida</h2>
          <ul className="mb-4 space-y-2 text-slate-300">
            <li>
              <strong className="text-white">Nombre:</strong> {partidaName}
            </li>
            <li>Números sorteados: {game.drawnNumbers.length}</li>
            <li>Máximo configurado: {game.maxNumbers}</li>
            <li>Pausada: {game.isPaused ? "Sí" : "No"}</li>
            <li>Último número: {game.lastDrawn ?? "—"}</li>
          </ul>
          <Button variant="danger" onClick={resetGame}>
            Reiniciar partida (mantiene cartillas)
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            Borra números sorteados e historial. Los seriales registrados no se eliminan.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Cartillas generadas</h2>
          <ul className="mb-4 space-y-2 text-slate-300">
            <li>Total registradas: {cardCount.toLocaleString()} cartillas</li>
            {registryMeta && (
              <>
                <li>
                  Jugadores: {registryMeta.maxPlayerNumber?.toLocaleString() ?? "—"} (último J
                  {String(registryMeta.maxPlayerNumber ?? 0).padStart(3, "0")})
                </li>
                <li>Modo: {registryMeta.mode === "classic" ? "Clásico" : "Libre"}</li>
                <li>Generadas: {new Date(registryMeta.generatedAt).toLocaleString()}</li>
              </>
            )}
          </ul>
          <Button
            variant="danger"
            onClick={() => void handleClearCards()}
            disabled={progress.isRunning || cardCount === 0 || backupBusy}
          >
            {confirmClear
              ? "⚠ Confirmar: borrar TODAS las cartillas"
              : "Borrar todas las cartillas"}
          </Button>
          {confirmClear && (
            <button
              type="button"
              className="mt-2 text-sm text-slate-400 underline"
              onClick={() => setConfirmClear(false)}
            >
              Cancelar
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
