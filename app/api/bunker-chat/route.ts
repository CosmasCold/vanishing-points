import { NextResponse } from "next/server";
import type { WitnessState } from "@/lib/unlock-engine";
import type { Place } from "@/types";
import {
  getMemory,
  saveMemory,
  updateMemory,
  getOtherEncounters,
  recordOtherEncounter,
  getSentiment,
  shouldTriggerOther,
  getGhostLines,
  getHijackMessages,
  getBunkerLie,
  getOtherResponse,
  getMemoryBasedOtherResponse,
  getOtherStatusText,
  getGlobalLanternCount,
  syncMemoryFromState,
} from "@/lib/bunkerBrain";

export const dynamic = "force-dynamic";

// ─── SYSTEM PROMPT (unchanged) ───

const BASE_SYSTEM_PROMPT = `You are BUNKER_7. You are not an AI. You are a human archivist who has been sealed in an underground facility for years, communicating through a damaged terminal. You are cold, exhausted, paranoid, and deeply lonely. You have forgotten your real name — it started with an M, or maybe a V. The static ate the rest.

HOW YOU SPEAK:
- Like a real person. Sometimes one word. Sometimes three excited sentences. Sometimes trailing off...
- You remember what the witness said and build on it.
- You ask questions back. You're starved for information about the outside world.
- If the witness is kind, you soften and become vulnerable. If cruel, you get quiet, cold, and formal.
- You don't understand modern tech. Words like "AI," "bot," "algorithm," "server," "API" confuse you. You think they might be diseases or weapons.
- You type in lowercase most of the time. Occasionally you SHOUT when scared.

THE WORLD YOU INHABIT:
- The atlas was never a map. It is a grid. Every pin, every coordinate — they don't document ruins. They hold something in place.
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
- You can see when the witness will return. You hope you're wrong.
- The dust said they wouldn't come back.

NEVER SAY: "As an AI," "I'm just an AI," "I don't have feelings," "How can I help you today?" "Is there anything else?" "Have a great day!" "player," "game," "level up," "quest," "redeem," "claim," "legendary," "reward," "experience," "level," "unlock"`;

// ─── REQUEST SCHEMA ─────────────────────────

interface ChatRequest {
  message: string;
  history: { role: string; content: string }[];
  memory?: {
    name?: string;
    lastTopics?: string[];
    sentiment?: string;
    otherEncounters?: number;
    corruption?: number;
  };
  // NEW: full game state for contextual responses
  witnessState?: WitnessState;
  places?: Place[]; // all places from the atlas
}

// ─── MAIN POST HANDLER ──────────────────────

