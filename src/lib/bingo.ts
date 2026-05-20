/**
 * Lógica del bingo: rangos de columnas, sorteo y utilidades.
 */

/** Letras del modo clásico BINGO */
export const BINGO_LETTERS = ["B", "I", "N", "G", "O"] as const;

/** Texto del espacio central en modo clásico */
export const CENTER_CELL_LABEL = "PUCESE" as const;

/** Valor legado en cartillas generadas antes del cambio */
const LEGACY_CENTER_CELL = "FREE";

/** Indica si la celda es el espacio central (no lleva número) */
export function isCenterCell(value: unknown): value is typeof CENTER_CELL_LABEL {
  return value === CENTER_CELL_LABEL || value === LEGACY_CENTER_CELL;
}

/** Opciones predefinidas de cantidad máxima de números */
export const MAX_NUMBER_PRESETS = [75, 90, 100, 120] as const;

/** Calcula los rangos de cada columna según el máximo de números */
export function getColumnRanges(maxNumbers: number): {
  letter: string;
  min: number;
  max: number;
}[] {
  const perColumn = Math.floor(maxNumbers / 5);
  return BINGO_LETTERS.map((letter, i) => ({
    letter,
    min: i * perColumn + 1,
    max: Math.min((i + 1) * perColumn, maxNumbers),
  }));
}

/** Letra BINGO asociada a un número sorteado */
export function getLetterForNumber(
  num: number,
  maxNumbers: number
): string {
  const ranges = getColumnRanges(maxNumbers);
  for (const r of ranges) {
    if (num >= r.min && num <= r.max) return r.letter;
  }
  return "";
}

/** Mezcla Fisher-Yates (in-place sobre copia) */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Elige n elementos únicos aleatorios del rango [min, max] */
export function pickUniqueFromRange(
  min: number,
  max: number,
  count: number
): number[] {
  const pool: number[] = [];
  for (let n = min; n <= max; n++) pool.push(n);
  return shuffle(pool).slice(0, count);
}

/** Sortea un número que aún no fue extraído */
export function drawRandomNumber(
  maxNumbers: number,
  drawn: number[]
): number | null {
  const drawnSet = new Set(drawn);
  const available: number[] = [];
  for (let n = 1; n <= maxNumbers; n++) {
    if (!drawnSet.has(n)) available.push(n);
  }
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/** Números restantes por sortear */
export function remainingCount(maxNumbers: number, drawn: number[]): number {
  return maxNumbers - drawn.length;
}

/** Formato de código de jugador: J001 */
export function formatPlayerCode(playerNumber: number): string {
  return `J${String(playerNumber).padStart(3, "0")}`;
}

/** Extrae el número de jugador de un código (J004 → 4) */
export function parsePlayerNumber(playerCode: string): number | null {
  const match = playerCode.trim().toUpperCase().match(/^J(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/** Formato de ID de cartilla: J001-C1 */
export function formatCardId(playerCode: string, cardIndex: number): string {
  return `${playerCode}-C${cardIndex}`;
}

/** Calcula hojas/jugadores a partir del total de cartillas */
export function calculateSheets(totalCards: number): {
  fullSheets: number;
  partialCardsOnLastSheet: number;
} {
  const fullSheets = Math.ceil(totalCards / 4);
  const partialCardsOnLastSheet = totalCards % 4 || 4;
  return { fullSheets, partialCardsOnLastSheet };
}
