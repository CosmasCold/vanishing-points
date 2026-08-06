import { CommandOutputType } from '@/types';

export interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  aliases?: string[];
  handler: (args: string[]) => CommandResult | Promise<CommandResult>;
}

export interface CommandResult {
  output: string;
  type: CommandOutputType;
  clear?: boolean;
}

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();

  register(cmd: CommandDefinition) {
    this.commands.set(cmd.name, cmd);
    if (cmd.aliases) {
      cmd.aliases.forEach((alias) => this.commands.set(alias, cmd));
    }
  }

  async execute(input: string): Promise<CommandResult> {
    const tokens = input.trim().split(/\s+/);
    const name = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    const cmd = this.commands.get(name);
    if (!cmd) {
      return {
        output: `Command not found: ${name}\nType 'help' for available commands.`,
        type: 'error',
      };
    }

    return cmd.handler(args);
  }

  complete(partial: string): string[] {
    const matches: string[] = [];
    const seen = new Set<string>();
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name) && cmd.name.startsWith(partial)) {
        seen.add(cmd.name);
        matches.push(cmd.name);
      }
    }
    return matches;
  }

  list(): CommandDefinition[] {
    const seen = new Set<string>();
    const result: CommandDefinition[] = [];
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }
    return result;
  }
}

export const registry = new CommandRegistry();