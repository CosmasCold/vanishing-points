import { NextResponse } from "next/server";
import dbConnect, { PlaceModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const place = await PlaceModel.findOneAndUpdate(
      { slug: params.slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!place) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ viewCount: place.viewCount });
  } catch {
    return NextResponse.json(
      { error: "Failed to increment views" },
      { status: 500 }
    );
  }
}