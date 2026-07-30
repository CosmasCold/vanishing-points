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

    // Alert yourself
    await resend.emails.send({
      from: "BUNKER_7 <bunker7@vanishingpoints.space>",
      to: "coldcosmas@gmail.com", // <-- your real email here
      subject: `New Witness: ${email}`,
      text: `Witness registered: ${email}\nDate: ${new Date().toLocaleString()}`,
    });

    // Confirm to witness
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