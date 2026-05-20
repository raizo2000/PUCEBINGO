/**
 * Persistencia: localStorage (partida) e IndexedDB (cartillas).
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { parsePlayerNumber } from "./bingo";
import { parseSerialIndex } from "./serials";
import type {
  AppSettings,
  BingoCard,
  CardRegistry,
  CardRegistryMeta,
  GameState,
} from "./types";

/** Punto de continuación para agregar más jugadores al mismo juego */
export interface RegistryContinuation {
  cardCount: number;
  maxPlayerNumber: number;
  nextSerialIndex: number;
}

const GAME_KEY = "pucesebingo-game";
const SETTINGS_KEY = "pucesebingo-settings";

const DB_NAME = "pucesebingo-db";
const DB_VERSION = 1;
const CARDS_STORE = "cards";
const META_STORE = "meta";

interface BingoDB extends DBSchema {
  cards: {
    key: string;
    value: BingoCard;
    indexes: { "by-id": string; "by-player": string };
  };
  meta: {
    key: string;
    value: CardRegistryMeta;
  };
}

let dbPromise: Promise<IDBPDatabase<BingoDB>> | null = null;

function getDB(): Promise<IDBPDatabase<BingoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BingoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const cardStore = db.createObjectStore(CARDS_STORE, { keyPath: "serial" });
        cardStore.createIndex("by-id", "id", { unique: true });
        cardStore.createIndex("by-player", "playerCode");
        db.createObjectStore(META_STORE);
      },
    });
  }
  return dbPromise;
}

const DEFAULT_GAME: GameState = {
  maxNumbers: 75,
  drawnNumbers: [],
  isPaused: false,
  lastDrawn: null,
};

const DEFAULT_SETTINGS: AppSettings = {
  maxNumbers: 75,
  cardMode: "classic",
  paperSize: "letter",
  includeQr: true,
};

/** Carga estado de partida desde localStorage */
export function loadGameState(): GameState {
  if (typeof window === "undefined") return DEFAULT_GAME;
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return DEFAULT_GAME;
    return { ...DEFAULT_GAME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GAME;
  }
}

/** Guarda estado de partida en localStorage */
export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GAME_KEY, JSON.stringify(state));
}

