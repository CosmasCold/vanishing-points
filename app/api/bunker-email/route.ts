import { NextResponse } from "next/server";
import { Resend } from "resend";
import { EMAILS } from "@/lib/emails/bunkerSequence";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, dayIndex } = await req.json(); // dayIndex 0-6
  
  const emailData = EMAILS[dayIndex];
  if (!emailData) return NextResponse.json({ error: "Invalid day" }, { status: 400 });

  await resend.emails.send({
    from: "BUNKER_7 <bunker7@vanishingpoints.space>",
    to: email,
    subject: emailData.subject,
    html: emailData.html,
  });

  return NextResponse.json({ sent: true });
}