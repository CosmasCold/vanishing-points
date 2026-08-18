import type { ProgressionState } from '@/types/progression';
import type { ProgressionEvent } from './events';

export interface ActionResult {
  success: boolean;
  changed: boolean;
  message?: string;
  events: ProgressionEvent[];
}

export interface ProgressionActionResult extends ActionResult {
  state: ProgressionState;
}

export function investigatePlace(
  state: ProgressionState,
  placeId: string,
): ProgressionActionResult {
  if (state.investigatedPlaceIds.includes(placeId)) {
    return {
      success: true,
      changed: false,
      state,
      events: [],
    };
  }

  const nextState: ProgressionState = {
    ...state,

    dustIndex: Math.min(100, state.dustIndex + 2),

    investigatedPlaceIds: [
      ...state.investigatedPlaceIds,
      placeId,
    ],

    sessionWorkDone:
      state.sessionWorkDone + 1,

    atlasCoverage:
      state.atlasCoverage + 42.8,
  };

  return {
    success: true,
    changed: true,
    state: nextState,

    events: [
      {
        type: 'PLACE_INVESTIGATED',
        placeId,
      },
      {
        type: 'DUST_CHANGED',
        delta: 2,
      },
      {
        type: 'SESSION_WORK_CHANGED',
        delta: 1,
      },
    ],
  };
}