/** Reinicia solo la partida (mantiene cartillas en IndexedDB) */
export function resetGameState(maxNumbers?: number): GameState {
  const state: GameState = {
    maxNumbers: maxNumbers ?? loadGameState().maxNumbers,
    drawnNumbers: [],
    isPaused: false,
    lastDrawn: null,
  };
  saveGameState(state);
  return state;
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Guarda cartillas en IndexedDB por lotes */
export async function saveCardsBatch(cards: BingoCard[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(CARDS_STORE, "readwrite");
  await Promise.all(cards.map((c) => tx.store.put(c)));
  await tx.done;
}

export async function saveRegistryMeta(meta: CardRegistryMeta): Promise<void> {
  const db = await getDB();
  await db.put(META_STORE, meta, "registry");
}

export async function loadRegistryMeta(): Promise<CardRegistryMeta | null> {
  const db = await getDB();
  return (await db.get(META_STORE, "registry")) ?? null;
}

/** Carga todas las cartillas (usar con moderación en lotes muy grandes) */
export async function loadAllCards(): Promise<BingoCard[]> {
  const db = await getDB();
  return db.getAll(CARDS_STORE);
}

export async function getCardCount(): Promise<number> {
  const db = await getDB();
  return db.count(CARDS_STORE);
}

/** Recorre la base y obtiene el último jugador y serial usados */
export async function scanRegistryBounds(): Promise<{
  cardCount: number;
  maxPlayerNumber: number;
  nextSerialIndex: number;
}> {
  const db = await getDB();
  let maxPlayerNumber = 0;
  let nextSerialIndex = 0;
  let cardCount = 0;

  const tx = db.transaction(CARDS_STORE, "readonly");
  let cursor = await tx.store.openCursor();
  while (cursor) {
    cardCount++;
    const card = cursor.value;
    const pn = parsePlayerNumber(card.playerCode);
    if (pn !== null && pn > maxPlayerNumber) maxPlayerNumber = pn;
    const si = parseSerialIndex(card.serial);
    if (si !== null && si > nextSerialIndex) nextSerialIndex = si;
    cursor = await cursor.continue();
  }
  await tx.done;

  return { cardCount, maxPlayerNumber, nextSerialIndex };
}

/**
 * Estado para seguir generando jugadores (ej. 2000 existentes + 1000 nuevos).
 * Usa metadatos si están sincronizados; si no, repara leyendo IndexedDB.
 */
export async function getRegistryContinuation(): Promise<RegistryContinuation> {
  const cardCount = await getCardCount();
  if (cardCount === 0) {
    return { cardCount: 0, maxPlayerNumber: 0, nextSerialIndex: 0 };
  }

  const meta = await loadRegistryMeta();
  const metaInSync =
    meta &&
    meta.totalCards === cardCount &&
    typeof meta.maxPlayerNumber === "number" &&
    meta.maxPlayerNumber >= 0 &&
    meta.nextSerialIndex >= 0 &&
    (cardCount === 0 || meta.maxPlayerNumber > 0);

  if (metaInSync) {
    return {
      cardCount,
      maxPlayerNumber: meta.maxPlayerNumber,
      nextSerialIndex: meta.nextSerialIndex,
    };
  }

  return scanRegistryBounds();
}

/** Repara metadatos si el conteo no coincide con la base */
export async function repairRegistryMeta(
  settings: Pick<AppSettings, "maxNumbers" | "cardMode">
): Promise<CardRegistryMeta | null> {
  const bounds = await scanRegistryBounds();
  if (bounds.cardCount === 0) return null;

  const existing = await loadRegistryMeta();
  const meta: CardRegistryMeta = {
    totalCards: bounds.cardCount,
    maxNumbers: existing?.maxNumbers ?? settings.maxNumbers,
    mode: existing?.mode ?? settings.cardMode,
    year: existing?.year ?? new Date().getFullYear(),
    generatedAt: existing?.generatedAt ?? new Date().toISOString(),
    nextSerialIndex: bounds.nextSerialIndex,
    maxPlayerNumber: bounds.maxPlayerNumber,
    lastBatch: existing?.lastBatch,
  };
  await saveRegistryMeta(meta);
  return meta;
}

/** Busca cartilla por serial, id o código de jugador */
export async function findCard(query: string): Promise<BingoCard | null> {
  const raw = query.trim();
  const q = raw.toUpperCase();
  const db = await getDB();

  // Serial: BG-2026-0000001 (case-insensitive)
  const serialKey = raw.replace(/^bg/i, "BG");
  let bySerial = await db.get(CARDS_STORE, serialKey);
  if (!bySerial) bySerial = await db.get(CARDS_STORE, q);
  if (bySerial) return bySerial;

  const byId = await db.getAllFromIndex(CARDS_STORE, "by-id", q);
  if (byId.length > 0) return byId[0];

  const byPlayer = await db.getAllFromIndex(CARDS_STORE, "by-player", q);
  if (byPlayer.length > 0) return byPlayer[0];

  return null;
}

/** Busca todas las cartillas de un jugador */
export async function findCardsByPlayer(playerCode: string): Promise<BingoCard[]> {
  const db = await getDB();
  return db.getAllFromIndex(CARDS_STORE, "by-player", playerCode.trim().toUpperCase());
}

/** Elimina todas las cartillas registradas */
export async function clearAllCards(): Promise<void> {
  const db = await getDB();
  await db.clear(CARDS_STORE);
  await db.delete(META_STORE, "registry");
}

/** Construye registro en memoria para exportación rápida */
export async function buildCardRegistry(): Promise<CardRegistry | null> {
  const meta = await loadRegistryMeta();
  if (!meta) return null;
  const cards = await loadAllCards();
  const cardsBySerial: Record<string, BingoCard> = {};
  const cardsById: Record<string, BingoCard> = {};
  for (const c of cards) {
    cardsBySerial[c.serial] = c;
    cardsById[c.id] = c;
  }
  return { cardsBySerial, cardsById, meta };
}
