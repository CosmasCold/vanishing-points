import { NextResponse } from "next/server";
import dbConnect, { PlaceModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Defensive: works in Next.js 14 (sync) and 15 (async params)
    const params = await Promise.resolve(context.params);
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    await dbConnect();

    const place = await PlaceModel.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!place) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ viewCount: place.viewCount });
  } catch (err) {
    console.error("View increment error:", err);
    return NextResponse.json(
      { error: "Failed to increment views" },
      { status: 500 }
    );
  }
}