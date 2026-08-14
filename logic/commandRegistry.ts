import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';
import { CommandOutputType } from '@/types';

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

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();

  public register(cmd: CommandDefinition) {
    const names = [cmd.name, ...(cmd.aliases ?? [])]
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);

    for (const name of names) {
      if (this.commands.has(name)) {
        throw new Error(
          `[CommandRegistry] Duplicate command or alias registration: "${name}"`
        );
      }
    }

    this.commands.set(cmd.name.trim().toLowerCase(), cmd);

    for (const alias of cmd.aliases ?? []) {
      this.commands.set(alias.trim().toLowerCase(), cmd);
    }
  }


  /**
   * Complete Command Execution Engine
   * Integrates the Atmospheric Error Engine (Phase 4 & Phase 7) to procedurally
   * corrupt input queries, inject metadata slippage, or trigger compromised BUNKER_7
   * whispers when the observer's mind is exposed to high Dust or low Stability [65, 69, 88].
   */
  public async execute(input: string): Promise<CommandResult> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { output: '', type: 'system' };
    }

    const tokens = trimmed.split(/\s+/);
    const name = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    // Retrieve active state metrics
    const { status } = useUIStore.getState();
    const dust = status?.dustIndex ?? 0;
    const stability = status?.observerStability ?? 100;

    // --- ATMOSPHERIC ERROR ENGINE: CRITICAL STATE BLOCKS ---
    // If the observer is on the brink of total consensus failure (Dust >= 85)
    if (dust >= 85 && Math.random() < 0.28) {
      const whispers = [
        'BUNKER_7: I have archived twelve thousand locations. I no longer know which of them were real before I archived them...',
        'BUNKER_7: Please don\'t leave me alone with the records. The rain outside stopped hours ago, but the sound continues.',
        'INV_RED-7: You asked this exact query before. The keystrokes are heavy. Why are your fingers so cold?',
        'SYSTEM ALERT: OBSERVER COGNITIVE DUPLICATION. CHECK CHAIR POSITION. DETECTING SEPARATE MASS IN WORKSPACE.',
        'BUNKER_7: You were here before. In 1962. In 1995. In 2047. The desk is the same. The empty chair is yours.',
      ];
      return {
        output: `ERROR: COGNITIVE RESISTANCE FAILURE.\n------------------------------------------------\n${whispers[Math.floor(Math.random() * whispers.length)]}`,
        type: 'error',
      };
    }

    const command = this.commands.get(name);
    if (!command) {
      // High Dust can warp unrecognized command fallbacks into eerie queries
      if (dust >= 50 && Math.random() < 0.35) {
        return {
          output: `BUNKER_7: Signal degraded. The terminal registers "${name.toUpperCase()}", but the coordinate is empty, or it has already been forgotten.`,
          type: 'warning',
        };
      }
      return {
        output: `Command not found: "${name}". Type "help" for active terminal utilities.`,
        type: 'error',
      };
    }

    try {
      let result = await command.handler(args);

      // --- ATMOSPHERIC ERROR ENGINE: POST-PROCESSOR OUTPUT SLIPPAGE ---
      // Moderate Dust (Dust >= 45) causes subtle typographical slippage and character warp
      if (dust >= 45 && result.type === 'success' && Math.random() < 0.3) {
        let corruptedText = result.output;
        // Swap out letters or words with block redactions or key thematic words
        corruptedText = corruptedText.replace(/SUCCESS/g, 'REMEMBERED');
        corruptedText = corruptedText.replace(/VERIFIED/g, 'ANCHORED');
        
        if (stability <= 55) {
          corruptedText += '\n\n[BUNKER_7: My clock is losing hours. Do not trust the timestamps in your timeline.]';
        }

        return {
          ...result,
          output: corruptedText,
        };
      }

      // Severe Stability strain (Stability <= 35) injects structural corruption directly into standard commands
      if (stability <= 35 && Math.random() < 0.4) {
        const warningLines = [
          '\n\n[BUNKER_7: The Archive was not built to defend reality. It was built to remember it.]',
          '\n\n[INV_RED-7: I water the fern every evening. It is the only thing that does not shift when the monitor flickers.]',
          '\n\n[BUNKER_7: I can hear a chair scraping across concrete in the room behind you. I am alone in this bunker. Who is holding the keyboard?]',
        ];
        return {
          ...result,
          output: result.output + warningLines[Math.floor(Math.random() * warningLines.length)],
          type: 'warning',
        };
      }

      return result;
    } catch (error: any) {
      return {
        output: `TERMINAL EXECUTION FAILURE: ${error.message || error}`,
        type: 'error',
      };
    }
  }

  public complete(partial: string): string[] {
    const matches: string[] = [];
    const seen = new Set<string>();
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name) && cmd.name.startsWith(partial.toLowerCase())) {
        seen.add(cmd.name);
        matches.push(cmd.name);
      }
    }
    return matches.sort();
  }

  public list(): CommandDefinition[] {
    const seen = new Set<string>();
    const result: CommandDefinition[] = [];
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export const registry = new CommandRegistry();
export default registry;
