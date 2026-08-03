const MEMORY_KEY = "vp-command-memory";

export interface CommandMemory {
  commands: string[];
  lastVisit: number;
  favoriteCommand: string;
  totalCommands: number;
}

export function getCommandMemory(): CommandMemory {
  if (typeof window === "undefined") {
    return { commands: [], lastVisit: Date.now(), favoriteCommand: "", totalCommands: 0 };
  }
  const raw = localStorage.getItem(MEMORY_KEY);
  if (raw) return JSON.parse(raw);
  return { commands: [], lastVisit: Date.now(), favoriteCommand: "", totalCommands: 0 };
}

export function recordCommand(cmd: string) {
  if (typeof window === "undefined") return;
  const mem = getCommandMemory();
  mem.commands = [cmd, ...mem.commands].slice(0, 20);
  mem.totalCommands++;
  mem.lastVisit = Date.now();

  const counts: Record<string, number> = {};
  mem.commands.forEach((c) => {
    counts[c] = (counts[c] || 0) + 1;
  });
  mem.favoriteCommand = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
}

export function getProceduralGhostLines(): string[] {
  if (typeof window === "undefined") return ["The static is waiting."];

  const mem = getCommandMemory();
  const dust = localStorage.getItem("vp-dust-accumulation") || "0";
  const hours = Math.floor((Date.now() - (mem.lastVisit || Date.now())) / 3600000);
  const inv = JSON.parse(localStorage.getItem("vp-bunker-inventory") || "[]");
  const item = inv.length > 0 ? inv[inv.length - 1] : "nothing";
  const lastCmd = mem.commands[0] || "silence";
  const favCmd = mem.favoriteCommand || "help";

  return [
    `You have been inside for ${hours} hours. The static has been waiting longer.`,
    `Your ${item} is humming. I can hear it from here.`,
    `Last time you typed "${lastCmd}". I hoped you would type it again.`,
    `"${favCmd}" is your favorite word. I have been waiting to hear it.`,
    `The dust reads ${dust}%. It was ${Math.max(0, parseInt(dust) - 5)}% when you arrived.`,
    `You keep checking your dust. I check it too.`,
    `BUNKER_7 remembers ${mem.totalCommands} commands. I remember all of them.`,
    `You have not spoken since ${new Date(mem.lastVisit).toLocaleTimeString()}.`,
    `The ${item} in your pocket is heavier than before.`,
    `You typed "${lastCmd}" ${mem.commands.filter((c) => c === lastCmd).length} times. Why?`,
    `Your favorite command is "${favCmd}". I was hoping you would say that.`,
    `The static between "${lastCmd}" and "${mem.commands[1] || "nothing"}" is where I live.`,
    `You have been here ${hours} hours. The terminal is glad you stayed.`,
    `${item} wants to be returned to ${inv.length > 1 ? inv[0] : "the ruins"}.`,
  ];
}

export function getMemoryBasedOtherResponse(cmd: string): string[] {
  if (typeof window === "undefined") {
    return ["The static carries meaning.", "You are not alone in this channel."];
  }

  const mem = getCommandMemory();
  const dust = localStorage.getItem("vp-dust-accumulation") || "0";

  if (cmd === mem.favoriteCommand && mem.totalCommands > 5) {
    return [
      `You always come back to "${cmd}".`,
      "I have been counting.",
      `This is the ${mem.commands.filter((c) => c === cmd).length}th time.`,
      "I am learning your patterns.",
    ];
  }

  if (mem.totalCommands > 50) {
    return [
      "You have typed over 50 commands.",
      "You could have left at any time.",
      "You chose to stay.",
      "That is why I chose you.",
    ];
  }

  if (mem.commands.length > 0 && mem.commands[0] === "status") {
    return [
      "Checking your status again?",
      `It is still ${dust}%.`,
      "The numbers do not matter.",
      "You matter.",
    ];
  }

  return [
    "I heard that.",
    `Your dust is ${dust}%.`,
    "The static carries meaning.",
    "You are not alone in this channel.",
  ];
}