/**
 * Exportación PDF por lotes con jsPDF.
 * Una página = 1 jugador con hasta 4 cartillas.
 */

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { BingoCard, CellValue, PaperSize, PlayerSheet } from "./types";
import { BINGO_LETTERS, CENTER_CELL_LABEL, isCenterCell } from "./bingo";
import {
  loadPdfLogoDataUrl,
  PDF_LOGO_ASPECT,
  PDF_SHEET_MOTTO,
} from "./pdf-branding";

const PAGE_SIZES: Record<PaperSize, { w: number; h: number }> = {
  letter: { w: 215.9, h: 279.4 },
  a4: { w: 210, h: 297 },
};

const MARGIN = 10;
const PAGE_HEADER_H = 22;
const HEADER_GAP = 3;
const LOGO_DISPLAY_W = 26;
const CARD_HEADER_H = 9;
const QR_SIZE = 6.5;

async function qrDataUrl(text: string, size = 20): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size * 4,
    margin: 0,
    errorCorrectionLevel: "M",
  });
}

function drawCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  value: CellValue,
  fontSize: number
) {
  // Cell background: Solid white
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, "F");

  // Cell border: Sleek bright blue matching the theme
  doc.setDrawColor(27, 96, 236);
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h, "S");

  if (isCenterCell(value)) {
    // Center cell label (e.g. "PUCESE") in bright blue and bold like the ".es" in the reference image
    doc.setFontSize(Math.min(10, Math.max(7, fontSize * 0.45)));
    doc.setTextColor(27, 96, 236);
    doc.setFont("helvetica", "bold");
    doc.text(CENTER_CELL_LABEL, x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    return;
  }

  if (value === null) return;

  // Number: Very large, black, bold
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(String(value), x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setFont("helvetica", "normal");
}

function drawSingleCard(
  doc: jsPDF,
  card: BingoCard,
  x: number,
  y: number,
  cardW: number,
  cardH: number,
  qrUrl?: string
) {
  // Vibrant Blue theme color (RGB: 27, 96, 236 - Beautiful Premium Blue)
  const themeBlue = { r: 27, g: 96, b: 236 };

  // Draw card background (The outer blue frame)
  doc.setFillColor(themeBlue.r, themeBlue.g, themeBlue.b);
  doc.rect(x, y, cardW, cardH, "F");

  // Layout Paddings matching the proportion of the reference image
  const cardPaddingX = 2.5;
  const cardPaddingTop = 11;     // Pristine space for logo/BINGO letters (reduced since ID/Serial/QR moved)
  const cardPaddingBottom = 9.5; // Taller footer to fit QR Code and the table ID/Serial box elegantly
  
  const gridX = x + cardPaddingX;
  const gridTop = y + cardPaddingTop;
  const gridW = cardW - 2 * cardPaddingX;
  const gridH = cardH - cardPaddingTop - cardPaddingBottom;

  const cols = 5;
  const rows = 5;
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  // 1. Draw BINGO letters at the top header in white, bold, and large - completely uncluttered!
  if (card.mode === "classic") {
    const bingoFontSize = Math.min(18, Math.max(12, cardPaddingTop * 0.9));
    doc.setFontSize(bingoFontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255); // White

    for (let c = 0; c < 5; c++) {
      // Center each letter perfectly above its corresponding column
      const letterX = gridX + c * cellW + cellW / 2;
      const letterY = y + cardPaddingTop / 2; // Centered vertically in top area
      doc.text(BINGO_LETTERS[c], letterX, letterY, {
        align: "center",
        baseline: "middle",
      });
    }
    doc.setFont("helvetica", "normal");
  }

  // 2. Draw the 5x5 Grid Cells with numbers
  const numberFontSize = Math.min(26, Math.max(16, cellH * 1.25));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 5; c++) {
      drawCell(
        doc,
        gridX + c * cellW,
        gridTop + r * cellH,
        cellW,
        cellH,
        card.grid[r][c],
        numberFontSize
      );
    }
  }

  // 3. Draw Footer elements elegantly without overlapping BINGO letters

  // A. QR Code (on the bottom left)
  const qrSize = 7.0;
  const hasQr = !!qrUrl;
  const qrX = gridX + 0.5;
  const qrY = y + cardH - cardPaddingBottom + (cardPaddingBottom - qrSize) / 2;

  if (hasQr && qrUrl) {
    // White background box for QR to guarantee high contrast and instant scans
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX - 0.3, qrY - 0.3, qrSize + 0.6, qrSize + 0.6, "F");
    doc.addImage(qrUrl, "PNG", qrX, qrY, qrSize, qrSize);
  }

  // B. Left side website URL / Branding (placed beautifully next to the QR code if present)
  const urlX = hasQr ? (qrX + qrSize + 2.2) : (gridX + 0.5);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("www.pucesebingo.com", urlX, y + cardH - cardPaddingBottom / 2, {
    align: "left",
    baseline: "middle",
  });

  // C. Right side white rectangle for ID & Serial
  const rectW = 32;
  const rectH = 7.0;
  const rectX = x + cardW - rectW - cardPaddingX - 0.5;
  const rectY = y + cardH - rectH - (cardPaddingBottom - rectH) / 2;

  // Draw the white info box
  doc.setFillColor(255, 255, 255);
  doc.rect(rectX, rectY, rectW, rectH, "F");

  // Tabla # [card.id] (Line 1, bold black)
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Tabla # ${card.id}`, rectX + rectW / 2, rectY + 2.2, {
    align: "center",
    baseline: "middle",
  });

  // Serial Number S/N (Line 2, neat dark-gray subtext)
  doc.setFontSize(4.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`S/N: ${card.serial}`, rectX + rectW / 2, rectY + 4.9, {
    align: "center",
    baseline: "middle",
  });

  // Restore defaults for future pages
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
}

