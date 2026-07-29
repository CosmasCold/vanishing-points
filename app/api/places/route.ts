import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect, { PlaceModel } from "@/lib/db";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("vp_admin")?.value === "1";
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const places = await PlaceModel.find({}).sort({ submittedAt: -1 }).lean();

  return NextResponse.json({ places });
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...updates } = await req.json();

  await dbConnect();
  await PlaceModel.findByIdAndUpdate(id, updates, { new: true });

  return NextResponse.json({ ok: true });
}