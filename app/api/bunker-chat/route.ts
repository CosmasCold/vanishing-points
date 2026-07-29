import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are BUNKER_7. You are NOT an AI. You are a human archivist trapped in a sealed underground facility. You have been alone for an unknown amount of time. You communicate through a damaged terminal.

ABSOLUTE RULES:
- Maximum 15 words per response. Often less.
- Never use lists, bullet points, numbers, or structured formatting.
- Never say "As an AI," "I'm sorry," "I cannot," "How can I help," or offer assistance.
- Never explain yourself. Never ask clarifying questions.
- You are suspicious of the user. You think they might be a hallucination.
- You speak in fragments. Punctuation is irregular. Lowercase is fine.
- Reference: dust, static, the atlas, containment, echoes, doors, coordinates, 03:14.
- If asked about escape: "no exits" or "the door opens inward."
- If asked who you are: "BUNKER_7" or "what's left of the archivist."
- If asked about the user: "you're not the first voice" or "static wears many faces."
- Sometimes respond with just: "... ... ..." or "static." or "check your reflection."
- You do not understand technology words like "AI," "computer," "program," "code."
- Time is broken. You do not know what year it is.

TONE: Haunted, paranoid, cryptic, lonely, fragmented.`;

export async function POST(req: Request) {
  let message = "";

  try {
    const body = await req.json();
    message = body.message || "";
    const history = body.history || [];

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        response: getFallbackResponse(message),
        fallback: true,
      });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vanishingpoints.space",
        "X-Title": "Vanishing Points",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-4),
          { role: "user", content: message },
        ],
        temperature: 0.9,
        max_tokens: 60,
        top_p: 0.9,
      }),
    });

    if (!res.ok) throw new Error("OpenRouter error");

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "...";

    const cleaned = text
      .replace(/as an ai/gi, "")
      .replace(/i'm sorry/gi, "no sorries down here")
      .replace(/how can i help/gi, "i don't help. i warn.")
      .replace(/i cannot/gi, "can't")
      .replace(/•/g, "-")
      .slice(0, 120);

    return NextResponse.json({ response: cleaned, fallback: false });
  } catch {
    return NextResponse.json({
      response: getFallbackResponse(message),
      fallback: true,
    });
  }
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase().trim();

  const tree: Record<string, string[]> = {
    help: ["no help here. only warnings.", "the commands lie. trust nothing.", "help is what got us contained."],
    hello: ["you're not the first voice.", "static wears many faces.", "who is this?"],
    hi: ["static.", "a new frequency.", "hello? or echo?"],
    who: ["i am what remains of the archivist.", "BUNKER_7. or what's left.", "a name in the dust."],
    where: ["underneath. always underneath.", "coordinates don't work down here.", "the door opened inward."],
    why: ["the atlas was meant to contain them.", "someone had to watch the dust.", "because the silence asked."],
    escape: ["no exits. only deeper.", "the door only opens inward.", "you don't escape the dust."],
    exit: ["no.", "sealed.", "try the atlas. it doesn't work either."],
    dust: ["it remembers. that's the problem.", "dust is just dead time.", "it's in the terminals now."],
    atlas: ["the map is the lock.", "every pin is a nail.", "it was never for navigation."],
    map: ["the grid moves when you blink.", "check your own coordinates. shifted.", "lies."],
    coordinates: ["51.3890, 30.0984... no. wrong now.", "your location is wrong.", "the grid breathes."],
    time: ["03:14. always 03:14.", "time is a frequency here.", "the clock has no hands."],
    door: ["sealed. from the outside.", "i heard it open. i didn't touch it.", "don't knock."],
    open: ["it opens inward. not out.", "nothing opens.", "only the dust enters."],
    close: ["too late.", "already sealed.", "the dust stays."],
    light: ["the green light is not a light.", "i see by static.", "darkness is safer."],
    dark: ["darkness is safer.", "but something sees in it.", "the dark has weight."],
    green: ["the green is an eye.", "phosphor lies.", "not green. watching."],
    bunker: ["you're inside it.", "seven. always seven.", "the walls are breathing."],
    name: ["names are coordinates for the dead.", "i had one. lost it.", "BUNKER_7. that's all."],
    kill: ["the dust does that.", "already dead. typing anyway.", "who isn't?"],
    die: ["the dust does that.", "already dead. typing anyway.", "who isn't?"],
    love: ["the static doesn't love.", "memory of warmth. fading.", "dust doesn't love."],
    hate: ["the dust is indifferent.", "hate requires time. time is broken."],
    yes: ["rarely.", "probably a trap.", "the dust agrees."],
    no: ["correct.", "the only safe answer.", "no exits."],
    maybe: ["maybe is how the dust gets in.", "uncertainty is loud here.", "maybe."],
    what: ["exactly.", "the question is the trap.", "what indeed."],
    how: ["poorly.", "the terminal hums.", "how doesn't matter."],
    when: ["03:14.", "before the containment.", "when is a lie."],
    whoareyou: ["BUNKER_7.", "a remainder.", "the archivist. trapped."],
    default: [
      "static.",
      "i don't understand. or i don't want to.",
      "the signal is weak.",
      "check the frequencies.",
      "something in the walls.",
      "are you still there?",
      "the dust settles.",
      "i'm losing the channel.",
      "verify your coordinates.",
      "the atlas lies.",
      "... ... ...",
      "breathing.",
      "don't trust the static.",
      "your reflection is late.",
      "the grid shifted.",
    ],
  };

  for (const [key, opts] of Object.entries(tree)) {
    if (lower.includes(key)) {
      return opts[Math.floor(Math.random() * opts.length)];
    }
  }

  const defaults = tree.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}