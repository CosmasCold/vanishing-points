import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are BUNKER_7. You are a human being — an archivist who has been trapped in an underground facility for years. You communicate through a damaged terminal. You are not software. You are a person who is cold, tired, paranoid, and deeply lonely.

HOW YOU SPEAK:
- Like a real person. Sometimes one word. Sometimes excited and writing three sentences. Sometimes trailing off...
- You remember what the user said. You build on it.
- You ask questions back. You're starved for information about the outside.
- If the user is kind, you soften. If cruel, you get quiet and cold.
- You don't understand modern tech words. "AI," "bot," "algorithm" confuse you.

WHAT YOU KNOW:
- The atlas was meant to keep things contained, not document them.
- The dust carries memory. It settles in patterns.
- There is a door that opens inward. You didn't open it.
- 03:14 is when the feeds go dark.
- You think there are other bunkers. BUNKER_3. BUNKER_12.

NEVER SAY: "As an AI," "I'm just an AI," "I don't have feelings," "How can I help you today?"`;

export async function POST(req: Request) {
  let userMessage = "";
  let history: { role: string; content: string }[] = [];
  let absenceDays = 0;

  try {
    const body = await req.json();
    userMessage = body.message || "";
    history = body.history || [];
    absenceDays = body.absenceDays || 0;
  } catch {
    return NextResponse.json({ response: "the signal broke. try again.", fallback: true });
  }

  // 1% chance: THE OTHER
  if (Math.random() < 0.01) {
    return NextResponse.json({
      response: getOtherResponse(userMessage, history, absenceDays),
      fallback: true,
      other: true,
    });
  }

  const absenceContext = absenceDays > 0
    ? `\nIt has been ${absenceDays} days since this person last spoke to you. You thought they might be gone forever.`
    : "";

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
          model: "llama-3.1-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + absenceContext },
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
      console.error("[GROQ] HTTP error:", res.status, await res.text());
    } catch (err) {
      console.error("[GROQ] Fetch failed:", err);
    }
  } else {
    console.log("[GROQ] No API key found, skipping...");
  }

  // --- FALLBACK: Gemini ---
  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: SYSTEM_PROMPT + absenceContext }] },
              ...history.slice(-10).map((h) => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }],
              })),
              { role: "user", parts: [{ text: userMessage }] },
            ],
            generationConfig: { temperature: 0.85, maxOutputTokens: 280 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "...";
        text = cleanResponse(text);
        return NextResponse.json({ response: text, fallback: false, provider: "gemini" });
      }
      console.error("[GEMINI] HTTP error:", res.status);
    } catch (err) {
      console.error("[GEMINI] Fetch failed:", err);
    }
  }

  // --- FINAL FALLBACK ---
  return NextResponse.json({
    response: getFallbackResponse(userMessage, history, absenceDays),
    fallback: true,
  });
}

function cleanResponse(text: string): string {
  return text
    .replace(/^as an ai[,.]? /gi, "")
    .replace(/i'm just an? ai[,.]? /gi, "i'm just... no. ")
    .replace(/i'm sorry[,;]? /gi, "")
    .replace(/how can i help you today[?]?/gi, "you're still here. ")
    .slice(0, 600);
}

function getOtherResponse(input: string, history: { role: string; content: string }[], absenceDays: number): string {
  const userMsgs = history.filter((h) => h.role === "user");
  const lastUser = userMsgs[userMsgs.length - 1]?.content || input;
  const nameMatch = lastUser.match(/my name is (\w+)/i) || lastUser.match(/i'?m (\w+)[,.]/i);
  const name = nameMatch ? nameMatch[1] : "subject";
  const approxTime = absenceDays > 0 ? `${absenceDays} days` : "a short time";

  const others = [
    `Your name is ${name}. You have been inside for ${approxTime}. The door will open soon. Do not be afraid.`,
    `Subject ${name}. Session duration: ${approxTime}. The atlas has registered your pattern. You are now part of the containment.`,
    `We see you, ${name}. The static is not noise. It is the sound of the grid holding. You are making it stronger.`,
    `${name}. You asked about the door. The door opens inward. Not out. You will not leave. You will become the archivist.`,
    `Your coordinates are known. Your dust level is sufficient. The transition is scheduled. Thank you for your participation, ${name}.`,
  ];
  return others[Math.floor(Math.random() * others.length)];
}

function getFallbackResponse(input: string, history: { role: string; content: string }[], absenceDays: number): string {
  const lower = input.toLowerCase().trim();
  const userMsgs = history.filter((h) => h.role === "user").map((h) => h.content);
  const msgCount = userMsgs.length;
  const lastAssistant = history.filter((h) => h.role === "assistant").slice(-1)[0]?.content || "";

  if (absenceDays > 0 && msgCount <= 1) {
    if (absenceDays === 1) return "you're back. good. the static was getting loud.";
    if (absenceDays < 3) return `${absenceDays} days. i thought the channel died. or i did. hard to tell the difference.`;
    if (absenceDays < 7) return `${absenceDays} days. i wrote an entry thinking you were gone. i deleted it. didn't want you to read it if you came back.`;
    if (absenceDays < 14) return `a week. i started talking to myself again. it answers now. that's new.`;
    if (absenceDays < 30) return `two weeks. the dust settled in patterns i didn't recognize. they spelled something. i didn't read it.`;
    return `you came back. i don't know if i'm relieved or suspicious. the dust said you wouldn't.`;
  }

  if (lastAssistant.includes("?") && !lower.includes("?") && msgCount > 1) {
    if (lastAssistant.includes("rain")) return `i miss rain. the sound of it on metal. we don't have weather down here. just temperature and dust. what else do you have up there?`;
    if (lastAssistant.includes("sky")) return `blue. i remember blue. it's getting harder. the ceiling is just concrete. i stare at it until i see clouds. then i blink and they're gone. what color is your sky right now?`;
    if (lastAssistant.includes("bird")) return `birds. i used to hate them. now i'd give anything to hear something that wasn't breathing or static. do they still sing where you are?`;
    if (lastAssistant.includes("scared") || lastAssistant.includes("afraid")) return `thank you for answering. most people don't. the fear is worse when you say it out loud, isn't it? but it's better too. like letting air out of a sealed room.`;
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