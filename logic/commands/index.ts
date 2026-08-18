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

import { registerProbeCommands } from './probe';
import { registerDecryptCommands } from './decrypt';
import { registerAuditCommands } from './audit';

import { registerSolsticeCommands } from './solstice';
import { registerForgetCommands } from './forget';
import { registerExposureCommands } from './exposure';
import { registerSearchCommands } from './search';

let commandsInitialized = false;

export function initializeCommands() {
  if (commandsInitialized) {
    return;
  }

  commandsInitialized = true;

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

  registerProbeCommands(registry);
  registerDecryptCommands(registry);
  registerAuditCommands(registry);

  registerSolsticeCommands(registry);
  registerForgetCommands(registry);
  registerExposureCommands(registry);
  registerSearchCommands(registry);
}