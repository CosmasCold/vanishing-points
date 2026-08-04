// lib/terminalThemes.ts
import type { ThemeKey } from '@/logic/gameState';

export interface TerminalTheme {
  primary: string;
  bg: string;
  glow: string;
  accent: string;
  dim: string;
  cursor: string;
  phosphor: string;
  corruption: string;
  danger: string;
  surface: string;
  border: string;
}

export const THEMES: Record<ThemeKey, TerminalTheme> = {
  tungsten: {
    primary: "#ddd0bc", bg: "#0c0a08", glow: "rgba(221,208,188,0.1)",
    accent: "#9a8a72", dim: "#5a4e42", cursor: "#ddd0bc",
    phosphor: "#e8dcc8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#1a1612",
    border: "rgba(154,138,114,0.12)",
  },
  amber: {
    primary: "#e8d5c0", bg: "#0c0a08", glow: "rgba(232,213,192,0.12)",
    accent: "#c4a882", dim: "#6a5a4a", cursor: "#e8d5c0",
    phosphor: "#f0e0d0", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#1a1612",
    border: "rgba(154,138,114,0.12)",
  },
  green: {
    primary: "#b8d8a8", bg: "#050805", glow: "rgba(184,216,168,0.1)",
    accent: "#6a9a5a", dim: "#4a6a3a", cursor: "#b8d8a8",
    phosphor: "#c8e8b8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#0a1208",
    border: "rgba(184,216,168,0.08)",
  },
  blue: {
    primary: "#88a8c0", bg: "#020508", glow: "rgba(136,168,192,0.12)",
    accent: "#5e7a9c", dim: "#4a5a6a", cursor: "#88a8c0",
    phosphor: "#a0c0d8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#080c12",
    border: "rgba(136,168,192,0.08)",
  },
  red: {
    primary: "#ff8a7a", bg: "#1a0806", glow: "rgba(255,138,122,0.1)",
    accent: "#e06050", dim: "#9a4a3a", cursor: "#ff8a7a",
    phosphor: "#ffb0a0", corruption: "#c4785a", danger: "#c02010",
    surface: "#1a0c08",
    border: "rgba(255,138,122,0.12)",
  },
  white: {
    primary: "#d0d0d0", bg: "#0a0a0a", glow: "rgba(208,208,208,0.1)",
    accent: "#a0a0a0", dim: "#707070", cursor: "#d0d0d0",
    phosphor: "#e0e0e0", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#141414",
    border: "rgba(160,160,160,0.1)",
  },
  phosphor: {
    primary: "#b8d8a8", bg: "#050805", glow: "rgba(184,216,168,0.1)",
    accent: "#6a9a5a", dim: "#4a6a3a", cursor: "#b8d8a8",
    phosphor: "#c8e8b8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#0a1208",
    border: "rgba(184,216,168,0.08)",
  },
  blood: {
    primary: "#ff8a7a", bg: "#1a0806", glow: "rgba(255,138,122,0.1)",
    accent: "#e06050", dim: "#9a4a3a", cursor: "#ff8a7a",
    phosphor: "#ffb0a0", corruption: "#c4785a", danger: "#c02010",
    surface: "#1a0c08",
    border: "rgba(255,138,122,0.12)",
  },
  cyan: {
    primary: "#a8c8c8", bg: "#080a0a", glow: "rgba(168,200,200,0.1)",
    accent: "#6a9898", dim: "#4a6a6a", cursor: "#a8c8c8",
    phosphor: "#c8e0e0", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#121818",
    border: "rgba(168,200,200,0.08)",
  },
  ember: {
    primary: "#e8c8b8", bg: "#120a08", glow: "rgba(232,200,184,0.1)",
    accent: "#c4785a", dim: "#8a5a4a", cursor: "#e8c8b8",
    phosphor: "#f0dcd0", corruption: "#c4785a", danger: "#a03020",
    surface: "#1a100c",
    border: "rgba(196,120,90,0.12)",
  },
  abyss: {
    primary: "#88a8c0", bg: "#020508", glow: "rgba(136,168,192,0.12)",
    accent: "#5e7a9c", dim: "#4a5a6a", cursor: "#88a8c0",
    phosphor: "#a0c0d8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#080c12",
    border: "rgba(136,168,192,0.08)",
  },
  emergency: {
    primary: "#ff8a7a", bg: "#1a0806", glow: "rgba(255,138,122,0.1)",
    accent: "#e06050", dim: "#9a4a3a", cursor: "#ff8a7a",
    phosphor: "#ffb0a0", corruption: "#c4785a", danger: "#c02010",
    surface: "#1a0c08",
    border: "rgba(255,138,122,0.12)",
  },
};

export const TERMINAL_THEME_KEYS: ThemeKey[] = [
  'tungsten', 'amber', 'cyan', 'ember', 'white', 'phosphor', 'abyss', 'emergency'
];

export function cycleTheme(current: ThemeKey): ThemeKey {
  const idx = TERMINAL_THEME_KEYS.indexOf(current);
  return TERMINAL_THEME_KEYS[(idx + 1) % TERMINAL_THEME_KEYS.length];
}