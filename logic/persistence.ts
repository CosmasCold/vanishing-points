// logic/persistence.ts
import { gameState, type GameState, type ThemeKey } from './gameState';

const STORAGE_KEY = 'vp-game-state';
const CURRENT_VERSION = 1;

interface PersistedState {
  version: number;
  dust: number;
  theme: ThemeKey;
  visitedPlaces: string[];
  readingsCompleted: string[];
  inventory: string[];
  unlockedCodes: string[];
  expeditionLog: string[];
  otherEncounters: number;
  ghostWitnesses: number;
  terminalHistory: string[];
  sessionStart: number;
  lastActive: number;
}

function serialize(state: GameState): PersistedState {
  return {
    version: CURRENT_VERSION,
    dust: state.dust,
    theme: state.theme,
    visitedPlaces: state.visitedPlaces,
    readingsCompleted: state.readingsCompleted,
    inventory: state.inventory,
    unlockedCodes: state.unlockedCodes,
    expeditionLog: state.expeditionLog,
    otherEncounters: state.otherEncounters,
    ghostWitnesses: state.ghostWitnesses,
    terminalHistory: state.terminalHistory,
    sessionStart: state.sessionStart,
    lastActive: Date.now(),
  };
}

function migrate(data: unknown): PersistedState | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  // Version 0 -> 1
  if (!('version' in d)) {
    return {
      version: 1,
      dust: (d.dust as number) ?? 0,
      theme: (d.theme as ThemeKey) ?? 'tungsten',
      visitedPlaces: (d.visitedPlaces as string[]) ?? [],
      readingsCompleted: (d.readingsCompleted as string[]) ?? [],
      inventory: (d.inventory as string[]) ?? [],
      unlockedCodes: (d.unlockedCodes as string[]) ?? [],
      expeditionLog: (d.expeditionLog as string[]) ?? [],
      otherEncounters: (d.otherEncounters as number) ?? 0,
      ghostWitnesses: (d.ghostWitnesses as number) ?? 0,
      terminalHistory: (d.terminalHistory as string[]) ?? [],
      sessionStart: (d.sessionStart as number) ?? Date.now(),
      lastActive: Date.now(),
    };
  }

  if (d.version === CURRENT_VERSION) return d as unknown as PersistedState;
  return null;
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(state)));
  } catch (e) {
    console.error('[Persistence] Save failed:', e);
  }
}

export function loadGameState(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const migrated = migrate(data);
    if (!migrated) return null;

    return {
      dust: migrated.dust,
      theme: migrated.theme,
      visitedPlaces: migrated.visitedPlaces,
      readingsCompleted: migrated.readingsCompleted,
      inventory: migrated.inventory,
      unlockedCodes: migrated.unlockedCodes,
      expeditionLog: migrated.expeditionLog,
      otherEncounters: migrated.otherEncounters,
      ghostWitnesses: migrated.ghostWitnesses,
      terminalHistory: migrated.terminalHistory,
      sessionStart: migrated.sessionStart,
      lastActive: migrated.lastActive,
    };
  } catch (e) {
    console.error('[Persistence] Load failed:', e);
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function initPersistence(): () => void {
  let timeout: ReturnType<typeof setTimeout>;

  const unsubscribe = gameState.subscribe((state) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => saveGameState(state), 500);
  });

  // Hydrate on init
  const saved = loadGameState();
  if (saved) {
    gameState.setState(saved);
  }

  return () => {
    unsubscribe();
    clearTimeout(timeout);
  };
}