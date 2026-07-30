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
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const now = Date.now();
    const entry = parties.get(partyId);

    if (!entry) {
      parties.set(partyId, { codes: [code], timestamp: now });
      return NextResponse.json({
        status: "waiting",
        needed: REQUIRED - 1,
        message: "First witness registered. Two more required within 5 minutes.",
      });
    }

    // Clean old entries
    if (now - entry.timestamp > WINDOW_MS) {
      parties.set(partyId, { codes: [code], timestamp: now });
      return NextResponse.json({
        status: "waiting",
        needed: REQUIRED - 1,
        message: "Window expired. New session started.",
      });
    }

    if (entry.codes.includes(code)) {
      return NextResponse.json({
        status: "waiting",
        needed: REQUIRED - entry.codes.length,
        message: "Code already registered. Share the party ID with others.",
      });
    }

    entry.codes.push(code);
    parties.set(partyId, entry);

    if (entry.codes.length >= REQUIRED) {
      const legendaryCode = "TRINITY-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      parties.delete(partyId);
      return NextResponse.json({
        status: "complete",
        code: legendaryCode,
        message: "Tri-party authentication successful. Legendary asset unlocked.",
      });
    }

    return NextResponse.json({
      status: "waiting",
      needed: REQUIRED - entry.codes.length,
      message: `Witness ${entry.codes.length}/${REQUIRED} registered.`,
    });
  } catch {
    return NextResponse.json({ error: "System failure" }, { status: 500 });
  }
}