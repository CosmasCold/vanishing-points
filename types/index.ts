// ─────────────────────────────────────────────────────────────
// BOOT SEQUENCE
// ─────────────────────────────────────────────────────────────

export type BootPhase = 
  | 'POWER_RESTORED'
  | 'KERNEL_LOAD'
  | 'ATLAS_INIT'
  | 'INTEGRITY_CHECK'
  | 'INVESTIGATIONS_LOAD'
  | 'EVIDENCE_SYNC'
  | 'CACHE_LOAD'
  | 'DUST_INDEX'
  | 'COMPLETE';

export interface BootPhaseConfig {
  id: BootPhase;
  label: string;
  duration: number; // ms
  detail?: string;
}

// ─────────────────────────────────────────────────────────────
// MODULE SYSTEM
// ─────────────────────────────────────────────────────────────

export type ModuleId = 
  | 'inbox'
  | 'atlas'
  | 'investigations'
  | 'evidence'
  | 'signals'
  | 'documents'
  | 'research'
  | 'inventory'
  | 'discoveries'
  | 'system';

// ─────────────────────────────────────────────────────────────
// TERMINAL & COMMAND REGISTRY
// ─────────────────────────────────────────────────────────────

export type CommandOutputType = 
  | 'system' 
  | 'user' 
  | 'error' 
  | 'warning' 
  | 'success' 
  | 'info';

export interface TerminalCommand {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  type: CommandOutputType;
}

export interface CommandResult {
  output: string;
  type: CommandOutputType;
  clear?: boolean;
}

export interface CommandDefinition {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  handler: (args: string[]) => CommandResult | Promise<CommandResult>;
}

// ─────────────────────────────────────────────────────────────
// SYSTEM STATUS
// ─────────────────────────────────────────────────────────────

export interface SystemStatus {
  dustIndex: number;
  atlasCoverage: number;
  activeInvestigations: number;
  unreadMessages: number;
  systemIntegrity: 'stable' | 'degraded' | 'critical';
  lastSync: string;
}

// ─────────────────────────────────────────────────────────────
// ATLAS / PLACES
// ─────────────────────────────────────────────────────────────

export type PlaceCategory = 'abandoned' | 'haunted' | 'both';

export type PlaceStatus = 'verified' | 'pending' | 'rejected' | 'sealed' | 'whispered' | 'mirage';

export interface Address {
  city: string;
  country: string;
  formatted: string;
}

export interface UnlockCondition {
  type: 'dust' | 'code' | 'inventory' | 'visit' | 'reading' | 'time';
  value: string | number;
  message: string;
}

export interface Place {
  slug: string;
  name: string;
  category: PlaceCategory;
  coordinates: [number, number];
  address: Address;
  yearAbandoned?: number;
  history: string;
  hauntingReports: string[];
  dangerLevel: number;
  photos: string[];
  status: PlaceStatus;
  contributor?: { name: string; email: string };
  viewCount: number;
  submittedAt: string;
  verifiedAt: string;
  verifiedBy: string;
  unlockCondition?: UnlockCondition;
  connectedTo: string[];
  resonanceNote?: string;
}