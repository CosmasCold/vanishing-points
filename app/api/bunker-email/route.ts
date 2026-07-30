import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email?.includes("@")) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }

    // Store it
    const key = "bunker-emails";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({ email, date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));

    // Alert yourself
    await resend.emails.send({
      from: "BUNKER_7 <bunker7@vanishingpoints.space>",
      to: "gabrieldentler3@gmail.com", // <-- your real email
      subject: `New Witness: ${email}`,
      text: `Witness registered: ${email}\nDate: ${new Date().toLocaleString()}\n\nCheck terminal for details.`,
    });

    // Confirm to user
    await resend.emails.send({
      from: "BUNKER_7 <bunker7@vanishingpoints.space>",
      to: email,
      subject: "FREQUENCY REGISTERED",
      text: `You are now in the relay.

The archivist will transmit when the static permits.

Do not reply. This channel is one-way.

BUNKER_7`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Relay failed" }, { status: 500 });
  }
}