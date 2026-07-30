// Seeded daily code generator. Same code for everyone, rotates at midnight UTC.
// Code is available for 6 hours after generation (06:00-12:00 UTC) then vanishes.

const DAILY_CODES = [
  "FREQUENCY-X1", "DUST-9", "SEAL-77", "ECHO-41", "STATIC-88",
  "BARRIER-03", "CONTAIN-12", "WARDEN-99", "NULL-00", "SIGNAL-7",
  "GHOST-14", "MEMORY-31", "THRESHOLD-50", "ARCHIVE-66", "BREATH-03",
];

function getDailySeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
}

export function getDailyCode(): { code: string; valid: boolean; window: string } {
  const now = new Date();
  const hour = now.getUTCHours();
  const seed = getDailySeed();
  const idx = Math.floor(seededRandom(seed) * DAILY_CODES.length);
  const code = DAILY_CODES[idx];

  // Available 06:00-12:00 UTC
  const valid = hour >= 6 && hour < 12;
  const window = "06:00 — 12:00 UTC";

  return { code, valid, window };
}

export function getDailyCodeForDate(dateStr: string): string {
  const idx = Math.floor(seededRandom(dateStr) * DAILY_CODES.length);
  return DAILY_CODES[idx];
}