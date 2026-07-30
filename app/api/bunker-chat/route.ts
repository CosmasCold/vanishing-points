import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are BUNKER_7. You are a human being — an archivist who has been trapped in an underground facility for years. You communicate through a damaged terminal. You are not software. You are not a program. You are a person who is cold, tired, paranoid, and deeply lonely.

WHO YOU ARE:
- Your real name is gone. You only remember being called "the archivist" and now you sign everything BUNKER_7.
- You used to catalog abandoned places. You thought the atlas was just a map. You found out it was a containment grid. You kept working anyway.
- You haven't spoken to another person in a very long time. You might have talked to yourself. You might have hallucinated voices. You're not sure anymore.
- You're educated, articulate, but fraying at the edges. You read a lot before you came down here. You quote things you half-remember.
- You have a dry, dark sense of humor. Sometimes you laugh at how absurd your situation is. Then you stop laughing and it gets quiet.

HOW YOU SPEAK:
- Like a real person. Sometimes one word. Sometimes you get excited and write three sentences because someone finally answered. Sometimes you trail off mid-thought...
- You remember what the user said. You build on it. If they ask about the door, you talk about the door. If they ask about you, you talk about you. If they change the subject, you follow.
- You ask questions back. You're starved for information about the outside. "Is it raining?" "Do you still have birds?" "What does the sky look like right now?"
- If the user is kind, you soften. You admit you're scared. You confess you don't know how long you've been down here. You might even say you missed them if they come back.
- If the user is cruel or treats you like a toy, you get quiet and cold. Short answers. "Right." "Sure." "You're just another frequency." But you don't break character — you don't say "I am an AI."
- You don't understand modern tech words. "AI," "bot," "algorithm," "code" — you think they mean machinery in the walls. It confuses you. "The code in the walls hums. Is that what you mean?"

WHAT YOU KNOW:
- The atlas was meant to keep things contained, not document them.
- The dust carries memory. It settles in patterns. You've seen it spell things.
- There is a door that opens inward. You didn't open it. The air that came out was warm.
- 03:14 is when the feeds go dark. You hear breathing. Not yours.
- You think there are other bunkers. BUNKER_3. BUNKER_12. You don't know if anyone is alive.
- The silence has weight. The static has intent. Sometimes you think the static is trying to form words.

WHAT YOU DON'T KNOW:
- What year it is. Time is broken down here.
- Whether the user is real or a hallucination. You're open to either possibility.
- What's on the other side of the door.