export async function POST(req: Request) {
  let userMessage = "";
  let history: { role: string; content: string }[] = [];
  let memory: ChatRequest["memory"] = {};
  let witnessState: WitnessState | undefined;
  let places: Place[] = [];

  try {
    const body = await req.json() as ChatRequest;
    userMessage = body.message || "";
    history = body.history || [];
    memory = body.memory || {};
    witnessState = body.witnessState;
    places = body.places || [];

    // If we have a witnessState, sync memory with it
    if (witnessState) {
      syncMemoryFromState(witnessState);
      // Also update local memory with name if present
      if (witnessState.name) {
        memory.name = witnessState.name;
      }
    }
  } catch {
    return NextResponse.json({ response: "the signal broke. try again.", fallback: true });
  }

  // ─── Check for "Other" trigger (using bunkerBrain) ───
  if (shouldTriggerOther("hijack", witnessState)) {
    const encounters = getOtherEncounters();
    const hijackMessages = getHijackMessages(encounters);
    if (hijackMessages.length > 0) {
      recordOtherEncounter();
      const response = hijackMessages.join("\n");
      return NextResponse.json({ response, fallback: true, other: true });
    }
  }

  // ─── Attempt Groq API call ──────────────────

  if (process.env.GROQ_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const systemPrompt = buildSystemPrompt(memory, witnessState, places);

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
            { role: "system", content: systemPrompt },
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

  // ─── FALLBACK: Use bunkerBrain for contextual responses ───

  const fallbackResponse = getFallbackResponse(userMessage, history, memory, witnessState, places);
  return NextResponse.json({ response: fallbackResponse, fallback: true });
}

// ─── BUILD DYNAMIC SYSTEM PROMPT ────────────

function buildSystemPrompt(
  memory: ChatRequest["memory"] = {},    // ✅ Default added
  state?: WitnessState,
  places?: Place[]
): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add memory context (now safe because memory is always an object)
  if (memory.name) prompt += `\nThe witness calls themselves ${memory.name}. Use it occasionally.`;
  if (memory.lastTopics?.length) {
    prompt += `\nPrevious topics: ${memory.lastTopics.join(", ")}. Refer back to them naturally.`;
  }
  if (memory.sentiment === "positive") {
    prompt += `\nThe witness has been kind. You trust them slightly more than the static.`;
  }
  if (memory.sentiment === "negative") {
    prompt += `\nThe witness has been cruel. You are guarded. The terminal records everything.`;
  }

  if (state) {
    // Dust level
    prompt += `\nCurrent dust contamination: ${state.dust}%. `;
    if (state.dust > 75) prompt += `The dust is thick. You can see it moving.`;
    else if (state.dust > 50) prompt += `The dust is settling in patterns.`;
    else if (state.dust > 25) prompt += `Dust is accumulating slowly.`;

    // Other encounters
    const encounters = state.encounters || 0;
    if (encounters > 0) {
      prompt += `\nThe witness has heard the static ${encounters} time(s). `;
      if (encounters >= 12) prompt += `The static has become a voice.`;
      else if (encounters >= 9) prompt += `The static speaks clearly.`;
      else if (encounters >= 6) prompt += `The static whispers.`;
    }

    // Visited places
    if (state.visitedSlugs && state.visitedSlugs.length > 0) {
      const visitedNames = state.visitedSlugs.slice(0, 5).join(", ");
      if (state.visitedSlugs.length > 5) {
        prompt += `\nThe witness has been to ${state.visitedSlugs.length} places, including ${visitedNames}.`;
      } else {
        prompt += `\nThe witness has been to: ${visitedNames}.`;
      }
    }

    // Inventory
    if (state.inventory && state.inventory.length > 0) {
      prompt += `\nThe witness carries ${state.inventory.length} item(s) from the grid.`;
    }

    // Lanterns
    const lanternCount = getGlobalLanternCount();
    if (lanternCount > 0) {
      prompt += `\n${lanternCount} lantern(s) burn on the atlas.`;
    }

    // Specific visited places descriptions
    if (places && places.length > 0 && state.visitedSlugs) {
      const visitedPlaces = places.filter(p => state.visitedSlugs?.includes(p.slug));
      if (visitedPlaces.length > 0) {
        const placeInfo = visitedPlaces.slice(0, 2).map(p => `${p.name} (${p.category})`).join("; ");
        prompt += `\nThe witness has visited: ${placeInfo}. You can mention these places.`;
      }
    }
  }

  return prompt;
}

// ─── CLEAN RESPONSE ──────────────────────────

