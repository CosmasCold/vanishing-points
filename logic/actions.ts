// logic/actions.ts
import { gameState } from './gameState';
import { eventBus } from './eventBus';
import type { ThemeKey, WorkspaceKey } from './gameState';

export function accumulateDust(amount: number) {
  const prev = gameState.getState().dust;
  gameState.accumulateDust(amount);
  const curr = gameState.getState().dust;
  eventBus.dustChanged(prev, curr);
}

export function burnDust(amount: number) {
  const prev = gameState.getState().dust;
  const next = Math.max(0, prev - amount);
  gameState.setState({ dust: next });
  eventBus.dustChanged(prev, next);
}

export function visitPlace(slug: string) {
  const place = gameState.getState().places[slug];
  if (!place || gameState.getState().visitedPlaces.includes(slug)) return;

  gameState.visitPlace(slug);
  eventBus.emit('place:visited', { slug, name: place.name });

  // Check if this visit unlocks connected places
  Object.values(gameState.getState().places).forEach((p) => {
    if (
      p.unlockCondition?.type === 'visit' &&
      p.unlockCondition.value === slug &&
      !gameState.checkUnlock(p.slug)
    ) {
      // Re-evaluate will now pass; emit unlock
      eventBus.emit('place:unlocked', {
        slug: p.slug,
        name: p.name,
        condition: p.unlockCondition,
      });
    }
  });
}

export function completeReading(slug: string) {
  gameState.completeReading(slug);
}

export function addInventory(item: string, source?: string) {
  const prev = gameState.getState().inventory;
  gameState.addInventory(item);
  if (!prev.includes(item)) {
    eventBus.emit('inventory:added', { item, source });
  }
}

export function unlockCode(code: string) {
  const upper = code.toUpperCase();
  const prev = gameState.getState().unlockedCodes;
  gameState.unlockCode(upper);

  if (!prev.includes(upper)) {
    // Check if this code unlocks any place
    const unlockedPlace = Object.values(gameState.getState().places).find(
      (p) =>
        p.unlockCondition?.type === 'code' &&
        String(p.unlockCondition.value).toUpperCase() === upper
    );

    eventBus.emit('code:entered', {
      code: upper,
      valid: !!unlockedPlace,
      placeSlug: unlockedPlace?.slug,
    });

    if (unlockedPlace) {
      eventBus.emit('place:unlocked', {
        slug: unlockedPlace.slug,
        name: unlockedPlace.name,
        condition: unlockedPlace.unlockCondition,
      });
    }
  }
}

export function setTheme(theme: ThemeKey) {
  const prev = gameState.getState().theme;
  if (prev === theme) return;
  gameState.setTheme(theme);
  eventBus.emit('theme:changed', { theme, previous: prev });
}

export function setWorkspace(workspace: WorkspaceKey) {
  const prev = gameState.getState().activeWorkspace;
  if (prev === workspace) return;
  gameState.setWorkspace(workspace);
  eventBus.emit('workspace:changed', { workspace, previous: prev });
}

export function appendTerminal(line: string) {
  gameState.appendTerminal(line);
}