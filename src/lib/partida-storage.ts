/**
 * Operaciones de respaldo/restauración sobre IndexedDB + localStorage.
 */

import type { PartidaBackup } from "./partida-backup";
import type { AppSettings, GameState } from "./types";
import {
  clearAllCards,
  loadAllCards,
  loadGameState,
  loadRegistryMeta,
  loadSettings,
  saveCardsBatch,
  saveGameState,
  saveRegistryMeta,
  saveSettings,
} from "./storage";

const PARTIDA_NAME_KEY = "pucesebingo-partida-name";

export function loadPartidaName(): string {
  if (typeof window === "undefined") return "Mi partida";
  return localStorage.getItem(PARTIDA_NAME_KEY)?.trim() || "Mi partida";
}

export function savePartidaName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PARTIDA_NAME_KEY, name.trim() || "Mi partida");
}

/** Arma el objeto de respaldo con todo lo de la partida actual */
export async function buildPartidaBackup(
  partidaName?: string
): Promise<PartidaBackup> {
  const [cards, meta, game, settings] = await Promise.all([
    loadAllCards(),
    loadRegistryMeta(),
    Promise.resolve(loadGameState()),
    Promise.resolve(loadSettings()),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    partidaName: partidaName?.trim() || loadPartidaName(),
    game,
    settings,
    meta,
    cards,
  };
}

const CARD_RESTORE_BATCH = 200;

/** Reemplaza la partida local por la del respaldo */
export async function restorePartidaBackup(
  backup: PartidaBackup,
  onProgress?: (phase: string, current: number, total: number) => void
): Promise<void> {
  await clearAllCards();

  const total = backup.cards.length;
  for (let i = 0; i < total; i += CARD_RESTORE_BATCH) {
    const batch = backup.cards.slice(i, i + CARD_RESTORE_BATCH);
    await saveCardsBatch(batch);
    onProgress?.(
      "Restaurando cartillas...",
      Math.min(i + batch.length, total),
      total
    );
  }

  if (backup.meta) {
    await saveRegistryMeta(backup.meta);
  }

  saveGameState(backup.game);
  saveSettings(backup.settings);
  savePartidaName(backup.partidaName);
}

export async function getPartidaSummary(): Promise<{
  name: string;
  cardCount: number;
  game: GameState;
  settings: AppSettings;
}> {
  const cards = await loadAllCards();
  return {
    name: loadPartidaName(),
    cardCount: cards.length,
    game: loadGameState(),
    settings: loadSettings(),
  };
}
