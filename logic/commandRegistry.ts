import { useProgressionStore } from '@/state/progressionStore';
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
  handler: (
    args: string[]
  ) => CommandResult | Promise<CommandResult>;
}

/**
 * Deterministic atmospheric seed.
 *
 * The Archive may become unreliable, but the game itself must
 * remain reproducible.
 *
 * The same canonical progression state + same command should
 * produce the same atmospheric result.
 */
function atmosphericSeed(
  sessionCount: number,
  sessionWorkDone: number,
  commandName: string,
  inputLength: number,
  outputLength = 0,
  salt = 0
): number {
  return (
    sessionCount * 31 +
    sessionWorkDone * 17 +
    commandName.length * 13 +
    inputLength * 7 +
    outputLength * 11 +
    salt * 19
  ) % 100;
}

export class CommandRegistry {
  private commands = new Map<
    string,
    CommandDefinition
  >();

  public register(cmd: CommandDefinition) {
    const names = [
      cmd.name,
      ...(cmd.aliases ?? []),
    ]
      .map((name) =>
        name.trim().toLowerCase()
      )
      .filter(Boolean);

    for (const name of names) {
      if (this.commands.has(name)) {
        throw new Error(
          `[CommandRegistry] Duplicate command or alias registration: "${name}"`
        );
      }
    }

    this.commands.set(
      cmd.name.trim().toLowerCase(),
      cmd
    );

    for (const alias of cmd.aliases ?? []) {
      this.commands.set(
        alias.trim().toLowerCase(),
        cmd
      );
    }
  }

