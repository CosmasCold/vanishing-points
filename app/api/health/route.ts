import { NextResponse } from "next/server";
import dbConnect, { PlaceModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();

  const total = await PlaceModel.countDocuments();
  const approved = await PlaceModel.countDocuments({ status: "approved" });
  const pending = await PlaceModel.countDocuments({ status: "pending" });
  const rejected = await PlaceModel.countDocuments({ status: "rejected" });
  const legacy = await PlaceModel.countDocuments({ status: { $exists: false } });
  const nullStatus = await PlaceModel.countDocuments({ status: null });
  const emptyStatus = await PlaceModel.countDocuments({ status: "" });

  const sample = await PlaceModel.findOne().lean();

  return NextResponse.json({
    counts: { total, approved, pending, rejected, legacy, nullStatus, emptyStatus },
    hasData: total > 0,
    sample: sample
      ? {
          name: sample.name,
          slug: sample.slug,
          status: sample.status,
          hasCoordinates: !!sample.coordinates,
        }
      : null,
    message:
      total === 0
        ? "DATABASE IS EMPTY — re-seed required"
        : approved === 0 && pending > 0
        ? "All places are pending — run migration or check schema default"
        : "Database healthy",
  });
}