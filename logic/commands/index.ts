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

export function initializeCommands() {
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
}