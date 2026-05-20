/**
 * Respaldo completo de una partida para usar en otro equipo
 * (misma partida: cartillas, seriales, sorteo, configuración).
 */

import type {
  AppSettings,
  BingoCard,
  CardRegistryMeta,
  GameState,
} from "./types";

export const PARTIDA_BACKUP_VERSION = 1;

export interface PartidaBackup {
  version: number;
  exportedAt: string;
  partidaName: string;
  game: GameState;
  settings: AppSettings;
  meta: CardRegistryMeta | null;
  cards: BingoCard[];
}

export function isPartidaBackup(value: unknown): value is PartidaBackup {
  if (!value || typeof value !== "object") return false;
  const b = value as PartidaBackup;
  return (
    b.version === PARTIDA_BACKUP_VERSION &&
    typeof b.exportedAt === "string" &&
    typeof b.partidaName === "string" &&
    Array.isArray(b.cards) &&
    b.game != null &&
    b.settings != null
  );
}

/** Descarga el respaldo como archivo JSON */
export function downloadPartidaBackup(backup: PartidaBackup): void {
  const blob = new Blob([JSON.stringify(backup)], {
    type: "application/json",
  });
  const safeName = backup.partidaName
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "partida";
  const date = backup.exportedAt.slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pucesebingo-${safeName}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lee un archivo .json exportado previamente */
export function readPartidaBackupFile(file: File): Promise<PartidaBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string);
        if (!isPartidaBackup(parsed)) {
          reject(new Error("El archivo no es un respaldo válido de PUCESE Bingo."));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error("No se pudo leer el archivo. Comprueba que sea un .json válido."));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsText(file);
  });
}

/** Tamaño aproximado legible */
export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
