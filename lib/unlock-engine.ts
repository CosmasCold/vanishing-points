// lib/unlock-engine.ts
import type { Place } from "@/types";

export interface WitnessState {
  dust: number;
  encounters: number;
  inventory: string[];
  visitedSlugs: string[];
  unlockedCodes: string[];
  readingsComplete: boolean;
  now: Date;
}

export function evaluateUnlock(
  place: Place,
  state: WitnessState
): { visible: boolean; locked: boolean; hint?: string } {
  if (place.status === "verified") return { visible: true, locked: false };
  if (place.status === "rejected") return { visible: false, locked: true };
  if (!place.unlockCondition)
    return { visible: false, locked: true, hint: "The grid refuses to resolve this signal." };

  const { type, value, message } = place.unlockCondition;

  switch (type) {
    case "dust":
      return state.dust >= (value as number)
        ? { visible: true, locked: false }
        : { visible: state.dust >= (value as number) * 0.5, locked: true, hint: message };
    case "code":
      return state.unlockedCodes.includes(String(value).toLowerCase())
        ? { visible: true, locked: false }
        : { visible: false, locked: true, hint: message };
    case "inventory":
      return state.inventory.includes(String(value).toLowerCase())
        ? { visible: true, locked: false }
        : { visible: false, locked: true, hint: message };
    case "visit":
      return state.visitedSlugs.includes(String(value))
        ? { visible: true, locked: false }
        : { visible: false, locked: true, hint: message };
    case "reading":
      return state.readingsComplete
        ? { visible: true, locked: false }
        : { visible: false, locked: true, hint: message };
    case "time": {
      const target = String(value);
      const current = `${String(state.now.getHours()).padStart(2, "0")}:${String(
        state.now.getMinutes()
      ).padStart(2, "0")}`;
      return current === target
        ? { visible: true, locked: false }
        : { visible: false, locked: true, hint: message };
    }
    default:
      return { visible: false, locked: true, hint: message };
  }
}