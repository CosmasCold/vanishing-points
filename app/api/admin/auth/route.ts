import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_CODE = process.env.ADMIN_CODE;

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!ADMIN_CODE || code !== ADMIN_CODE) {
    return NextResponse.json({ error: "Access denied. The grid seal remains intact." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("vp_admin", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return NextResponse.json({ status: "unsealed", message: "Grid maintenance authorized." });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("vp_admin");
  return NextResponse.json({ status: "sealed", message: "Maintenance session terminated. The vault is sealed." });
}

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get("vp_admin")?.value === "1") {
    return NextResponse.json({ status: "authorized" });
  }
  return NextResponse.json({ error: "Maintenance authorization required. The vault is sealed." }, { status: 401 });
}