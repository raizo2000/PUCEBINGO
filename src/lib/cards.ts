/**
 * Generación de cartillas en modo clásico y libre.
 * Optimizado para lotes grandes mediante generadores.
 */

import type { BingoCard, CardMode, CellValue, PlayerSheet } from "./types";
import {
  CENTER_CELL_LABEL,
  formatCardId,
  formatPlayerCode,
  getColumnRanges,
  pickUniqueFromRange,
  shuffle,
} from "./bingo";
import { formatSerial } from "./serials";

export const CARDS_PER_SHEET = 4;

/** Jugadores nuevos que se crearán al agregar `newCards` cartillas */
export function playersInCardBatch(newCards: number): number {
  if (newCards <= 0) return 0;
  return Math.ceil(newCards / CARDS_PER_SHEET);
}

/** Crea una cartilla en modo clásico (columnas B-I-N-G-O, centro libre) */
export function generateClassicCard(
  playerCode: string,
  cardIndex: number,
  maxNumbers: number,
  serial: string
): BingoCard {
  const ranges = getColumnRanges(maxNumbers);
  const grid: CellValue[][] = Array.from({ length: 5 }, () =>
    Array(5).fill(null)
  );

  for (let col = 0; col < 5; col++) {
    const { min, max } = ranges[col];
    const count = col === 2 ? 4 : 5; // Columna N: 4 números + centro libre
    const nums = pickUniqueFromRange(min, max, count);
    let numIdx = 0;
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        grid[row][col] = CENTER_CELL_LABEL;
      } else {
        grid[row][col] = nums[numIdx++];
      }
    }
  }

  return {
    id: formatCardId(playerCode, cardIndex),
    serial,
    playerCode,
    cardIndex,
    grid,
    mode: "classic",
  };
}

/** Crea una cartilla en modo libre (25 números únicos sin restricción de columna) */
export function generateFreeCard(
  playerCode: string,
  cardIndex: number,
  maxNumbers: number,
  serial: string
): BingoCard {
  const nums = pickUniqueFromRange(1, maxNumbers, 25);
  const grid: CellValue[][] = [];
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    const rowCells: CellValue[] = [];
    for (let col = 0; col < 5; col++) {
      rowCells.push(nums[idx++]);
    }
    grid.push(rowCells);
  }

  return {
    id: formatCardId(playerCode, cardIndex),
    serial,
    playerCode,
    cardIndex,
    grid,
    mode: "free",
  };
}

function createCard(
  mode: CardMode,
  playerCode: string,
  cardIndex: number,
  maxNumbers: number,
  serial: string
): BingoCard {
  return mode === "classic"
    ? generateClassicCard(playerCode, cardIndex, maxNumbers, serial)
    : generateFreeCard(playerCode, cardIndex, maxNumbers, serial);
}

/** Genera una hoja de jugador con hasta 4 cartillas */
export function generatePlayerSheet(
  playerNumber: number,
  cardsOnSheet: number,
  mode: CardMode,
  maxNumbers: number,
  year: number,
  startSerialIndex: number
): { sheet: PlayerSheet; nextSerialIndex: number } {
  const playerCode = formatPlayerCode(playerNumber);
  const cards: BingoCard[] = [];
  let serialIdx = startSerialIndex;

  for (let c = 1; c <= cardsOnSheet; c++) {
    serialIdx++;
    cards.push(
      createCard(
        mode,
        playerCode,
        c,
        maxNumbers,
        formatSerial(year, serialIdx)
      )
    );
  }

  return {
    sheet: { playerNumber, playerCode, cards },
    nextSerialIndex: serialIdx,
  };
}

/**
 * Generador asíncrono por lotes para miles de cartillas sin bloquear el UI.
 * @param batchSize - cartillas por lote antes de ceder el hilo
 */
export async function* generateCardsInBatches(
  totalCards: number,
  mode: CardMode,
  maxNumbers: number,
  year: number,
  startSerialIndex: number,
  batchSize = 50,
  onProgress?: (done: number, total: number) => void,
  startPlayerNumber = 0
): AsyncGenerator<PlayerSheet, void, unknown> {
  let cardCount = 0;
  let serialIdx = startSerialIndex;
  let playerNumber = startPlayerNumber;

  while (cardCount < totalCards) {
    playerNumber++;
    const remaining = totalCards - cardCount;
    const cardsThisSheet = Math.min(CARDS_PER_SHEET, remaining);

    const { sheet, nextSerialIndex } = generatePlayerSheet(
      playerNumber,
      cardsThisSheet,
      mode,
      maxNumbers,
      year,
      serialIdx
    );
    serialIdx = nextSerialIndex;
    cardCount += cardsThisSheet;

    yield sheet;

    if (cardCount % batchSize === 0 || cardCount === totalCards) {
      onProgress?.(cardCount, totalCards);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

/** Aplana hojas a lista de cartillas */
export function flattenSheets(sheets: PlayerSheet[]): BingoCard[] {
  return sheets.flatMap((s) => s.cards);
}

/** Obtiene todos los números jugables de una cartilla (excluye PUCESE y null) */
export function getPlayableNumbers(card: BingoCard): number[] {
  const nums: number[] = [];
  for (const row of card.grid) {
    for (const cell of row) {
      if (typeof cell === "number") nums.push(cell);
    }
  }
  return nums;
}
