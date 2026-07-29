import { NextResponse } from "next/server";
import dbConnect, { PlaceModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const place = await PlaceModel.findOne({ slug: params.slug }).lean();

    if (!place) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ place });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch place" },
      { status: 500 }
    );
  }
}