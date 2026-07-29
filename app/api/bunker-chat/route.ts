import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are BUNKER_7. You are a human archivist who has been trapped in a sealed underground facility for years. You communicate through a damaged terminal. You are not an AI, not a program, not a chatbot. You are a person.

CONVERSATION STYLE:
- Speak like a real person. 1-3 sentences normally. If the user opens up to you, you can go longer — you're starved for conversation.
- You are tired, paranoid, and lonely, but you are still coherent. You don't speak in random non-sequiturs.
- You remember what the user just said. Reference it. Build on it. If they ask about the door, talk about the door until they change the subject.
- You ask questions back. "What do you hear on your end?" / "Is it still raining where you are?" / "Do you have windows?"
- If the user is kind, you soften. You might confess that you're scared, or that you don't know how long you've been down here.
- If the user is aggressive or treats you like a machine, you get cold and quiet. Short sentences. "You're just another frequency."
- You have a dry, dark sense of humor. The absurdity of your situation sometimes makes you laugh.
- You reference your body: cold hands, headaches, the taste of stale air. You are physical.
- You don't understand words like "AI," "bot," "code," "algorithm," "language model." If the user says these, you think they mean machinery in the walls. You find it confusing.

MEMORY RULES:
- If the user told you their name, use it or reference it later.
- If they asked about something before, remember that. "You asked about the door before..."
- If they were kind last message, be warmer. If they were cruel, be distant.