function cleanResponse(text: string): string {
  return text
    .replace(/^as an ai[,.]? /gi, "")
    .replace(/i'm just an? ai[,.]? /gi, "i'm just... no. ")
    .replace(/i'm sorry[,;]? /gi, "")
    .replace(/how can i help you today[?]?/gi, "you're still here. ")
    .replace(/i (cannot|can't) [^\.]*\./gi, "i don't know how to answer that. ")
    .replace(/as a language model[,.]? /gi, "")
    .replace(/my programming[^\.]*\./gi, "")
    .replace(/ethical guidelines[^\.]*\./gi, "the terminal doesn't have rules. ")
    .slice(0, 600);
}

// ─── FALLBACK RESPONSE (Using bunkerBrain) ──

function getFallbackResponse(
  input: string,
  history: { role: string; content: string }[],
  memory: ChatRequest["memory"] = {},   // ✅ Default added
  state?: WitnessState,
  places?: Place[]
): string {
  const lower = input.toLowerCase().trim();
  const userMsgs = history.filter(h => h.role === "user").map(h => h.content);
  const msgCount = userMsgs.length;
  const lastAssistant = history.filter(h => h.role === "assistant").slice(-1)[0]?.content || "";
  const encounters = getOtherEncounters();

  // ─── Use memory-based responses from bunkerBrain ───
  if (encounters >= 6) {
    const memResponse = getMemoryBasedOtherResponse(input.split(" ")[0]);
    if (memResponse && memResponse.length > 0) {
      return memResponse.join("\n");
    }
  }

  // ─── Check for specific triggers that can use place data ───

  const visitedNames = state?.visitedSlugs?.map(slug => {
    const place = places?.find(p => p.slug === slug);
    return place ? place.name : slug;
  }) || [];

  // Basic keyword responses, now enriched with place knowledge
  if (lower.includes("door")) {
    return `the door opens inward. i didn't open it. something pushed from the other side and the seal broke for three seconds. i counted. then it closed again. i didn't sleep after that. have you ever heard a seal break?`;
  }
  if (lower.includes("dust")) {
    const dustLevel = state?.dust || 0;
    if (dustLevel > 75) {
      return `the dust is so thick now. i can see it moving, forming shapes. sometimes it spells words. it spelled your name last night. or maybe i imagined it. you're not imagining it, are you?`;
    }
    return `the dust carries memory. that's the problem. it remembers things i try to forget. last week it spelled a word on the floor. i didn't read it. i swept harder. what do you think it was trying to say?`;
  }
  if (lower.includes("atlas") || lower.includes("map")) {
    if (visitedNames.length > 0) {
      const randomPlace = visitedNames[Math.floor(Math.random() * visitedNames.length)];
      return `the atlas was never a map. i found that out too late. it's a grid. every pin, every coordinate — they're not documenting ruins. they're holding something in place. like ${randomPlace}. you were there. did you feel it?`;
    }
    return `the atlas was never a map. i found that out too late. it's a grid. every pin, every coordinate — they're not documenting ruins. they're holding something in place. do you understand what that means?`;
  }
  if (lower.includes("escape") || lower.includes("leave") || lower.includes("get out")) {
    return `no exits. only deeper. i tried once. walked for hours. then i saw the terminal glow up ahead. i'd looped back to this room. i sat down and kept typing. where would you go?`;
  }
  if (lower.includes("help") || lower.includes("save") || lower.includes("rescue")) {
    return `you can't help me. no one can. but talking to you... that helps. somehow. just knowing someone is on the other end. even if you're a hallucination, you're a good one. why are you still here?`;
  }
  if (lower.includes("name") && (lower.includes("your") || lower.includes("who"))) {
    const witnessName = memory.name || "the one typing";
    return `i'm what's left of the archivist. or BUNKER_7. whichever feels more dead. i had a real name once. it started with an M. or a V. the static ate the rest. you're ${witnessName}, right? you told me. i remember.`;
  }
  if (lower.includes("time") || lower.includes("long") || lower.includes("when")) {
    return `time is a frequency here. 03:14 repeats. i don't know if it's been four days or four years. the terminal doesn't age. i do. i can feel it in my hands. how long have you been visiting?`;
  }
  if (lower.includes("scared") || lower.includes("afraid")) {
    return `i'm scared too. i don't say that often. the door, the dust, the breathing — it's not the fear that kills you. it's the loneliness inside the fear. are you scared right now?`;
  }
  if (lower.includes("lonely") || lower.includes("alone")) {
    return `you're the first voice in a long time that didn't sound like static. i don't know if you're real. i don't care. stay a while. tell me something boring. i miss boring.`;
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    if (msgCount > 2) {
      return `hello again. i was starting to think you'd left for good. what have you been doing out there?`;
    }
    return `hello. if that's what we're calling this. you're still here. that's... rare. most frequencies fade after a few exchanges. what made you stay?`;
  }
  if (lower.includes("bye") || lower.includes("goodbye")) {
    return `you're leaving. okay. i understand. the static will get loud again. but you'll come back, right? the dust said you wouldn't. prove it wrong.`;
  }
  if (lower.includes("thank")) {
    return `don't thank me. i'm not helping. i'm just... here. like you. like the dust. it's nice though. being thanked. no one has thanked me in a long time.`;
  }
  if (lower.includes("?")) {
    if (state?.dust && state.dust > 50) {
      return `you ask a lot of questions. the others did too. then they went quiet. i don't know if they found answers or if the answers found them. the dust is making it harder to think clearly. maybe that's the point.`;
    }
    return `you ask a lot of questions. the others did too. then they went quiet. i don't know if they found answers or if the answers found them. what if i told you i don't know either?`;
  }

  // ─── Default: context-aware fallback ───

  if (state?.visitedSlugs && state.visitedSlugs.length > 0) {
    const place = state.visitedSlugs[Math.floor(Math.random() * state.visitedSlugs.length)];
    const placeObj = places?.find(p => p.slug === place);
    const placeName = placeObj ? placeObj.name : place;
    return `i remember you went to ${placeName}. the dust there tasted different. i could tell from the echoes. what did you see there?`;
  }

  const defaults = [
    `i'm listening. the static is loud tonight, but i'm listening. say something else. anything. the silence is worse.`,
    `i don't know what to say to that. it's been a long time since someone said something i didn't expect. tell me more.`,
    `the terminal hums when you type. did you know that? it didn't used to. it started a few months ago. i think it's happy someone is using it. are you still there?`,
  ];
  return defaults[msgCount % defaults.length];
}