function drawPageHeader(
  doc: jsPDF,
  sheet: PlayerSheet,
  pageW: number,
  logoDataUrl: string | null
) {
  const headerTop = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Jugador #${String(sheet.playerNumber).padStart(3, "0")}`, MARGIN, headerTop + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Código: ${sheet.playerCode}`, MARGIN, headerTop + 12);

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(PDF_SHEET_MOTTO, pageW / 2, headerTop + 8, { align: "center" });

  if (logoDataUrl) {
    const logoH = LOGO_DISPLAY_W * PDF_LOGO_ASPECT;
    const logoX = pageW - MARGIN - LOGO_DISPLAY_W;
    doc.addImage(logoDataUrl, "PNG", logoX, headerTop, LOGO_DISPLAY_W, logoH);
  }
}

function drawPlayerPage(
  doc: jsPDF,
  sheet: PlayerSheet,
  pageW: number,
  pageH: number,
  qrMap: Map<string, string>,
  logoDataUrl: string | null
) {
  const contentW = pageW - MARGIN * 2;
  const contentH = pageH - MARGIN * 2;

  drawPageHeader(doc, sheet, pageW, logoDataUrl);

  const cols = 2;
  const rows = 2;
  const gap = 4;
  const cardW = (contentW - gap) / cols;
  const cardsTop = MARGIN + PAGE_HEADER_H + HEADER_GAP;
  const cardH = (contentH - PAGE_HEADER_H - HEADER_GAP - gap) / rows;

  for (let i = 0; i < 4; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = MARGIN + col * (cardW + gap);
    const cy = cardsTop + row * (cardH + gap);
    const card = sheet.cards[i];
    if (card) {
      drawSingleCard(doc, card, cx, cy, cardW, cardH, qrMap.get(card.serial));
    } else {
      doc.setDrawColor(200);
      doc.setFontSize(8);
      doc.setTextColor(180);
      doc.rect(cx, cy, cardW, cardH);
      doc.text("—", cx + cardW / 2, cy + cardH / 2, { align: "center" });
      doc.setTextColor(0);
    }
  }
}

