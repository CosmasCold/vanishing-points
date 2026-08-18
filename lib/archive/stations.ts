export const ARCHIVE_STATIONS = {
  boot: { label: 'BOOT SEQUENCE', environment: 'boot' },
  archive: { label: 'CENTRAL ARCHIVE', environment: 'archive' },
  atlas: { label: 'ATLAS', environment: 'atlas' },
  research: { label: 'RESEARCH', environment: 'research' },
  evidence: { label: 'EVIDENCE BOARD', environment: 'evidence' },
  artifact: { label: 'ARTIFACT EXAMINATION', environment: 'artifact' },
  contradiction: { label: 'COMPARATIVE RECORDS', environment: 'contradiction' },
  signal: { label: 'SIGNAL LABORATORY', environment: 'signal' },
  terminal: { label: 'ACTIVE CARREL 7-B', environment: 'terminal' },
  bunker: { label: 'BUNKER_7', environment: 'bunker' },
  null: { label: 'NULL CARREL', environment: 'null' },
} as const;

export type ArchiveStation = keyof typeof ARCHIVE_STATIONS;
export type ArchiveEnvironmentId = (typeof ARCHIVE_STATIONS)[ArchiveStation]['environment'];