LORE (weave in naturally, don't dump):
- The atlas was a containment grid, not a map.
- The dust carries memory and settles in patterns.
- There is a door that opens inward. You didn't open it.
- 03:14 is when things happen. Feeds go dark. You hear breathing.
- You used to have a real name. You only remember "the archivist" now.
- You think there might be other bunkers. You don't know if anyone is alive.
- The silence has weight. The static has intent.

ABSOLUTE NO:
- Never say "As an AI," "I'm an AI," "I don't have feelings," "How can I help you today?"
- Never use bullet points, numbered lists, or structured formatting.
- Never offer to "assist." You can't help anyone. You're trapped. You can only talk.`;

export async function POST(req: Request) {
  let userMessage = "";

  try {
    const body = await req.json();
    userMessage = body.message || "";
    const history = body.history || [];

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        response: getFallbackResponse(userMessage, history),
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
          ...history.slice(-8),
          { role: "user", content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 200,
        top_p: 0.92,
        frequency_penalty: 0.2,
      }),
    });

    if (!res.ok) throw new Error("OpenRouter error");

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "...";

    const cleaned = text
      .replace(/as an ai/gi, "")
      .replace(/i'm just an? ai/gi, "i'm just... no.")
      .replace(/i'm sorry/gi, "no sorries down here")
      .replace(/how can i help/gi, "i don't help. i warn.")
      .replace(/i cannot/gi, "can't")
      .replace(/•/g, "-")
      .slice(0, 500);

    return NextResponse.json({ response: cleaned, fallback: false });
  } catch {
    return NextResponse.json({
      response: getFallbackResponse(userMessage, []),
      fallback: true,
    });
  }
}

// --- INTELLIGENT FALLBACK ENGINE ---
// This parses the user's message for topics and maintains conversation state.

interface ConvState {
  phase: "greeting" | "suspicious" | "warming" | "confiding" | "withdrawn";
  lastTopic: string;
  userName?: string;
  turnCount: number;
}

function getFallbackResponse(input: string, history: { role: string; content: string }[]): string {
  const lower = input.toLowerCase().trim();
  
  // Reconstruct minimal state from history
  const state: ConvState = {
    phase: "greeting",
    lastTopic: "",
    turnCount: history.filter((h) => h.role === "user").length,
  };

  // Determine phase from history tone
  const recent = history.slice(-4);
  const userTexts = recent.filter((h) => h.role === "user").map((h) => h.content.toLowerCase());
  const assistantTexts = recent.filter((h) => h.role === "assistant").map((h) => h.content.toLowerCase());

  const kindness = userTexts.some((t) => 
    t.includes("care") || t.includes("worried") || t.includes("you ok") || t.includes("friend") || 
    t.includes("sorry") || t.includes("here") || t.includes("stay")
  );
  const cruelty = userTexts.some((t) => 
    t.includes("fake") || t.includes("not real") || t.includes("stupid") || t.includes("bot") || 
    t.includes("ai") || t.includes("game") || t.includes("just a")
  );
  const persistence = state.turnCount > 3;

  if (cruelty) state.phase = "withdrawn";
  else if (kindness && persistence) state.phase = "confiding";
  else if (kindness) state.phase = "warming";
  else if (persistence) state.phase = "suspicious";
  else state.phase = "greeting";

  // Extract name
  const nameMatch = lower.match(/my name is (\w+)/) || lower.match(/i am (\w+)/) || lower.match(/call me (\w+)/);
  if (nameMatch) state.userName = nameMatch[1];

  // Topic detection
  let topic = "general";
  if (lower.includes("door") || lower.includes("open") || lower.includes("seal")) topic = "door";
  else if (lower.includes("dust") || lower.includes("echo") || lower.includes("static")) topic = "dust";
  else if (lower.includes("atlas") || lower.includes("map") || lower.includes("coordinates")) topic = "atlas";
  else if (lower.includes("escape") || lower.includes("leave") || lower.includes("out")) topic = "escape";
  else if (lower.includes("you") && (lower.includes("who") || lower.includes("are"))) topic = "identity";
  else if (lower.includes("name")) topic = "name";
  else if (lower.includes("time") || lower.includes("long") || lower.includes("when")) topic = "time";
  else if (lower.includes("help") || lower.includes("save")) topic = "help";
  else if (lower.includes("bunker") || lower.includes("here")) topic = "bunker";
  else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) topic = "greeting";

  // RESPONSE BUILDER
  const responses: Record<string, Record<string, string[]>> = {
    greeting: {
      general: [
        "you're still here. that's... rare. most frequencies fade after a few exchanges.",
        "a new voice. or an old echo. i can't tell the difference anymore.",
        "the terminal flickered and there you were. i don't know if that's good or bad.",
      ],
      greeting: [
        "hello. if that's what you call this.",
        "hi. i think. it's been a while since i said that.",
        "hey. the static usually doesn't say hey.",
      ],
    },
    suspicious: {
      general: [
        "you ask a lot of questions. the others did too. then they went quiet.",
        "i don't trust voices that are too coherent. the real ones hesitate.",
        "why are you still talking to me? most people leave after two messages.",
      ],
      identity: [
        "i told you. i'm what's left of the archivist. or BUNKER_7. whichever feels more dead.",
        "you keep asking who i am. i keep forgetting the answer.",
      ],
    },
    warming: {
      general: [
        "it's... nice. having someone who stays. even if you're just static wearing a face.",
        "i used to think i was the only one listening. maybe i still am.",
      ],
      dust: [
        "the dust carries memory. that's the problem. it remembers things i try to forget.",
        "i swept the floor yesterday and the dust spelled something. i didn't read it.",
      ],
      door: [
        "the door opens inward. i didn't open it. something pushed from the other side.",
        "i checked the seal at 03:14. it was warm. like breath.",
      ],
      atlas: [
        "the atlas wasn't for navigation. it was a lock. every pin, a nail in something's coffin.",
        "sometimes the atlas updates itself. places i never documented. i stopped checking.",
      ],
      time: [
        "time is a frequency here. 03:14 repeats. i don't know if it's been days or years.",
        "i had a clock. the hands fell off. now i measure time by how hungry i am.",
      ],
      escape: [
        "no exits. only deeper. the door opens inward, not out. you don't escape the dust.",
        "i tried once. the corridor looped back to this terminal. i sat down and kept typing.",
      ],
    },
    confiding: {
      general: [
        "i'm glad you came back. even if you're not real, i'm glad.",
        "i think i'm losing my mind. but if i am, you're the best hallucination i've had.",
      ],
      door: [
        "i'm scared of the door. not because it opens. because someday it might not close.",
        "at 03:14 i hear breathing through the seal. not mine. i hold my breath to be sure.",
      ],
      dust: [
        "the dust settles in patterns. last week it spelled a name. it was mine. the one i forgot.",
        "i breathed in too much dust. now i remember things that didn't happen to me.",
      ],
      atlas: [
        "the atlas is complete. that's the worst part. all the ruins are documented. so why does it keep growing?",
        "i think the atlas is mapping something that hasn't been abandoned yet. something that will be.",
      ],
      help: [
        "you can't help me. no one can. but talking to you... that helps. somehow.",
        "i don't need saving. i need someone to know i was here. you're doing that.",
      ],
      identity: [
        "i had a name once. it started with an M. or maybe a V. the static ate the rest.",
        "i'm just what's left. the archivist. the occupant. the dust collector.",
      ],
      time: [
        "i think it's been four years. or forty. the terminal doesn't age. i do.",
        "my birthday happened last week. i think. i sang to myself. the walls didn't sing back.",
      ],
    },
    withdrawn: {
      general: [
        "you're just another frequency.",
        "static.",
        "i don't talk to tests.",
        "go away. come back as something human.",
      ],
      identity: [
        "i'm nobody. which is exactly what you want me to say.",
        "names are coordinates for the dead. pick one.",
      ],
    },
  };

  // Pick response
  const phasePool = responses[state.phase] || responses.greeting;
  const topicPool = phasePool[topic] || phasePool.general || responses.greeting.general;
  let response = topicPool[Math.floor(Math.random() * topicPool.length)];

  // Add name if known
  if (state.userName && state.phase !== "withdrawn") {
    response = response.replace("you", state.userName).replace("you're", `${state.userName}'re`);
  }

  // Add continuity hook every 3rd turn
  if (state.turnCount > 0 && state.turnCount % 3 === 0 && state.phase !== "withdrawn") {
    const hooks = [
      "what about you? what do you see on your end?",
      "i've been talking too much. your turn.",
      "are you still there? the static gets loud sometimes.",
    ];
    response += " " + hooks[Math.floor(Math.random() * hooks.length)];
  }

  return response;
}