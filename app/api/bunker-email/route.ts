import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Store for later haunting
    const key = "bunker-emails";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({ email, date: new Date().toISOString(), haunted: false });
    localStorage.setItem(key, JSON.stringify(existing));

    // If you have Resend/SendGrid, wire it here:
    // await resend.emails.send({...})

    console.log(`[BUNKER EMAIL] ${email} registered for haunting.`);

    return NextResponse.json({ success: true, message: "The archivist will remember your frequency." });
  } catch {
    return NextResponse.json({ error: "Transmission failed" }, { status: 500 });
  }
}