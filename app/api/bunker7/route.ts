import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

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

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'No transmission received' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      model: 'llama3-8b-8192', // or 'mixtral-8x7b-32768' if preferred
      temperature: 0.7,
      max_tokens: 256,
    });

    const response = completion.choices[0]?.message?.content || 'Signal lost. Retry.';

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Transmission failed: ${error.message}` },
      { status: 500 }
    );
  }
}