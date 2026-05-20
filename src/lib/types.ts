/** Modo de generación de cartillas */
export type CardMode = "classic" | "free";

/** Tamaño de papel para PDF */
export type PaperSize = "letter" | "a4";

import { CENTER_CELL_LABEL } from "./bingo";

/** Celda de cartilla: número o espacio central PUCESE (modo clásico) */
export type CellValue = number | typeof CENTER_CELL_LABEL | null;

/** Cartilla individual 5x5 */
export interface BingoCard {
  id: string;
  serial: string;
  playerCode: string;
  cardIndex: number;
  grid: CellValue[][];
  mode: CardMode;
}

/** Hoja de jugador con hasta 4 cartillas */
export interface PlayerSheet {
  playerNumber: number;
  playerCode: string;
  cards: BingoCard[];
}

/** Última tanda de cartillas generada (para PDF parcial) */
export interface CardBatchSnapshot {
  playerFrom: number;
  playerTo: number;
  cardCount: number;
  addedAt: string;
}

/** Metadatos del lote de cartillas generadas */
export interface CardRegistryMeta {
  totalCards: number;
  maxNumbers: number;
  mode: CardMode;
  year: number;
  generatedAt: string;
  /** Último índice de serial usado (el siguiente será +1) */
  nextSerialIndex: number;
  /** Último número de jugador asignado (J001 → 1). El siguiente lote empieza en +1 */
  maxPlayerNumber: number;
  /** Última tanda agregada; usada para «PDF solo nuevas» */
  lastBatch?: CardBatchSnapshot;
}

/** Registro completo de cartillas (persistido en IndexedDB) */
export interface CardRegistry {
  cardsBySerial: Record<string, BingoCard>;
  cardsById: Record<string, BingoCard>;
  meta: CardRegistryMeta;
}

/** Estado de la partida en curso */
export interface GameState {
  maxNumbers: number;
  drawnNumbers: number[];
  isPaused: boolean;
  lastDrawn: number | null;
}

/** Configuración global de la app */
export interface AppSettings {
  maxNumbers: number;
  cardMode: CardMode;
  paperSize: PaperSize;
  includeQr: boolean;
}

/** Resultado de validación de bingo */
export type WinType =
  | "horizontal"
  | "vertical"
  | "diagonal"
  | "full"
  | null;

export interface ValidationResult {
  hasBingo: boolean;
  winType: WinType;
  winLine?: number;
  markedCells: boolean[][];
  missingNumbers: number[];
  matchedCount: number;
  totalNumbers: number;
}

/** Progreso de generación / PDF */
export interface ProgressState {
  current: number;
  total: number;
  phase: string;
  isRunning: boolean;
}
