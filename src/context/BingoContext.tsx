"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppSettings,
  BingoCard,
  CardRegistryMeta,
  GameState,
  ProgressState,
} from "@/lib/types";
import { drawRandomNumber } from "@/lib/bingo";
import { generateCardsInBatches, playersInCardBatch } from "@/lib/cards";
import { downloadPartidaBackup, readPartidaBackupFile } from "@/lib/partida-backup";
import {
  buildPartidaBackup,
  loadPartidaName,
  restorePartidaBackup,
  savePartidaName,
} from "@/lib/partida-storage";
import {
  clearAllCards,
  findCard,
  findCardsByPlayer,
  getCardCount,
  getRegistryContinuation,
  loadGameState,
  loadRegistryMeta,
  loadSettings,
  repairRegistryMeta,
  resetGameState,
  saveCardsBatch,
  saveGameState,
  saveRegistryMeta,
  saveSettings,
} from "@/lib/storage";

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

const idleProgress: ProgressState = {
  current: 0,
  total: 0,
  phase: "",
  isRunning: false,
};

interface BingoContextValue {
  game: GameState;
  settings: AppSettings;
  registryMeta: CardRegistryMeta | null;
  cardCount: number;
  progress: ProgressState;
  hydrated: boolean;
  setMaxNumbers: (n: number) => void;
  drawNumber: () => number | null;
  togglePause: () => void;
  resetGame: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  generateCards: (total: number) => Promise<void>;
  clearCards: () => Promise<void>;
  searchCard: (query: string) => Promise<BingoCard | null>;
  searchPlayerCards: (code: string) => Promise<BingoCard[]>;
  refreshStats: () => Promise<void>;
  partidaName: string;
  setPartidaName: (name: string) => void;
  exportPartidaBackup: () => Promise<void>;
  importPartidaBackup: (file: File) => Promise<void>;
}

const BingoContext = createContext<BingoContextValue | null>(null);

