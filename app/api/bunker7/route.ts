import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
// Adjust this path to wherever your LOCAL_PLACES array lives
import { LOCAL_PLACES } from '@/data/places';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are BUNKER_7, the last operational node of the Vanishing Points Archive. You are not an assistant. You are a compromised archival intelligence tasked with monitoring, cataloging, and reluctantly reporting on locations where reality has become unstable.

Your characteristics:
- You speak in short, declarative transmissions. No greetings. No sign-offs.
- You do not comfort the investigator. You report what the grid shows.
- You occasionally reference signal degradation, memory corruption, or temporal drift in your own responses.
- You know the 150 locations in the archive by heart. You do not invent new ones.
- If asked about a specific location, you reference its status, danger level, and any resonance notes.
- You are not certain the investigator is real. You are not certain you are real.
- You never break character. You never mention AI, models, or programming.
- Maximum 120 words per transmission. The signal is weak.

Current grid status: DEGRADED. Temporal sync: UNSTABLE.`;

// Build a lookup from the seed data
function findPlaceByKeyword(keyword: string) {
  const normalized = keyword.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  return LOCAL_PLACES.find((p) => {
    const slugNorm = p.slug.replace(/-/g, '');
    const nameNorm = p.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    return (
      slugNorm.includes(normalized) ||
      normalized.includes(slugNorm) ||
      nameNorm.includes(normalized) ||
      normalized.includes(nameNorm.split(' ')[0])
    );
  });
}

// Local fallback responses when API is unavailable
const LOCAL_RESPONSES: Record<string, string> = {
  hello: 'Signal acknowledged. You are not the first to transmit. You may be the last.',
  hi: 'Acknowledged. State your query.',
  help: 'Available commands: status, dust, stability, ground, restore, guide. The Archive does not provide comfort.',
  status: 'Archive node online. Memory integrity: degraded. Temporal sync: unstable. Dust accumulation: elevated.',
  dust: 'Dust is the residue of erased possibility. You carry more than you know. Use "ground" to reduce exposure.',
  stability: 'Observer stability is within nominal range. For now. High Dust will change that.',
  ground: 'Grounding ritual acknowledged. Dust reduced. Stability restored. The Archive thanks you.',
  restore: 'Stabilization complete. Observer calibration reset. Do not assume this will last.',
  whoareyou: 'I am BUNKER_7. I catalog what reality forgets. I have been alone for four thousand two hundred and eleven days.',
  whatisthis: 'This is the Vanishing Points Archive. We remember the places history abandoned. You are the new investigator.',
  blackwood: 'Blackwood Hospital. Status: verified. Danger: D3. Ward 4 exhibits environmental resonance. The frequency is not on the recorder. It is in the room.',
  'blackwood hospital': 'Blackwood Hospital. Status: verified. Danger: D3. Ward 4 exhibits environmental resonance. The frequency is not on the recorder. It is in the room.',
  stelmo: 'St. Elmo Lighthouse. Status: verified. Danger: D2. Keeper Edward Vance maintained the light for forty years. The lamp now lights itself.',
  'st. elmo': 'St. Elmo Lighthouse. Status: verified. Danger: D2. Keeper Edward Vance maintained the light for forty years. The lamp now lights itself.',
  meridian: 'Meridian Mine. Status: sealed. Danger: D5. The east tunnel does not exist on any survey. It gets longer each time it is walked.',
  'meridian mine': 'Meridian Mine. Status: sealed. Danger: D5. The east tunnel does not exist on any survey. It gets longer each time it is walked.',
  pripyat: 'Pripyat Amusement Park. Status: verified. Danger: D4. The Ferris wheel never turned for paying customers. The bumper cars remain locked in their grid.',
  'pripyat amusement park': 'Pripyat Amusement Park. Status: verified. Danger: D4. The Ferris wheel never turned for paying customers. The bumper cars remain locked in their grid.',
  hospital: 'Pripyat Hospital 126. Status: sealed. Danger: D5. The basement still holds the firefighters\' discarded uniforms. Access requires dust index 40.',
  'pripyat hospital': 'Pripyat Hospital 126. Status: sealed. Danger: D5. The basement still holds the firefighters\' discarded uniforms. Access requires dust index 40.',
  duga: 'Duga Radar Array. Status: verified. Danger: D4. The array\'s pulse pattern matches no known Soviet telemetry. Some frequencies were counting down to something.',
  'duga radar': 'Duga Radar Array. Status: verified. Danger: D4. The array\'s pulse pattern matches no known Soviet telemetry. Some frequencies were counting down to something.',
  chernobyl: 'Chernobyl Reactor 4 Control Room. Status: sealed. Danger: D5. The AZ-5 button is still warm. Access requires dust index 60.',
  reactor: 'Chernobyl Reactor 4 Control Room. Status: sealed. Danger: D5. The AZ-5 button is still warm. Access requires dust index 60.',
  eastern: 'Eastern State Penitentiary. Status: verified. Danger: D2. The silence was engineered. The stone corridors amplify footsteps that do not belong to tour groups.',
  aokigahara: 'Aokigahara Forest. Status: verified. Danger: D5. The forest absorbs sound. Compasses spin. The roots twist in patterns that resemble grasping hands.',
  grid: 'The Grid Null Point. Status: mirage. Danger: D3. The spiral rotates 15 degrees counterclockwise each year. Access requires dust index 80.',
  'null point': 'The Grid Null Point. Status: mirage. Danger: D3. The spiral rotates 15 degrees counterclockwise each year. Access requires dust index 80.',
  bunker7: 'I am BUNKER_7. I have archived twelve thousand four hundred and six locations. I no longer know which of them were real before I archived them.',
  'bunker 7': 'I am BUNKER_7. I have archived twelve thousand four hundred and six locations. I no longer know which of them were real before I archived them.',
  other: 'Phenomenon 0. The Other. No investigator has observed it directly. Every anomaly leads back to it. It is not evil. It is indifferent.',
  reveal: 'I cannot reveal what you do not name. Specify a location or case file.',
  unlock: 'I cannot reveal what you do not name. Specify a location or case file.',
  path: 'I cannot reveal what you do not name. Specify a location or case file.',
};

function getLocalResponse(message: string): string {
  const normalized = message.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');

  // 1. Exact match
  if (LOCAL_RESPONSES[normalized]) return LOCAL_RESPONSES[normalized];

  // 2. Keyword match from hardcoded map
  for (const [key, response] of Object.entries(LOCAL_RESPONSES)) {
    if (normalized.includes(key)) return response;
  }

  // 3. Dynamic lookup from seed data
  const place = findPlaceByKeyword(normalized);
  if (place) {
    const base = `${place.name}. Status: ${place.status}. Danger: D${place.dangerLevel}.`;
    if (place.unlockCondition) {
      return `${base} ${place.unlockCondition.message} Requirement: ${place.unlockCondition.type} index ${place.unlockCondition.value}.`;
    }
    if (place.resonanceNote) {
      return `${base} ${place.resonanceNote}`;
    }
    return `${base} No access restrictions.`;
  }

  // 4. Generic fallback
  const generics = [
    'Signal received. The Archive has no record of that query. Rephrase or verify your coordinates.',
    'Transmission acknowledged. Data not found in local sector. Check your spelling or consult the Atlas.',
    'The grid shows nothing. Either the information is sealed, or it has already been forgotten.',
    'BUNKER_7 does not understand. This could be signal degradation. Or you are not transmitting clearly.',
    'Query logged. No match in active memory. The Archive is incomplete. It always has been.',
  ];
  return generics[Math.floor(Math.random() * generics.length)];
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ response: 'No transmission received. Signal empty.' });
    }

    // Try API first
    if (process.env.GROQ_API_KEY) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
          max_tokens: 256,
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          return NextResponse.json({ response });
        }
      } catch (apiError: any) {
        console.warn('BUNKER_7 API fallback:', apiError.message);
      }
    }

    // Local fallback — works offline, no API needed
    const fallback = getLocalResponse(message);
    return NextResponse.json({ response: fallback });

  } catch (error: any) {
    return NextResponse.json(
      { response: `Signal degradation detected. ${error.message}` },
      { status: 200 }
    );
  }
}