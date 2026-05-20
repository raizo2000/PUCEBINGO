/**
 * Validación de cartillas contra números sorteados.
 */

import type { BingoCard, ValidationResult, WinType } from "./types";
import { getPlayableNumbers } from "./cards";
import { isCenterCell } from "./bingo";

function emptyMarked(): boolean[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(false));
}

function isMarked(
  cell: BingoCard["grid"][0][0],
  drawnSet: Set<number>
): boolean {
  if (isCenterCell(cell)) return true;
  if (typeof cell === "number") return drawnSet.has(cell);
  return false;
}

function rowComplete(
  grid: BingoCard["grid"],
  drawnSet: Set<number>,
  row: number
): boolean {
  for (let c = 0; c < 5; c++) {
    if (!isMarked(grid[row][c], drawnSet)) return false;
  }
  return true;
}

function colComplete(
  grid: BingoCard["grid"],
  drawnSet: Set<number>,
  col: number
): boolean {
  for (let r = 0; r < 5; r++) {
    if (!isMarked(grid[r][col], drawnSet)) return false;
  }
  return true;
}

function diagComplete(
  grid: BingoCard["grid"],
  drawnSet: Set<number>,
  main: boolean
): boolean {
  for (let i = 0; i < 5; i++) {
    const r = i;
    const c = main ? i : 4 - i;
    if (!isMarked(grid[r][c], drawnSet)) return false;
  }
  return true;
}

function fullCardComplete(
  grid: BingoCard["grid"],
  drawnSet: Set<number>
): boolean {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!isMarked(grid[r][c], drawnSet)) return false;
    }
  }
  return true;
}

/** Valida cartilla frente a números ya sorteados */
export function validateCard(
  card: BingoCard,
  drawnNumbers: number[]
): ValidationResult {
  const drawnSet = new Set(drawnNumbers);
  const markedCells = emptyMarked();
  const missingNumbers: number[] = [];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      markedCells[r][c] = isMarked(card.grid[r][c], drawnSet);
      const cell = card.grid[r][c];
      if (typeof cell === "number" && !drawnSet.has(cell)) {
        missingNumbers.push(cell);
      }
    }
  }

  const playable = getPlayableNumbers(card);
  const matchedCount = playable.filter((n) => drawnSet.has(n)).length;

  let winType: WinType = null;
  let winLine: number | undefined;

  for (let r = 0; r < 5; r++) {
    if (rowComplete(card.grid, drawnSet, r)) {
      winType = "horizontal";
      winLine = r;
      break;
    }
  }

  if (!winType) {
    for (let c = 0; c < 5; c++) {
      if (colComplete(card.grid, drawnSet, c)) {
        winType = "vertical";
        winLine = c;
        break;
      }
    }
  }

  if (!winType && diagComplete(card.grid, drawnSet, true)) {
    winType = "diagonal";
    winLine = 0;
  } else if (!winType && diagComplete(card.grid, drawnSet, false)) {
    winType = "diagonal";
    winLine = 1;
  }

  if (fullCardComplete(card.grid, drawnSet)) {
    winType = "full";
  }

  return {
    hasBingo: winType !== null,
    winType,
    winLine,
    markedCells,
    missingNumbers: [...new Set(missingNumbers)].sort((a, b) => a - b),
    matchedCount,
    totalNumbers: playable.length,
  };
}

/** Etiqueta legible del tipo de bingo */
export function winTypeLabel(winType: WinType): string {
  switch (winType) {
    case "horizontal":
      return "Línea horizontal";
    case "vertical":
      return "Línea vertical";
    case "diagonal":
      return "Diagonal";
    case "full":
      return "Cartilla llena";
    default:
      return "Sin bingo";
  }
}
