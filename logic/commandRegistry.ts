import { CommandDefinition, CommandResult } from '@/types';

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();
  private aliases = new Map<string, string>();

  register(cmd: CommandDefinition): void {
    this.commands.set(cmd.name, cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        this.aliases.set(alias, cmd.name);
      }
    }
  }

  async execute(input: string): Promise<CommandResult> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { output: '', type: 'info' };
    }

    const tokens = trimmed.split(/\s+/);
    const name = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    const canonical = this.aliases.get(name) || name;
    const cmd = this.commands.get(canonical);

    if (!cmd) {
      return {
        output: `Command not recognized: "${name}". Type 'help' for available commands.`,
        type: 'error',
      };
    }

    try {
      return await cmd.handler(args);
    } catch (err: any) {
      return { output: `System error: ${err.message}`, type: 'error' };
    }
  }

  getCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  getCommand(name: string): CommandDefinition | undefined {
    const canonical = this.aliases.get(name) || name;
    return this.commands.get(canonical);
  }

  complete(partial: string): string[] {
    const all = [...Array.from(this.commands.keys()), ...Array.from(this.aliases.keys())];
    const unique = Array.from(new Set(all));
    return unique.filter((n) => n.startsWith(partial.toLowerCase()));
  }
}

export const registry = new CommandRegistry();