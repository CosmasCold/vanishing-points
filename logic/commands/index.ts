import { registry } from '../commandRegistry';
import { registerSystemCommands } from './system';
import { registerNavigationCommands } from './navigation';
import { registerInvestigationCommands } from './investigation';
import { registerAtlasCommands } from './atlas';
import { registerEvidenceBoardCommands } from './evidenceBoard';
import { registerDocumentCommands } from './documents';


export function initializeCommands() {
  registerSystemCommands(registry);
  registerNavigationCommands(registry);
  registerInvestigationCommands(registry);
  registerAtlasCommands(registry);
  registerEvidenceBoardCommands(registry);
  registerDocumentCommands(registry);
}