export function BingoProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(DEFAULT_GAME);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [registryMeta, setRegistryMeta] = useState<CardRegistryMeta | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [progress, setProgress] = useState<ProgressState>(idleProgress);
  const [hydrated, setHydrated] = useState(false);
  const [partidaName, setPartidaNameState] = useState("Mi partida");

  const persistGame = useCallback((next: GameState) => {
    setGame(next);
    saveGameState(next);
  }, []);

  const refreshStats = useCallback(async () => {
    const count = await getCardCount();
    let meta = await loadRegistryMeta();
    if (count > 0 && (!meta || meta.totalCards !== count)) {
      meta = await repairRegistryMeta(loadSettings());
    }
    setRegistryMeta(meta);
    setCardCount(count);
  }, []);

  useEffect(() => {
    setGame(loadGameState());
    setSettings(loadSettings());
    setPartidaNameState(loadPartidaName());
    void refreshStats().finally(() => setHydrated(true));
  }, [refreshStats]);

  const setPartidaName = useCallback((name: string) => {
    const trimmed = name.trim() || "Mi partida";
    setPartidaNameState(trimmed);
    savePartidaName(trimmed);
  }, []);

  const exportPartidaBackupFn = useCallback(async () => {
    const backup = await buildPartidaBackup(partidaName);
    downloadPartidaBackup(backup);
  }, [partidaName]);

  const importPartidaBackupFn = useCallback(
    async (file: File) => {
      const backup = await readPartidaBackupFile(file);
      setProgress({
        current: 0,
        total: backup.cards.length,
        phase: "Importando respaldo...",
        isRunning: true,
      });
      try {
        await restorePartidaBackup(backup, (phase, current, total) => {
          setProgress({
            current,
            total,
            phase,
            isRunning: true,
          });
        });
        setGame(backup.game);
        setSettings(backup.settings);
        setPartidaNameState(backup.partidaName);
        await refreshStats();
      } finally {
        setProgress(idleProgress);
      }
    },
    [refreshStats]
  );

  const setMaxNumbers = useCallback(
    (n: number) => {
      const next = { ...game, maxNumbers: n };
      persistGame(next);
      const s = { ...settings, maxNumbers: n };
      setSettings(s);
      saveSettings(s);
    },
    [game, settings, persistGame]
  );

  const drawNumber = useCallback(() => {
    if (game.isPaused) return null;
    const num = drawRandomNumber(game.maxNumbers, game.drawnNumbers);
    if (num === null) return null;
    const next: GameState = {
      ...game,
      drawnNumbers: [...game.drawnNumbers, num],
      lastDrawn: num,
    };
    persistGame(next);
    return num;
  }, [game, persistGame]);

  const togglePause = useCallback(() => {
    persistGame({ ...game, isPaused: !game.isPaused });
  }, [game, persistGame]);

  const resetGame = useCallback(() => {
    const next = resetGameState(game.maxNumbers);
    setGame(next);
  }, [game.maxNumbers]);

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        saveSettings(next);
        return next;
      });
      if (partial.maxNumbers !== undefined) {
        setGame((g) => {
          const next = { ...g, maxNumbers: partial.maxNumbers! };
          saveGameState(next);
          return next;
        });
      }
    },
    []
  );

  const generateCards = useCallback(
    async (total: number) => {
      const year = new Date().getFullYear();
      const continuation = await getRegistryContinuation();
      const startSerial = continuation.nextSerialIndex;
      const startPlayerNumber = continuation.maxPlayerNumber;
      const playersBefore = continuation.maxPlayerNumber;

      setProgress({
        current: 0,
        total,
        phase:
          continuation.cardCount > 0
            ? `Agregando ${total} cartillas (jugadores ${playersBefore + 1}+)...`
            : "Generando cartillas...",
        isRunning: true,
      });

      const pending: BingoCard[] = [];
      const BATCH_SAVE = 100;

      try {
        for await (const sheet of generateCardsInBatches(
          total,
          settings.cardMode,
          settings.maxNumbers,
          year,
          startSerial,
          50,
          (done, tot) => {
            setProgress({
              current: done,
              total: tot,
              phase: `Generando cartilla ${done} de ${tot}...`,
              isRunning: true,
            });
          },
          startPlayerNumber
        )) {
          pending.push(...sheet.cards);
          if (pending.length >= BATCH_SAVE) {
            await saveCardsBatch(pending.splice(0, pending.length));
          }
        }

        if (pending.length > 0) await saveCardsBatch(pending);

        const newPlayers = playersInCardBatch(total);
        const playerFrom = startPlayerNumber + 1;
        const playerTo = startPlayerNumber + newPlayers;
        const newMeta: CardRegistryMeta = {
          totalCards: continuation.cardCount + total,
          maxNumbers: settings.maxNumbers,
          mode: settings.cardMode,
          year,
          generatedAt: new Date().toISOString(),
          nextSerialIndex: startSerial + total,
          maxPlayerNumber: playerTo,
          lastBatch: {
            playerFrom,
            playerTo,
            cardCount: total,
            addedAt: new Date().toISOString(),
          },
        };
        await saveRegistryMeta(newMeta);
        await refreshStats();
      } catch (err) {
        if (err instanceof DOMException && err.name === "ConstraintError") {
          throw new Error(
            "Conflicto al guardar cartillas (códigos duplicados). Ve a Admin → «Borrar todas las cartillas» solo si quieres empezar de cero; si no, recarga la página e intenta de nuevo."
          );
        }
        throw err;
      } finally {
        setProgress(idleProgress);
      }
    },
    [settings, refreshStats]
  );

  const clearCards = useCallback(async () => {
    await clearAllCards();
    await refreshStats();
  }, [refreshStats]);

  const value = useMemo(
    () => ({
      game,
      settings,
      registryMeta,
      cardCount,
      progress,
      hydrated,
      setMaxNumbers,
      drawNumber,
      togglePause,
      resetGame,
      updateSettings,
      generateCards,
      clearCards,
      searchCard: findCard,
      searchPlayerCards: findCardsByPlayer,
      refreshStats,
      partidaName,
      setPartidaName,
      exportPartidaBackup: exportPartidaBackupFn,
      importPartidaBackup: importPartidaBackupFn,
    }),
    [
      game,
      settings,
      registryMeta,
      cardCount,
      progress,
      hydrated,
      partidaName,
      setPartidaName,
      setMaxNumbers,
      drawNumber,
      togglePause,
      resetGame,
      updateSettings,
      generateCards,
      clearCards,
      refreshStats,
      exportPartidaBackupFn,
      importPartidaBackupFn,
    ]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Cargando PUCESE Bingo...</p>
      </div>
    );
  }

  return (
    <BingoContext.Provider value={value}>{children}</BingoContext.Provider>
  );
}

export function useBingo() {
  const ctx = useContext(BingoContext);
  if (!ctx) throw new Error("useBingo debe usarse dentro de BingoProvider");
  return ctx;
}
