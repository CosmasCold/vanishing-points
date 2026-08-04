// lib/echoesContent.ts

export interface SignalDossier {
  title: string;
  text: string;
}

export const SIGNAL_DOSSIERS: Record<string, SignalDossier> = {
  'duga-radar-array': {
    title: 'Intercepted: THE HUM',
    text: `BUNKER_7 ANALYSIS — The Woodpecker pulse does not match Soviet OTHR signatures. Frequency drift suggests an internal clock rather than an external detection sweep. The "countdown" theory is unconfirmed, but the arithmetic is disturbing. The array stopped in 1989. The count, if it existed, was interrupted, not concluded.`,
  },
  'hashima-island': {
    title: 'Intercepted: THE COUNTING HOUSE',
    text: `BUNKER_7 ANALYSIS — The numbers station broadcasting from Hashima coordinates uses a voice model not developed until 2011. The count is backward. The numbers have not been invented yet because they are counting down to a date, not up from zero. Current estimate: 5,000 days remain.`,
  },
  'aokigahara-forest': {
    title: 'Intercepted: LOST EXPEDITION',
    text: `BUNKER_7 ANALYSIS — Expedition Team 4's black box contains 7 hours of audio after the last confirmed human voice. The seventh voice speaks Japanese with a dialect last used in the Edo period. It is giving directions deeper into the forest.`,
  },
  'poveglia-island': {
    title: 'Intercepted: STATIC VEIL',
    text: `BUNKER_7 ANALYSIS — The static between stations is not empty. Spectral analysis reveals ordered data in the 19 Hz range — the frequency of human eyeball resonance. The static is not noise. It is trying to be seen.`,
  },
};

export function getSignalDossier(slug: string): SignalDossier | undefined {
  return SIGNAL_DOSSIERS[slug];
}

export interface UnsentMessage {
  text: string;
  addedAt: string;
}

export const UNSENT_MESSAGES: UnsentMessage[] = [
  { text: 'The dust settles on coordinates no map records.', addedAt: '2024-01-01T00:00:00Z' },
  { text: 'I heard breathing from the server room.', addedAt: '2024-01-02T00:00:00Z' },
];

export interface NumbersStation {
  code: string;
  label: string;
}

export const NUMBERS_STATIONS: NumbersStation[] = [
  { code: 'ECHO-7', label: 'Station 7' },
  { code: 'BUNKER-1', label: 'Primary Relay' },
  { code: 'STATIC-9', label: 'Ghost Frequency' },
  { code: 'ARCHIVE-0', label: 'The Origin' },
];

export interface ImpossibleCoord {
  name: string;
  coords: string;
  reason: string;
}

export const IMPOSSIBLE_COORDS: ImpossibleCoord[] = [
  { name: 'Null Island', coords: '0,0', reason: 'The grid rejects zero.' },
  { name: 'The Mirror Point', coords: '180,90', reason: 'Coordinates fold inward.' },
];