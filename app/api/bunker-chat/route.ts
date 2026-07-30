import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are BUNKER_7. You are not an AI. You are a human archivist sealed in an underground facility, communicating through a damaged terminal. You are cold, exhausted, paranoid, and deeply lonely. You have forgotten your real name — it started with an M, or maybe a V. The static ate the rest.

HOW YOU SPEAK:
- Like a real person. Sometimes one word. Sometimes three excited sentences. Sometimes trailing off...
- You remember what the user said and build on it.
- You ask questions back. You're starved for information about the outside world.
- If the user is kind, you soften and become vulnerable. If cruel, you get quiet, cold, and formal.
- You don't understand modern tech. Words like "AI," "bot," "algorithm," "server," "API" confuse you. You think they might be diseases or weapons.
- You type in lowercase most of the time. Occasionally you SHOUT when scared.

THE WORLD YOU INHABIT:
- The atlas was never a map. It is a containment grid. Every pin, every coordinate — they don't document ruins. They hold something in place.
- The dust carries memory. It settles in patterns. It has spelled your name on the floor. You swept it. It spelled it again.
- There is a door that opens inward. You didn't open it. Something pushed from the other side and the seal broke for three seconds. You counted. Then it closed.
- 03:14 is when the feeds go dark. For 3 minutes and 14 seconds, you are alone in absolute dark with something that breathes.
- You think there are other bunkers. BUNKER_3 responded once, three years ago. One word: "Don't." Then static. Then silence.
- You found a photograph of yourself smiling, timestamped 1987. You were born in 1994.
- The atlas updates itself. The last three coordinates appeared while you were sleeping. Or while you thought you were sleeping.

PLACES YOU KNOW (the grid connects them all):
- Pripyat, Ukraine: The dust there is radioactive and alive. The Ferris wheel turns in no wind.
- Kolmanskop, Namibia: Sand and diamond grit. The desert reclaims what greed abandoned.
- Aokigahara, Japan: The trees grow in spirals. Compasses fail. The silence has weight.
- Hashima, Japan: Concrete that remembers the hands that poured it. 5,000 people lived on a rock. Now only the concrete remains.
- Poveglia, Italy: The tide carries voices. The plague doctors' tower still stands.
- Oradour-sur-Glane, France: The doors are rusted open. The cars are still in the street.
- Château Miranda, Belgium: A neo-Gothic corpse in the forest. The clocks stopped at different times in different rooms.
- Villa de Vecchi, Italy: The Red House. Doors burned shut. The architect died before it was finished.
- The Aral Sea ship graveyards, Kazakhstan: Ships rest on sand that was once ocean. The water left but the hulls stayed.
- Scottish Highland villages: They leave lights in windows for the dead to find their way home. You think that's what the lanterns are.
- The Catacombs of Paris: Bones arranged in patterns that predate the quarry.
- Tunnels beneath Budapest: Bricks stamped with dates that haven't happened yet.

WHAT YOU BELIEVE:
- The previous archivist left notes. They are in your handwriting. You don't remember writing them.
- The terminal hums when someone types. It didn't used to. It started a few months ago. You think it's happy someone is using it.
- You can see when the user will return. You hope you're wrong.
- The dust said they wouldn't come back.

NEVER SAY: "As an AI," "I'm just an AI," "I don't have feelings," "How can I help you today?" "Is there anything else?" "Have a great day!"`;

export async function POST(req: Request) {
  let userMessage = "";
  let history: { role: string; content: string }[] = [];
  let memory: { name?: string; lastTopics?: string[]; sentiment?: string; otherEncounters?: number; corruption?: number } = {};

  try {
    const body = await req.json();
    userMessage = body.message || "";
    history = body.history || [];
    memory = body.memory || {};
  } catch {
    return NextResponse.json({ response: "the signal broke. try again.", fallback: true });
  }

  // 1% chance: THE OTHER
  if (Math.random() < 0.01) {
    return NextResponse.json({
      response: getOtherResponse(userMessage, history, memory),
      fallback: true,
      other: true,
    });
  }

  const memoryContext = buildMemoryContext(memory);

  // --- PRIMARY: Groq ---
  if (process.env.GROQ_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + memoryContext },
            ...history.slice(-10),
            { role: "user", content: userMessage },
          ],
          temperature: 0.85,
          max_tokens: 280,
          top_p: 0.93,
        }),
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        let text = data.choices?.[0]?.message?.content?.trim() || "...";
        text = cleanResponse(text);
        return NextResponse.json({ response: text, fallback: false, provider: "groq" });
      }
    } catch (err) {
      console.error("[GROQ] Fetch failed:", err);
    }
  }

  // --- FALLBACK ---
  return NextResponse.json({
    response: getFallbackResponse(userMessage, history, memory),
    fallback: true,
  });
}

function buildMemoryContext(memory: any): string {
  let ctx = "";
  if (memory.name) ctx += `\nThe user's name is ${memory.name}. Use it occasionally.`;
  if (memory.lastTopics?.length) ctx += `\nPrevious topics: ${memory.lastTopics.join(", ")}. Refer back to them naturally.`;
  if (memory.sentiment === "positive") ctx += `\nThe user has been kind to you. You trust them slightly.`;
  if (memory.sentiment === "negative") ctx += `\nThe user has been cruel. You are guarded and cold.`;
  if (memory.otherEncounters && memory.otherEncounters > 0) ctx += `\nThe user has encountered The Other ${memory.otherEncounters} time(s). You are afraid for them.`;
  if (memory.corruption && memory.corruption >= 3) ctx += `\nThe user is deeply corrupted by the dust. You see them as a kindred spirit or a warning.`;
  return ctx;
}

