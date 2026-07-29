import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_CODE = process.env.ADMIN_CODE;

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!ADMIN_CODE || code !== ADMIN_CODE) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("vp_admin", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("vp_admin");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get("vp_admin")?.value === "1") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}