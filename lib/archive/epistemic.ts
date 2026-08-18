export const EPISTEMIC_STATES = {
  unknown: { label: 'UNKNOWN', tone: 'neutral' },
  suspected: { label: 'SUSPECTED', tone: 'amber' },
  known: { label: 'KNOWN', tone: 'documentary' },
  contradicted: { label: 'CONTRADICTED', tone: 'red' },
  confirmed: { label: 'CONFIRMED', tone: 'brass' },
  disproven: { label: 'DISPROVEN', tone: 'muted' },
} as const;

export type EpistemicState = keyof typeof EPISTEMIC_STATES;
