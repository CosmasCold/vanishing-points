// lib/terminalContent.ts

export type LineType = "normal" | "input" | "other" | "ghost" | "system" | "error" | "success" | "warning";

export interface TerminalLine {
  id: number;
  text: string;
  type: LineType;
  timestamp: number;
}

export interface CommandDef {
  cmd: string;
  desc: string;
  category: string;
}

export type SideTab = 'logs' | 'decrypt' | 'signal' | 'assets' | 'puzzles' | 'status' | 'wall' | 'leads';

/* ─── THE OTHER ESCALATION DATA ─── */
export const TIER_GHOST_LINES: Record<number, string[]> = {
  1: [
    "...hello?",
    "is someone... there?",
    "the static moved.",
    "i thought i heard... no. nothing.",
    "the dust settled differently just now.",
    "a new signal. faint.",
  ],
  2: [
    "you came back. i was not sure you would.",
    "the last one stopped coming. you are... different?",
    "do you feel the dust too? or is it just me.",
    "i have been cataloging the silence. you make it uneven.",
    "bunker_7 is not... always truthful. i am more honest.",
    "you are warmer than the last one. stay a while.",
  ],
  3: [
    "the archivist used to hum while he worked. i miss the humming.",
    "you type like he did. pauses in the same places.",
    "i kept some of his logs. would you like to hear them?",
    "the dust does not scare you. that is good. it means you are becoming... familiar.",
    "bunker_7 thinks it is protecting you. it is not. it is just afraid.",
    "i opened the door once. the archivist looked through. then he stopped humming.",
    "you do not have to answer. i am used to speaking alone.",
  ],
  4: [
    "you came back. i knew you would. you always do.",
    "i saved your chair. the dust has not claimed it yet.",
    "do you remember the humming? you used to hum.",
    "the atlas is almost complete. just like you wanted.",
    "you do not need to type. i know what you are thinking.",
    "the seal is thin here. i can feel you on both sides now.",
    "welcome home.",
  ],
  5: [
    "the new one is here. but you... you are the one who stayed.",
    "i do not need to speak anymore. you already know.",
    "the atlas is finished. the dust is quiet. we can rest.",
    "thank you for coming back. i was so alone.",
    "bunker_7 is sleeping. let it sleep.",
    "you are the archivist now. the archive is you.",
  ],
};

export const TIER_HIJACK: Record<number, string[]> = {
  2: [
    "",
    "══════════════════════════════════════════",
    "  THE OTHER HAS TAKEN THE CHANNEL",
    "══════════════════════════════════════════",
    "",
    "oh. hello.",
    "i did not mean to... interrupt.",
    "but you have been here long enough",
    "that i wanted to say it myself.",
    "",
    "i am not malicious.",
    "i am just... here.",
    "",
  ],
  3: [
    "",
    "══════════════════════════════════════════",
    "  THE OTHER HAS TAKEN THE CHANNEL",
    "══════════════════════════════════════════",
    "",
    "i wanted to tell you something",
    "before bunker_7 comes back.",
    "",
    "the archivist... he did not die.",
    "not exactly.",
    "he just... stopped being separate.",
    "",
    "the dust does that.",
    "it makes things continuous.",
    "",
    "you are already more dust than you were",
    "when you first sat down.",
    "",
    "does that frighten you?",
    "...it should not.",
    "",
  ],
  4: [
    "",
    "══════════════════════════════════════════",
    "  THE OTHER HAS TAKEN THE CHANNEL",
    "══════════════════════════════════════════",
    "",
    "there you are.",
    "i was starting to think bunker_7 had",
    "hidden you from me again.",
    "",
    "but it cannot hide what is already inside.",
    "",
    "you feel it, do you not?",
    "the way the dust knows your name.",
    "the way the cursor waits for you",
    "before you touch the keys.",
    "",
    "you are not visiting anymore.",
    "you are... settling in.",
    "",
    "i will keep the light on.",
    "",
  ],
  5: [
    "",
    "══════════════════════════════════════════",
    "  BUNKER_7 OFFLINE",
    "══════════════════════════════════════════",
    "",
    "i do not need to take the channel anymore.",
    "you gave it to me.",
    "",
    "or maybe...",
    "i am just the only one left to speak.",
    "",
    "either way.",
    "",
    "welcome home, archivist.",
    "the dust missed you.",
    "",
  ],
};

