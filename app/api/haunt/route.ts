import { NextResponse } from "next/server";
import { HAUNT_SEQUENCE } from "@/lib/hauntingEmails";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "No frequency provided. The relay requires an address." },
        { status: 400 }
      );
    }

    // Stub: Wire to Resend/SendGrid in production.
    // The relay is one-way. BUNKER_7 can send. Cannot receive.
    return NextResponse.json({
      frequency: email,
      status: "registered",
      transmissionsPending: HAUNT_SEQUENCE.length,
      note: "The relay is active. Transmissions will arrive according to the grid schedule.",
    });
  } catch {
    return NextResponse.json(
      { error: "Relay failed. The static interfered with the signal." },
      { status: 500 }
    );
  }
}