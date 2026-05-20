/**
 * Generación de seriales únicos para cartillas.
 * Formato: BG-{año}-{7 dígitos}
 */

const SERIAL_PREFIX = "BG";

/** Genera serial a partir del índice secuencial (1-based) */
export function formatSerial(year: number, index: number): string {
  return `${SERIAL_PREFIX}-${year}-${String(index).padStart(7, "0")}`;
}

/** Extrae el índice numérico de un serial válido */
export function parseSerialIndex(serial: string): number | null {
  const match = serial.match(/^BG-\d{4}-(\d{7})$/i);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/** Valida formato de serial */
export function isValidSerialFormat(serial: string): boolean {
  return /^BG-\d{4}-\d{7}$/i.test(serial.trim());
}
