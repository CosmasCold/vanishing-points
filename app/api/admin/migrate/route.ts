import { NextResponse } from "next/server";
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

  // First, see what's actually in the database
  const breakdown = await PlaceModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Approve everything that isn't explicitly rejected
  const result = await PlaceModel.updateMany(
    {
      $or: [
        { status: "pending" },
        { status: { $exists: false } },
        { status: null },
        { status: "" },
      ],
    },
    { $set: { status: "approved" } }
  );

  // Get updated breakdown
  const afterBreakdown = await PlaceModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return NextResponse.json({
    ok: true,
    before: breakdown,
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount,
    after: afterBreakdown,
    message: `Migration complete. ${result.modifiedCount} places approved. ${result.matchedCount} matched total.`,
  });
}