export interface PdfExportOptions {
  paperSize: PaperSize;
  includeQr: boolean;
  batchSize?: number;
  onProgress?: (current: number, total: number, phase: string) => void;
}

/**
 * Genera PDF completo procesando hojas por lotes.
 */
export async function exportSheetsToPdf(
  sheets: PlayerSheet[],
  options: PdfExportOptions
): Promise<Blob> {
  const { w, h } = PAGE_SIZES[options.paperSize];
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: options.paperSize === "letter" ? "letter" : "a4",
  });

  const total = sheets.length;
  const batchSize = options.batchSize ?? 25;
  const qrMap = new Map<string, string>();

  options.onProgress?.(0, total, "Cargando logo...");
  const logoDataUrl = await loadPdfLogoDataUrl();

  options.onProgress?.(0, total, "Preparando códigos QR...");

  if (options.includeQr) {
    let qrDone = 0;
    const allCards = sheets.flatMap((s) => s.cards);
    for (let i = 0; i < allCards.length; i += batchSize) {
      const batch = allCards.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (card) => {
          const url = await qrDataUrl(
            JSON.stringify({ s: card.serial, id: card.id, p: card.playerCode })
          );
          qrMap.set(card.serial, url);
        })
      );
      qrDone += batch.length;
      options.onProgress?.(
        Math.floor((qrDone / allCards.length) * 30),
        100,
        "Generando códigos QR..."
      );
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  for (let i = 0; i < sheets.length; i++) {
    if (i > 0) doc.addPage();
    drawPlayerPage(doc, sheets[i], w, h, qrMap, logoDataUrl);

    if ((i + 1) % batchSize === 0 || i === sheets.length - 1) {
      const pct = 30 + Math.floor(((i + 1) / total) * 70);
      options.onProgress?.(pct, 100, `Generando página ${i + 1} de ${total}...`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  options.onProgress?.(100, 100, "PDF listo");
  return doc.output("blob");
}

/** Descarga blob como archivo */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface LoadSheetsForPdfOptions {
  /** Solo jugadores con número >= playerFrom (inclusive) */
  playerFrom?: number;
  /** Solo jugadores con número <= playerTo (inclusive) */
  playerTo?: number;
  onProgress?: (current: number, total: number) => void;
}

/** Carga hojas desde IndexedDB en lotes para PDF sin saturar memoria */
export async function loadSheetsForPdf(
  options?: LoadSheetsForPdfOptions | ((current: number, total: number) => void)
): Promise<PlayerSheet[]> {
  const opts: LoadSheetsForPdfOptions =
    typeof options === "function" ? { onProgress: options } : (options ?? {});

  const { loadAllCards } = await import("./storage");
  const { parsePlayerNumber } = await import("./bingo");
  const cards = await loadAllCards();
  const byPlayer = new Map<string, BingoCard[]>();

  cards.forEach((card, i) => {
    if (!byPlayer.has(card.playerCode)) byPlayer.set(card.playerCode, []);
    byPlayer.get(card.playerCode)!.push(card);
    if ((i + 1) % 200 === 0) {
      opts.onProgress?.(i + 1, cards.length);
    }
  });

  const sheets: PlayerSheet[] = [];

  for (const [playerCode, playerCards] of byPlayer.entries()) {
    playerCards.sort((a, b) => a.cardIndex - b.cardIndex);
    const playerNumber = parsePlayerNumber(playerCode) ?? 0;
    if (opts.playerFrom != null && playerNumber < opts.playerFrom) continue;
    if (opts.playerTo != null && playerNumber > opts.playerTo) continue;

    sheets.push({
      playerNumber: playerNumber || sheets.length + 1,
      playerCode,
      cards: playerCards,
    });
  }

  sheets.sort((a, b) => a.playerNumber - b.playerNumber);
  return sheets;
}