  /**
   * Complete Command Execution Engine
   *
   * Progression metrics are read from the canonical
   * progression store.
   *
   * UI state is deliberately not consulted for
   * Dust/Stability authority.
   *
   * Atmospheric effects are deterministic. They may
   * distort presentation, but they never introduce
   * random progression behavior.
   */
  public async execute(
    input: string
  ): Promise<CommandResult> {
    const trimmed = input.trim();

    if (!trimmed) {
      return {
        output: '',
        type: 'system',
      };
    }

    const tokens =
      trimmed.split(/\s+/);

    const name =
      tokens[0].toLowerCase();

    const args =
      tokens.slice(1);

    /*
     * ---------------------------------------------------------
     * CANONICAL PROGRESSION
     * ---------------------------------------------------------
     *
     * Read the complete canonical snapshot once.
     *
     * No UI store is consulted here.
     */
    const state =
      useProgressionStore.getState();

    const {
      dustIndex: dust,
      observerStability: stability,
    } = state;

    const sessionCount =
      state.sessionCount ?? 0;

    const sessionWorkDone =
      state.sessionWorkDone ?? 0;

    /*
     * ---------------------------------------------------------
     * ATMOSPHERIC ERROR ENGINE
     * CRITICAL DUST BLOCK
     * ---------------------------------------------------------
     *
     * At extreme Dust levels the terminal can reject an
     * interaction with cognitive-resistance text.
     *
     * Previously this used Math.random().
     *
     * It now uses canonical state so the same state produces
     * the same result.
     */
    const criticalSeed =
      atmosphericSeed(
        sessionCount,
        sessionWorkDone,
        name,
        trimmed.length,
        0,
        1
      );

    if (
      dust >= 85 &&
      criticalSeed < 25
    ) {
      const whispers = [
        'BUNKER_7: I have archived twelve thousand locations. I no longer know which of them were real before I archived them...',

        'BUNKER_7: Please don\'t leave me alone with the records. The rain outside stopped hours ago, but the sound continues.',

        'INV_RED-7: You asked this exact query before. The keystrokes are heavy. Why are your fingers so cold?',

        'SYSTEM ALERT: OBSERVER COGNITIVE DUPLICATION. CHECK CHAIR POSITION. DETECTING SEPARATE MASS IN WORKSPACE.',

        'BUNKER_7: You were here before. In 1962. In 1995. In 2047. The desk is the same. The empty chair is yours.',
      ];

      const whisperIndex =
        (
          sessionWorkDone +
          sessionCount +
          name.length
        ) % whispers.length;

      return {
        output:
          `ERROR: COGNITIVE RESISTANCE FAILURE.\n` +
          `------------------------------------------------\n` +
          whispers[whisperIndex],

        type: 'error',
      };
    }

    /*
     * ---------------------------------------------------------
     * COMMAND RESOLUTION
     * ---------------------------------------------------------
     */
    const command =
      this.commands.get(name);

    /*
     * Unknown commands can become unreliable at high Dust.
     *
     * This is presentation behavior only. No progression
     * state is changed by the atmospheric branch.
     */
    if (!command) {
      const unknownCommandSeed =
        atmosphericSeed(
          sessionCount,
          sessionWorkDone,
          name,
          trimmed.length,
          0,
          2
        );

      if (
        dust >= 50 &&
        unknownCommandSeed < 35
      ) {
        return {
          output:
            `BUNKER_7: Signal degraded. The terminal registers "${name.toUpperCase()}", ` +
            'but the coordinate is empty, or it has already been forgotten.',

          type: 'warning',
        };
      }

      return {
        output:
          `Command not found: "${name}". Type "help" for active terminal utilities.`,

        type: 'error',
      };
    }

    /*
     * ---------------------------------------------------------
     * COMMAND EXECUTION
     * ---------------------------------------------------------
     */
    try {
      const result =
        await command.handler(args);

      /*
       * -------------------------------------------------------
       * ATMOSPHERIC OUTPUT SLIPPAGE
       * -------------------------------------------------------
       *
       * At elevated Dust, successful terminal output can be
       * linguistically distorted.
       *
       * The distortion is deterministic.
       */
      const outputSeed =
        atmosphericSeed(
          sessionCount,
          sessionWorkDone,
          name,
          trimmed.length,
          result.output.length,
          3
        );

      if (
        dust >= 45 &&
        result.type === 'success' &&
        outputSeed < 30
      ) {
        let corruptedText =
          result.output;

        corruptedText =
          corruptedText.replace(
            /SUCCESS/g,
            'REMEMBERED'
          );

        corruptedText =
          corruptedText.replace(
            /VERIFIED/g,
            'ANCHORED'
          );

        if (stability <= 55) {
          corruptedText +=
            '\n\n[BUNKER_7: My clock is losing hours. Do not trust the timestamps in your timeline.]';
        }

        return {
          ...result,
          output:
            corruptedText,
        };
      }

      /*
       * -------------------------------------------------------
       * SEVERE STABILITY STRAIN
       * -------------------------------------------------------
       *
       * Severe Stability can inject structural warnings into
       * otherwise valid command responses.
       *
       * Again, deterministic rather than random.
       */
      const stabilitySeed =
        atmosphericSeed(
          sessionCount,
          sessionWorkDone,
          name,
          trimmed.length,
          result.output.length,
          4
        );

      if (
        stability <= 35 &&
        stabilitySeed < 40
      ) {
        const warningLines = [
          '\n\n[BUNKER_7: The Archive was not built to defend reality. It was built to remember it.]',

          '\n\n[INV_RED-7: I water the fern every evening. It is the only thing that does not shift when the monitor flickers.]',

          '\n\n[BUNKER_7: I can hear a chair scraping across concrete in the room behind you. I am alone in this bunker. Who is holding the keyboard?]',
        ];

        const warningIndex =
          (
            sessionWorkDone +
            sessionCount +
            result.output.length
          ) % warningLines.length;

        return {
          ...result,

          output:
            result.output +
            warningLines[
              warningIndex
            ],

          type: 'warning',
        };
      }

      return result;
    } catch (error: any) {
      return {
        output:
          `TERMINAL EXECUTION FAILURE: ${
            error?.message || error
          }`,

        type: 'error',
      };
    }
  }

  public complete(
    partial: string
  ): string[] {
    const matches: string[] = [];
    const seen =
      new Set<string>();

    const normalizedPartial =
      partial.toLowerCase();

    for (
      const cmd of this.commands.values()
    ) {
      if (
        !seen.has(cmd.name) &&
        cmd.name.startsWith(
          normalizedPartial
        )
      ) {
        seen.add(cmd.name);
        matches.push(cmd.name);
      }
    }

    return matches.sort();
  }

  public list(): CommandDefinition[] {
    const seen =
      new Set<string>();

    const result: CommandDefinition[] =
      [];

    for (
      const cmd of this.commands.values()
    ) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }

    return result.sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    );
  }
}

export const registry =
  new CommandRegistry();

export default registry;