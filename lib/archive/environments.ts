import type { ArchiveStation } from './stations';

export interface ArchiveEnvironmentDefinition {
  id: ArchiveStation;
  label: string;
  background?: string;
  backgroundPosition: string;
  treatment: 'warm' | 'technical' | 'restricted' | 'anomalous';
}

export const ARCHIVE_ENVIRONMENTS: Record<ArchiveStation, ArchiveEnvironmentDefinition> = {
  boot: { id: 'boot', label: 'Dormant Carrel', backgroundPosition: 'center', treatment: 'warm' },
  archive: { id: 'archive', label: 'Central Archive', backgroundPosition: 'center', treatment: 'warm' },
  atlas: { id: 'atlas', label: 'Cartographic Research Room', backgroundPosition: 'center', treatment: 'warm' },
  research: { id: 'research', label: 'Archival Reading Room', backgroundPosition: 'center', treatment: 'warm' },
  evidence: { id: 'evidence', label: "Investigator's Workstation", background: '/images/desktop-final.png', backgroundPosition: 'center', treatment: 'warm' },
  artifact: { id: 'artifact', label: 'Forensic Examination Room', backgroundPosition: 'center', treatment: 'technical' },
  contradiction: { id: 'contradiction', label: 'Comparative Records Room', backgroundPosition: 'center', treatment: 'warm' },
  signal: { id: 'signal', label: 'Signal Laboratory', backgroundPosition: 'center', treatment: 'technical' },
  terminal: { id: 'terminal', label: 'Active Carrel 7-B', backgroundPosition: 'center', treatment: 'technical' },
  bunker: { id: 'bunker', label: 'Restricted Sublevel Archive', backgroundPosition: 'center', treatment: 'restricted' },
  null: { id: 'null', label: 'Null Carrel', backgroundPosition: 'center', treatment: 'anomalous' },
};
