import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory store (use Redis in production)
const parties = new Map<string, { codes: string[]; timestamp: number }>();

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const REQUIRED = 3;

export async function POST(req: Request) {
  try {
    const { partyId, code } = await req.json();

    if (!partyId || !code) {
      return NextResponse.json({ error: "Transmission incomplete. partyId and code required." }, { status: 400 });
    }

    const now = Date.now();
    const entry = parties.get(partyId);

    if (!entry) {
      parties.set(partyId, { codes: [code], timestamp: now });
      return NextResponse.json({
        status: "waiting",
        needed: REQUIRED - 1,
        message: "One witness detected. The grid requires three voices within five minutes.",
      });
    }

    // Clean old entries
    if (now - entry.timestamp > WINDOW_MS) {
      parties.set(partyId, { codes: [code], timestamp: now });
      return NextResponse.json({
        status: "waiting",
        needed: REQUIRED - 1,
        message: "The grid forgot. It remembers only what is simultaneous. New convergence started.",
      });
    }

    if (entry.codes.includes(code)) {
      return NextResponse.json({
        status: "waiting",
        needed: REQUIRED - entry.codes.length,
        message: "Frequency already registered. The grid waits for distinct voices.",
      });
    }

    entry.codes.push(code);
    parties.set(partyId, entry);

    if (entry.codes.length >= REQUIRED) {
      const convergenceCode = "TRINITY-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      parties.delete(partyId);
      return NextResponse.json({
        status: "complete",
        code: convergenceCode,
        message: "Grid convergence complete. Three witnesses registered. The archive grows.",
      });
    }

    return NextResponse.json({
      status: "waiting",
      needed: REQUIRED - entry.codes.length,
      message: `Witness ${entry.codes.length}/${REQUIRED} detected. The grid is listening.`,
    });
  } catch {
    return NextResponse.json({ error: "Signal lost. The static interfered." }, { status: 500 });
  }
}