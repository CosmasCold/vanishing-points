// logic/eventBus.ts
import type { GameState, Place, ThemeKey, WorkspaceKey } from './gameState';
import { deriveCorruptionStage } from './gameState';

export interface EventMap {
  'dust:changed': { previous: number; current: number; delta: number };
  'corruption:threshold': {
    stage: number;
    previousStage: number;
    dust: number;
  };
  'place:unlocked': {
    slug: string;
    name: string;
    condition?: Place['unlockCondition'];
  };
  'place:visited': { slug: string; name: string };
  'code:entered': { code: string; valid: boolean; placeSlug?: string };
  'inventory:added': { item: string; source?: string };
  'theme:changed': { theme: ThemeKey; previous: ThemeKey };
  'workspace:changed': { workspace: WorkspaceKey; previous: WorkspaceKey };
  'ghost:encounter': { tier: number; message: string; source: string };
  'heartbeat': { timestamp: number; dust: number; corruptionStage: number };
  'static:burst': { intensity: number; duration: number };
  'phosphor:pulse': { intensity: number };
  'time:witching': { hour: number; minute: number };
  'keystroke': { key: string; dustAccumulated: number };
}

type EventCallback<K extends keyof EventMap> = (payload: EventMap[K]) => void;

class EventBus {
  private listeners: {
    [K in keyof EventMap]?: Set<(payload: any) => void>;
  } = {};

  on<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<K>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(callback as any);
    return () => {
      this.listeners[event]!.delete(callback as any);
    };
  }

  once<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<K>
  ): void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      callback(payload);
    });
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners[event];
    if (!set) return;
    set.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(`[EventBus] Error on ${String(event)}:`, e);
      }
    });
  }

  // Convenience emitters
  dustChanged(previous: number, current: number) {
    this.emit('dust:changed', {
      previous,
      current,
      delta: current - previous,
    });
    const prevStage = deriveCorruptionStage(previous);
    const currStage = deriveCorruptionStage(current);
    if (prevStage !== currStage) {
      this.emit('corruption:threshold', {
        stage: currStage,
        previousStage: prevStage,
        dust: current,
      });
    }
  }
}

export const eventBus = new EventBus();