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

// Import our advanced Phase 4, Phase 2, & Phase 7 commands [6, 80, 82]
import { registerProbeCommands } from './probe';
import { registerDecryptCommands } from './decrypt';
import { registerAuditCommands } from './audit';
import { registerSolsticeCommands } from './solstice';
import { registerForgetCommands } from './forget';
import { registerSearchCommands } from './search';

/**
 * Master Registry Bootstrapper
 * Mounts all CLI commands onto the central CommandRegistry singleton.
 * Integrates our declassified forensic searches, cognitive purges, and solstice resets.
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

  // Advanced investigative systems
  registerProbeCommands(registry);
  registerDecryptCommands(registry);
  registerAuditCommands(registry);

  // Phase 2 & Phase 7 Solstice commands
  registerSolsticeCommands(registry);
  registerForgetCommands(registry);
  registerSearchCommands(registry);
}
