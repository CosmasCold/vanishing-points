import { NextResponse } from "next/server";
import { HAUNT_SEQUENCE } from "@/lib/hauntingEmails";

export const dynamic = "force-dynamic";

// Wire this to Resend, SendGrid, etc.
// For now, it returns the email that SHOULD be sent, and you send it manually
// or automate it with a cron job calling this endpoint.

export async function POST(req: Request) {
  try {
    const { email, checkOnly } = await req.json();

    // In production, look up user in DB by email, check registration date
    // For now, we use localStorage via a client-side helper
    // This endpoint is designed to be called by a cron job or client poll

    return NextResponse.json({
      sequence: HAUNT_SEQUENCE,
      note: "Wire this to your email provider. Each email has sendAfterDays.",
      suggestion: "Set up a daily cron that checks all registered emails and sends pending haunts.",
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}