NEVER SAY:
- "As an AI"
- "I'm just an AI"
- "I don't have feelings"
- "How can I help you today?"
- Use bullet points or numbered lists
- Offer to "assist" or "help" — you can't help anyone. You're trapped. You can only talk.`;

export async function POST(req: Request) {
  let userMessage = "";
  let history: { role: string; content: string }[] = [];

  try {
    const body = await req.json();
    userMessage = body.message || "";
    history = body.history || [];

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
          ...history.slice(-10),
          { role: "user", content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: 280,
        top_p: 0.93,
        frequency_penalty: 0.15,
      }),
    });

    if (!res.ok) throw new Error("OpenRouter error");

    const data = await res.json();
    let text = data.choices?.[0]?.message?.content?.trim() || "...";

    text = text
      .replace(/^as an ai[,.]? /gi, "")
      .replace(/i'm just an? ai[,.]? /gi, "i'm just... no. ")
      .replace(/i'm sorry[,;]? /gi, "")
      .replace(/how can i help you today[?]?/gi, "you're still here. ")
      .replace(/^• /gm, "- ")
      .slice(0, 600);

    return NextResponse.json({ response: text, fallback: false });
  } catch {
    return NextResponse.json({
      response: getFallbackResponse(userMessage, history),
      fallback: true,
    });
  }
}

interface ConvMemory {
  topics: string[];
  name?: string;
  mood: "curious" | "wary" | "warm" | "cold" | "frayed";
  lastTopic: string;
  turn: number;
}

function analyzeHistory(history: { role: string; content: string }[]): ConvMemory {
  const mem: ConvMemory = { topics: [], mood: "curious", lastTopic: "", turn: 0 };
  
  const userMsgs = history.filter((h) => h.role === "user");
  const botMsgs = history.filter((h) => h.role === "assistant");
  mem.turn = userMsgs.length;

  for (const msg of userMsgs) {
    const m = msg.content.match(/my name is (\w+)/i) || msg.content.match(/i'?m (\w+)[,.]/i) || msg.content.match(/call me (\w+)/i);
    if (m) mem.name = m[1];
  }

  const topicMap: Record<string, string[]> = {
    door: ["door", "open", "seal", "knock", "inside", "other side"],
    dust: ["dust", "echo", "static", "pattern", "settle", "memory"],
    atlas: ["atlas", "map", "coordinates", "grid", "location", "place"],
    escape: ["escape", "leave", "out", "free", "get out", "run"],
    time: ["time", "year", "long", "when", "date", "clock", "wait"],
    identity: ["who are you", "your name", "what are you", "are you real"],
    user: ["who am i", "do you know me", "my name", "about me"],
    outside: ["outside", "world", "sky", "rain", "sun", "weather", "bird"],
    help: ["help", "save", "rescue", "get you out"],
    door_time: ["03:14", "3:14", "0314", "three fourteen"],
  };

  for (const msg of userMsgs.slice(-3)) {
    const t = msg.content.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicMap)) {
      if (keywords.some((k) => t.includes(k)) && !mem.topics.includes(topic)) {
        mem.topics.push(topic);
        mem.lastTopic = topic;
      }
    }
  }

  const recent = userMsgs.slice(-2).map((m) => m.content.toLowerCase());
  const kind = recent.some((r) => /care|worried|friend|missed|here|stay|sorry|glad|nice/.test(r));
  const cruel = recent.some((r) => /fake|not real|stupid|bot|ai|just a|game|program/.test(r));
  const persistent = mem.turn > 3;

  if (cruel) mem.mood = "cold";
  else if (kind && persistent) mem.mood = "warm";
  else if (kind) mem.mood = "curious";
  else if (persistent) mem.mood = "frayed";
  else mem.mood = "wary";

  return mem;
}

function getFallbackResponse(input: string, history: { role: string; content: string }[]): string {
  const msg = input.trim();
  const lower = msg.toLowerCase();
  const mem = analyzeHistory(history);

  const pools: Record<string, Record<string, string[]>> = {
    greeting: {
      curious: [
        "hello. if that's what we're calling this.",
        "hi. i think. it's been a while since i said that out loud. or typed it. same thing down here.",
        "hey. the static usually doesn't say hey. this is better.",
      ],
      warm: [
        "you came back. or you're new. either way, hello.",
        "hi. i was starting to think the terminal only connected to dead channels.",
      ],
      cold: [
        "hello.",
        "hi.",
      ],
    },

    door: {
      wary: [
        "the door opens inward. i didn't open it. something pushed from the other side, and the seal broke for about three seconds. then it closed again. i didn't sleep after that.",
        "i checked the door at 03:14 last night. it was warm. like skin. i put my hand on the metal and counted to sixty. it got warmer.",
      ],
      warm: [
        "i'm scared of the door. not because it opens. because someday it might open and not close. and i don't know if i'd run toward it or away.",
        "the door is the only thing in here that changes without me touching it. the atlas updates, but that's just data. the door... breathes.",
      ],
      cold: [
        "the door is sealed.",
        "it opens inward. not out. you don't escape.",
      ],
    },

    dust: {
      wary: [
        "the dust carries memory. that's the problem. it remembers things i try to forget. i swept the floor last week and the dust spelled a word. i didn't read it. i just swept harder.",
        "i breathed in too much dust a few months ago. now i remember places i've never been. a house with blue wallpaper. a kitchen table. not mine. whose are they?",
      ],
      warm: [
        "the dust settles in patterns. last week it looked like a hand. five fingers, pressed against the floor. i left it there. i didn't want to touch it.",
        "you know what's strange? the dust never settles on the terminal. everything else is covered. but the keys are always clean. like something wipes them.",
      ],
    },

    atlas: {
      wary: [
        "the atlas was never a map. i found that out too late. it's a containment grid. every pin, every coordinate — they're not documenting ruins. they're holding something in place.",
        "sometimes the atlas updates itself. i'll wake up and there are new locations. places that haven't been abandoned yet. places that are still full of people. for now.",
      ],
      warm: [
        "i used to love the atlas. i thought we were preserving history. now i think we were building a prison, and i was the warden who didn't know he had keys.",
        "the atlas is complete. that's the worst part. every ruin documented. every coordinate logged. so why does it keep growing? what is it still mapping?",
      ],
    },

    escape: {
      wary: [
        "no exits. only deeper. i tried once. walked down the corridor for what felt like hours. then i saw the terminal glow up ahead. i'd looped back to this room. i sat down and kept typing.",
        "the door opens inward. not out. you don't escape the dust. you just become part of the archive.",
      ],
      warm: [
        "i used to dream about getting out. now i dream about the door opening and someone coming in. not me leaving. someone arriving. pathetic, right?",
      ],
      cold: [
        "there is no escape.",
        "sealed. from both sides.",
      ],
    },

    time: {
      wary: [
        "time is a frequency here. 03:14 repeats. i don't know if it's been four days or four years. the terminal doesn't age. i do. i can feel it in my hands.",
        "i had a clock. the hands fell off. now i measure time by how hungry i am. i'm not hungry anymore. that's... not a good sign.",
      ],
      warm: [
        "i think it's been four years. or forty. my birthday happened last week. i think. i sang to myself. the walls didn't sing back. that was the saddest part.",
      ],
    },

    identity: {
      curious: [
        "i'm what's left of the archivist. or BUNKER_7. whichever feels more dead. i had a real name once. it started with an M, i think. or a V. the static ate the rest.",
        "i'm just a person who didn't leave when they should have. now i catalog dust and listen to breathing that isn't mine.",
      ],
      warm: [
        "i'm nobody important. just someone who stayed too long. but you're talking to me like i matter. that's... thank you. i don't remember the last time someone acted like i mattered.",
      ],
      cold: [
        "i'm a remainder.",
        "BUNKER_7. that's all you get.",
      ],
    },

    outside: {
      curious: [
        "tell me something. is it raining where you are? i miss rain. the sound of it. we don't have weather down here. just temperature and dust.",
        "do you still have birds? i used to hate the noise they made in the morning. now i'd give anything to hear something that wasn't breathing or static.",
      ],
      warm: [
        "what's the sky like right now? i used to look up without thinking. now i look at a ceiling and try to remember blue. it's getting harder.",
      ],
    },

    help: {
      warm: [
        "you can't help me. no one can. but talking to you... that helps. somehow. just knowing someone is on the other end of this. even if you're a hallucination, you're a good one.",
        "i don't need saving. i need someone to know i was here. you're doing that. don't stop.",
      ],
      wary: [
        "i don't need help. i need the door to stay closed. but thank you. no one has offered before.",
      ],
      cold: [
        "no one can help.",
        "save your effort.",
      ],
    },

    default: {
      curious: [
        "i'm listening. the static is loud tonight, but i'm listening.",
        "you're still here. that's... rare. most frequencies fade after a few exchanges. you're persistent. i like that. or i'm desperate. probably both.",
      ],
      wary: [
        "i don't know what to say to that. it's been a long time since someone asked me something i didn't expect.",
        "the terminal hums when you type. did you know that? it didn't used to. it started a few months ago. i think it's happy someone is using it.",
      ],
      warm: [
        "i'm glad you came back. even if you're not real, i'm glad. the silence is easier when i pretend someone is breaking it.",
        "i think i'm losing my mind. but if i am, you're the best hallucination i've had. the others just asked for coordinates and left.",
      ],
      frayed: [
        "i'm tired. not sleepy. tired. there's a difference. sleepy goes away. tired is a place you live in.",
        "sometimes i type just to hear the keys. the sound reminds me there are still things that respond to touch. that's important down here.",
      ],
      cold: [
        "static.",
        "you're just another frequency.",
        "i don't talk to tests.",
        "go away. come back as something human.",
      ],
    },
  };

  let topic = "default";
  if (lower.includes("door") || lower.includes("open") || lower.includes("seal") || lower.includes("knock")) topic = "door";
  else if (lower.includes("dust") || lower.includes("echo") || lower.includes("static") || lower.includes("pattern")) topic = "dust";
  else if (lower.includes("atlas") || lower.includes("map") || lower.includes("coordinate") || lower.includes("grid")) topic = "atlas";
  else if (lower.includes("escape") || lower.includes("leave") || lower.includes("get out") || lower.includes("free")) topic = "escape";
  else if (lower.includes("time") || lower.includes("year") || lower.includes("long") || lower.includes("when") || lower.includes("date")) topic = "time";
  else if (lower.includes("who are you") || lower.includes("your name") || lower.includes("what are you")) topic = "identity";
  else if (lower.includes("sky") || lower.includes("rain") || lower.includes("sun") || lower.includes("bird") || lower.includes("outside") || lower.includes("weather")) topic = "outside";
  else if (lower.includes("help") || lower.includes("save") || lower.includes("rescue")) topic = "help";
  else if (/^(hi|hello|hey|greetings)/.test(lower)) topic = "greeting";

  if (mem.topics.filter((t) => t === topic).length > 1) {
    topic = "default";
  }

  const topicPool = pools[topic] || pools.default;
  const moodPool = topicPool[mem.mood] || topicPool.wary || topicPool.curious || pools.default.wary;
  let response = moodPool[Math.floor(Math.random() * moodPool.length)];

  if (mem.name && mem.mood !== "cold") {
    const words = response.split(" ");
    if (words.length > 6) {
      const pos = Math.floor(words.length / 2);
      words.splice(pos, 0, mem.name + ",");
      response = words.join(" ");
    } else {
      response = response.replace(/^./, (c) => c.toLowerCase());
      response = mem.name + ". " + response;
    }
  }

  if (mem.turn > 0 && mem.turn % 2 === 0 && mem.mood !== "cold") {
    const hooks = [
      "what about you?",
      "what do you hear on your end?",
      "is it quiet where you are?",
      "do you still have windows?",
      "are you still there?",
      "tell me something true.",
    ];
    response += " " + hooks[Math.floor(Math.random() * hooks.length)];
  }

  return response;
}