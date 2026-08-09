import { registry } from '../commandRegistry';
import { registerSystemCommands } from './system';
import { registerNavigationCommands } from './navigation';
import { registerInvestigationCommands } from './investigation';
import { registerAtlasCommands } from './atlas';
import { registerBunker7Commands } from './bunker7';
import { registerEvidenceBoardCommands } from './evidenceBoard';
import { registerPersonalCacheCommands } from './personalCache';
import { registerDustCommands } from './dust';
import { registerEnvironmentCommands } from './environment';
import { registerDailyCommands } from './daily';
import { registerDocumentCommands } from './documents';

// Import advanced Phase 4 & Phase 7 investigative systems [8]
import { registerProbeCommands } from './probe';
import { registerDecryptCommands } from './decrypt';
import { registerAuditCommands } from './audit';
import { registerSolsticeCommands } from './solstice'; // Our final solstice endgame command registration module [6]

/**
 * Master Registry Bootstrapper (Version 2.0)
 * Mounts all CLI commands onto the central CommandRegistry singleton.
 */
export function initializeCommands() {
  // Classic terminal utilities
  registerSystemCommands(registry);
  registerNavigationCommands(registry);
  registerInvestigationCommands(registry);
  registerAtlasCommands(registry);
  registerBunker7Commands(registry);
  registerEvidenceBoardCommands(registry);
  registerPersonalCacheCommands(registry);
  registerDustCommands(registry);
  registerEnvironmentCommands(registry);
  registerDailyCommands(registry);
  registerDocumentCommands(registry);

  // Advanced geodetic and decryption systems
  registerProbeCommands(registry);
  registerDecryptCommands(registry);
  registerAuditCommands(registry);

  // Endgame Solstice loop handlers [6, 8]
  registerSolsticeCommands(registry);
}