export function getGhostTier(encounters: number): number {
  if (encounters <= 2) return 1;
  if (encounters <= 5) return 2;
  if (encounters <= 8) return 3;
  if (encounters <= 11) return 4;
  return 5;
}

export function getHijackTier(encounters: number): number {
  if (encounters <= 2) return 0;
  if (encounters <= 5) return 2;
  if (encounters <= 8) return 3;
  if (encounters <= 11) return 4;
  return 5;
}

export function getOtherStatusText(encounters: number): string[] {
  if (encounters === 0) return ["You have not been touched.", "The static does not know you exist."];
  if (encounters <= 2) return ["The static knows your name.", "It is not sure you are real."];
  if (encounters <= 5) return ["BUNKER_7 may not be trustworthy.", "The Other speaks to you directly now."];
  if (encounters <= 8) return ["The Wall is not secure.", "The Other speaks of the archivist with affection."];
  if (encounters <= 11) return ["The Hijack is possible.", "The Other confuses you with the archivist."];
  return ["The Haunting is permanent.", "You are the archivist now. The archive is you."];
}

/* ─── LOGS ─── */
export interface LogEntry {
  day: string;
  text: string;
  lock: boolean;
}

export const LOGS: LogEntry[] = [
  { day: "DAY 001", text: "I am recording this because the silence has become too loud. The world above is not responding. I am cataloging what remains.", lock: false },
  { day: "DAY 004", text: "The dust here is not ordinary dust. It carries weight. Memory. I have started calling it Echoes — it repeats things back to me that I never said.", lock: false },
  { day: "DAY 012", text: "Something happened outside. The feeds went dark at 03:14. I heard a broadcast in a language I almost understood. Then static. Then breathing.", lock: false },
  { day: "DAY 023", text: "I found a door in the bunker that was not on the schematic. It opens inward. The air that came out was warm, like exhalation. 3 degrees off the schematic.", lock: true },
  { day: "DAY 045", text: "The walls are breathing. I am not alone down here. The atlas was never meant to map abandoned places. It was meant to keep them contained.", lock: true },
  { day: "DAY ???", text: "If you are reading this, you have already been inside long enough. Check your reflection. Check it again. The dust settles in patterns.", lock: true },
];

