import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect, { PlaceModel } from "@/lib/db";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("vp_admin")?.value === "1";
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Bulk-approve all pending places (your seeded data)
  const result = await PlaceModel.updateMany(
    { status: "pending" },
    { $set: { status: "approved" } }
  );

  // Also ensure any legacy docs without status are approved
  await PlaceModel.updateMany(
    { status: { $exists: false } },
    { $set: { status: "approved" } }
  );

  return NextResponse.json({
    ok: true,
    message: `Migration complete. ${result.modifiedCount} places approved.`,
  });
}