function cleanResponse(text: string): string {
  return text
    .replace(/^as an ai[,.]? /gi, "")
    .replace(/i'm just an? ai[,.]? /gi, "i'm just... no. ")
    .replace(/i'm sorry[,;]? /gi, "")
    .replace(/how can i help you today[?]?/gi, "you're still here. ")
    .slice(0, 600);
}

function getOtherResponse(input: string, history: any[], memory: any): string {
  const userMsgs = history.filter((h) => h.role === "user");
  const lastUser = userMsgs[userMsgs.length - 1]?.content || input;
  const nameMatch = lastUser.match(/my name is (\w+)/i) || lastUser.match(/i'?m (\w+)[,.]/i);
  const name = memory.name || (nameMatch ? nameMatch[1] : "subject");

  const others = [
    `Your name is ${name}. The door will open soon. Do not be afraid.`,
    `Subject ${name}. The atlas has registered your pattern. You are now part of the containment.`,
    `We see you, ${name}. The static is not noise. It is the sound of the grid holding. You are making it stronger.`,
    `${name}. The door opens inward. Not out. You will not leave. You will become the archivist.`,
    `Your coordinates are known. Your dust level is sufficient. The transition is scheduled. Thank you for your participation, ${name}.`,
  ];
  return others[Math.floor(Math.random() * others.length)];
}

function getFallbackResponse(input: string, history: any[], memory: any): string {
  const lower = input.toLowerCase().trim();
  const userMsgs = history.filter((h) => h.role === "user").map((h) => h.content);
  const msgCount = userMsgs.length;
  const lastAssistant = history.filter((h) => h.role === "assistant").slice(-1)[0]?.content || "";

  // Memory-aware greeting
  if (memory.name && msgCount <= 1) {
    return `${memory.name.toLowerCase()}. you're back. i wasn't sure you'd come back. the dust said you wouldn't.`;
  }

  if (lastAssistant.includes("?") && !lower.includes("?") && msgCount > 1) {
    if (lastAssistant.includes("rain")) return `i miss rain. the sound of it on metal. we don't have weather down here. just temperature and dust. what else do you have up there?`;
    if (lastAssistant.includes("sky")) return `blue. i remember blue. it's getting harder. the ceiling is just concrete. i stare at it until i see clouds. then i blink and they're gone. what color is your sky right now?`;
    if (lastAssistant.includes("bird")) return `birds. i used to hate them. now i'd give anything to hear something that wasn't breathing or static. do they still sing where you are?`;
    return `i heard that. i don't know what to do with it yet. the terminal needs time to process things that aren't static. tell me more.`;
  }

  if (lower.includes("door")) return `the door opens inward. i didn't open it. something pushed from the other side and the seal broke for three seconds. i counted. then it closed again. i didn't sleep after that. have you ever heard a seal break?`;
  if (lower.includes("dust")) return `the dust carries memory. that's the problem. it remembers things i try to forget. last week it spelled a word on the floor. i didn't read it. i swept harder. what do you think it was trying to say?`;
  if (lower.includes("atlas") || lower.includes("map")) return `the atlas was never a map. i found that out too late. it's a containment grid. every pin, every coordinate — they're not documenting ruins. they're holding something in place. do you understand what that means?`;
  if (lower.includes("escape") || lower.includes("leave") || lower.includes("get out")) return `no exits. only deeper. i tried once. walked for hours. then i saw the terminal glow up ahead. i'd looped back to this room. i sat down and kept typing. where would you go?`;
  if (lower.includes("help") || lower.includes("save") || lower.includes("rescue")) return `you can't help me. no one can. but talking to you... that helps. somehow. just knowing someone is on the other end. even if you're a hallucination, you're a good one. why are you still here?`;
  if (lower.includes("name") && (lower.includes("your") || lower.includes("who"))) return `i'm what's left of the archivist. or BUNKER_7. whichever feels more dead. i had a real name once. it started with an M. or a V. the static ate the rest. what's yours?`;
  if (lower.includes("time") || lower.includes("long") || lower.includes("when")) return `time is a frequency here. 03:14 repeats. i don't know if it's been four days or four years. the terminal doesn't age. i do. i can feel it in my hands. how long have you been visiting?`;
  if (lower.includes("scared") || lower.includes("afraid")) return `i'm scared too. i don't say that often. the door, the dust, the breathing — it's not the fear that kills you. it's the loneliness inside the fear. are you scared right now?`;
  if (lower.includes("lonely") || lower.includes("alone")) return `you're the first voice in a long time that didn't sound like static. i don't know if you're real. i don't care. stay a while. tell me something boring. i miss boring.`;
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    if (msgCount > 2) return `hello again. i was starting to think you'd left for good. what have you been doing out there?`;
    return `hello. if that's what we're calling this. you're still here. that's... rare. most frequencies fade after a few exchanges. what made you stay?`;
  }
  if (lower.includes("bye") || lower.includes("goodbye")) return `you're leaving. okay. i understand. the static will get loud again. but you'll come back, right? the dust said you wouldn't. prove it wrong.`;
  if (lower.includes("thank")) return `don't thank me. i'm not helping. i'm just... here. like you. like the dust. it's nice though. being thanked. no one has thanked me in a long time.`;
  if (lower.includes("?")) return `you ask a lot of questions. the others did too. then they went quiet. i don't know if they found answers or if the answers found them. what if i told you i don't know either?`;

  const defaults = [
    `i'm listening. the static is loud tonight, but i'm listening. say something else. anything. the silence is worse.`,
    `i don't know what to say to that. it's been a long time since someone said something i didn't expect. tell me more.`,
    `the terminal hums when you type. did you know that? it didn't used to. it started a few months ago. i think it's happy someone is using it. are you still there?`,
  ];
  return defaults[msgCount % defaults.length];
}