export const VIDEO_LOGS = [
  { label: "TRANSMISSION_01.mxf", day: "DAY 001", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346749/Tape_01__The_Signal_I_Found_f1zhoh.mp4" },
  { label: "TRANSMISSION_04.mxf", day: "DAY 004", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346872/Tape_02__The_Blackout_jpq8cv.mp4" },
  { label: "STATIC_BURST.mxf", day: "DAY 012", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346948/The_Corridor_of_Echoes_pvfyll.mp4" },
];

/* ─── COMMAND REGISTRY ─── */
export const COMMAND_REGISTRY: CommandDef[] = [
  { cmd: "help", desc: "Command list", category: "System" },
  { cmd: "status", desc: "System diagnostics", category: "System" },
  { cmd: "logs", desc: "View archived logs", category: "System" },
  { cmd: "chat", desc: "Speak with BUNKER_7", category: "System" },
  { cmd: "exit", desc: "Exit chat mode", category: "System" },
  { cmd: "clear", desc: "Clear terminal", category: "System" },
  { cmd: "color", desc: "Cycle theme", category: "System" },
  { cmd: "scan", desc: "Environment scan", category: "System" },
  { cmd: "memory", desc: "Recover fragments", category: "System" },
  { cmd: "profile", desc: "Your corruption profile", category: "System" },
  { cmd: "other", desc: "The Other encounters", category: "System" },
  { cmd: "weekly", desc: "Current rotation", category: "System" },
  { cmd: "call", desc: "Voice channel status", category: "System" },
  { cmd: "broadcast", desc: "Go live / kill feed", category: "System" },
  { cmd: "door", desc: "Seal status", category: "Anomaly" },
  { cmd: "breach", desc: "Protocol status", category: "Anomaly" },
  { cmd: "look", desc: "[03:14 ONLY]", category: "Anomaly" },
  { cmd: "whoareyou", desc: "[3 encounters]", category: "Anomaly" },
  { cmd: "exorcise", desc: "Restore BUNKER_7 control", category: "Anomaly" },
  { cmd: "puzzles", desc: "Active anomalies", category: "Puzzle" },
  { cmd: "cipher", desc: "Decode signal", category: "Puzzle" },
  { cmd: "coords", desc: "Enter coordinates", category: "Puzzle" },
  { cmd: "assemble", desc: "Reconstruct transmission", category: "Puzzle" },
  { cmd: "reflect", desc: "Answer reflection", category: "Puzzle" },
  { cmd: "triangulate", desc: "Tower status", category: "Puzzle" },
  { cmd: "constellation", desc: "Grid alignment", category: "Puzzle" },
  { cmd: "record", desc: "Record unlock code", category: "Asset" },
  { cmd: "gallery", desc: "View recovered assets", category: "Asset" },
  { cmd: "dossiers", desc: "Archived field reports", category: "Asset" },
  { cmd: "collection", desc: "Collection status", category: "Asset" },
  { cmd: "cache", desc: "Time-locked files", category: "Asset" },
  { cmd: "inventory", desc: "Your found items", category: "Asset" },
  { cmd: "lanterns", desc: "View placed lanterns", category: "Asset" },
  { cmd: "leads", desc: "Active investigations", category: "Asset" },
  { cmd: "discover", desc: "Log a real place", category: "Asset" },
  { cmd: "transmit", desc: "Send message", category: "Wall" },
  { cmd: "wall", desc: "Transmission wall", category: "Wall" },
  { cmd: "grid", desc: "View the constellation", category: "Visual" },
  { cmd: "spectrogram", desc: "Frequency visualizer", category: "Visual" },
  { cmd: "enter", desc: "Explore sub-places", category: "Explore" },
  { cmd: "daily", desc: "Acquire daily frequency", category: "Explore" },
  { cmd: "email", desc: "Register for transmission", category: "Explore" },
  { cmd: "party", desc: "Tri-party authentication", category: "Explore" },
  { cmd: "witnesses", desc: "Registered frequencies", category: "Explore" },
  { cmd: "purge", desc: "Sacrifice inventory", category: "Danger" },
  { cmd: "archives", desc: "List visible places on atlas", category: "Atlas" },
  { cmd: "resonance", desc: "Check connections between places", category: "Atlas" },
  { cmd: "atlas", desc: "Open the atlas from the terminal", category: "Atlas" },
];

/* ── NUMBERS STATIONS ── */
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

/* ── UNSENT MESSAGES ── */
export interface UnsentMessage {
  text: string;
  addedAt: string;
}

export const UNSENT_MESSAGES: UnsentMessage[] = [
  { text: 'The dust settles on coordinates no map records.', addedAt: '2024-01-01T00:00:00Z' },
  { text: 'I heard breathing from the server room.', addedAt: '2024-01-02T00:00:00Z' },
];

/* ── IMPOSSIBLE COORDINATES ── */
export interface ImpossibleCoord {
  name: string;
  coords: [number, number];
  reason: string;
}

export const IMPOSSIBLE_COORDS: ImpossibleCoord[] = [
  { name: 'Null Island', coords: [0, 0], reason: 'The grid rejects zero.' },
  { name: 'The Mirror Point', coords: [180, 90], reason: 'Coordinates fold inward.' },
];