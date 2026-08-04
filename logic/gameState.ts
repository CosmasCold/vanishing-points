// logic/gameState.ts
import { useSyncExternalStore } from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ThemeKey =
  | 'tungsten'
  | 'amber'
  | 'green'
  | 'blue'
  | 'red'
  | 'white'
  | 'phosphor'
  | 'blood'
  | 'cyan'
  | 'ember'
  | 'abyss'
  | 'emergency';

export type WorkspaceKey =
  | 'atlas'
  | 'terminal'
  | 'archive'
  | 'evidence'
  | 'signals'
  | 'wall'
  | 'inventory';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export type PlaceCategory = 'abandoned' | 'haunted' | 'both';

export type PlaceStatus =
  | 'verified'
  | 'pending'
  | 'rejected'
  | 'sealed'
  | 'whispered'
  | 'mirage';

export interface UnlockCondition {
  type: 'dust' | 'code' | 'inventory' | 'visit' | 'reading' | 'time';
  value: string | number;
  message: string;
}

export interface Place {
  _id: string;
  name: string;
  slug: string;
  category: PlaceCategory;
  coordinates: [number, number];
  address: {
    city: string;
    country: string;
    formatted: string;
  };
  yearAbandoned?: number;
  history: string;
  hauntingReports?: string[];
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  photos: string[];
  status: PlaceStatus;
  contributor: {
    name: string;
    email: string;
  };
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  viewCount: number;
  unlockCondition?: UnlockCondition;
  connectedTo?: string[];
  resonanceNote?: string;
}

export interface GameState {
  dust: number;
  corruptionStage: number;        // 0-4, derived from dust
  legacyCorruption: number;       // 0-10, backward-compatible counter
  activeWorkspace: WorkspaceKey;
  theme: ThemeKey;
  timeOfDay: TimeOfDay;
  places: Record<string, Place>;
  visitedPlaces: string[];
  readingsCompleted: string[];
  inventory: string[];
  unlockedCodes: string[];
  expeditionLog: string[];
  otherEncounters: number;
  ghostWitnesses: number;
  terminalHistory: string[];
  lastTransmission: string | null;
  sessionStart: number;
  lastActive: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & DERIVATIONS
// ═══════════════════════════════════════════════════════════════

export const MAX_DUST = 100;

export function deriveCorruptionStage(dust: number): number {
  if (dust <= 25) return 0;
  if (dust <= 50) return 1;
  if (dust <= 75) return 2;
  if (dust <= 90) return 3;
  return 4;
}

export function deriveTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

export function evaluateUnlockCondition(
  state: GameState,
  condition: UnlockCondition
): boolean {
  switch (condition.type) {
    case 'dust':
      return state.dust >= (condition.value as number);
    case 'code': {
      const code = (condition.value as string).toUpperCase();
      return state.unlockedCodes.includes(code);
    }
    case 'inventory':
      return state.inventory.includes(condition.value as string);
    case 'visit':
      return state.visitedPlaces.includes(condition.value as string);
    case 'reading':
      if (condition.value === 'all') {
        const total = Object.keys(state.places).length;
        return total > 0 && state.readingsCompleted.length >= total;
      }
      return state.readingsCompleted.includes(condition.value as string);
    case 'time': {
      const now = new Date();
      const [h, m] = String(condition.value).split(':').map(Number);
      return now.getHours() === h && now.getMinutes() === m;
    }
    default:
      return false;
  }
}

function createInitialState(): GameState {
  return {
    dust: 0,
    corruptionStage: 0,
    legacyCorruption: 0,
    activeWorkspace: 'atlas',
    theme: 'tungsten',
    timeOfDay: deriveTimeOfDay(),
    places: {},
    visitedPlaces: [],
    readingsCompleted: [],
    inventory: [],
    unlockedCodes: [],
    expeditionLog: [],
    otherEncounters: 0,
    ghostWitnesses: 0,
    terminalHistory: [],
    lastTransmission: null,
    sessionStart: Date.now(),
    lastActive: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════
// REACTIVE STORE
// ═══════════════════════════════════════════════════════════════

class GameStateStore {
  private state: GameState;
  private listeners = new Set<(state: GameState) => void>();

  constructor() {
    this.state = createInitialState();
  }

  getState = (): GameState => this.state;

  private emit = () => {
    this.listeners.forEach((l) => l(this.state));
  };

  setState = (
    partial: Partial<GameState> | ((prev: GameState) => Partial<GameState>)
  ) => {
    const updates = typeof partial === 'function' ? partial(this.state) : partial;
    let next = { ...this.state, ...updates };

    // Derive corruption stage whenever dust changes
    if (next.dust !== this.state.dust) {
      next.dust = Math.min(Math.max(0, next.dust), MAX_DUST);
      next.corruptionStage = deriveCorruptionStage(next.dust);
    }

    this.state = next;
    this.emit();
  };

  subscribe = (listener: (state: GameState) => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  // ── Actions ──

  accumulateDust = (amount: number) => {
    this.setState((prev) => ({ dust: prev.dust + amount }));
  };

  visitPlace = (slug: string) => {
    if (this.state.visitedPlaces.includes(slug)) return;
    this.setState((prev) => ({
      visitedPlaces: [...prev.visitedPlaces, slug],
      expeditionLog: [...prev.expeditionLog, slug],
    }));
  };

  completeReading = (slug: string) => {
    if (this.state.readingsCompleted.includes(slug)) return;
    this.setState((prev) => ({
      readingsCompleted: [...prev.readingsCompleted, slug],
    }));
  };

  addInventory = (item: string) => {
    if (this.state.inventory.includes(item)) return;
    this.setState((prev) => ({
      inventory: [...prev.inventory, item],
    }));
  };

  unlockCode = (code: string) => {
    const upper = code.toUpperCase();
    if (this.state.unlockedCodes.includes(upper)) return;
    this.setState((prev) => ({
      unlockedCodes: [...prev.unlockedCodes, upper],
    }));
  };

  setTheme = (theme: ThemeKey) => this.setState({ theme });
  setWorkspace = (workspace: WorkspaceKey) => this.setState({ activeWorkspace: workspace });

  appendTerminal = (line: string) => {
    this.setState((prev) => ({
      terminalHistory: [...prev.terminalHistory, line].slice(-500),
    }));
  };

  // ── Queries ──

  checkUnlock = (slug: string): boolean => {
    const place = this.state.places[slug];
    if (!place?.unlockCondition) return true;
    return evaluateUnlockCondition(this.state, place.unlockCondition);
  };

  getVisiblePlaces = (): Place[] => {
    return Object.values(this.state.places).filter((place) => {
      if (place.status === 'verified') return true;
      if (
        place.status === 'sealed' ||
        place.status === 'whispered' ||
        place.status === 'mirage'
      ) {
        return this.checkUnlock(place.slug);
      }
      return false;
    });
  };

  getPlaceConnections = (slug: string): Place[] => {
    const place = this.state.places[slug];
    if (!place) return [];
        return (place.connectedTo || [])
      .map((s) => this.state.places[s])
      .filter(Boolean);
  };
}

export const gameState = new GameStateStore();

// ═══════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════

export function useGameState(): GameState {
  return useSyncExternalStore(gameState.subscribe, gameState.getState, gameState.getState);
}