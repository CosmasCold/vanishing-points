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
  const submissions = await PlaceModel.find({ status: "pending" })
    .sort({ submittedAt: -1 })
    .lean();

  return NextResponse.json({ submissions });
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await dbConnect();
  await PlaceModel.findByIdAndUpdate(id, { status });

  return NextResponse.json({ ok: true });
}