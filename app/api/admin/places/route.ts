import { NextRequest, NextResponse } from "next/server";
import dbConnect, { PlaceModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    // Show approved, pending, and legacy docs. Only hide rejected.
    const places = await PlaceModel.find({
      $or: [
        { status: "approved" },
        { status: "pending" },
        { status: { $exists: false } },
        { status: null },
        { status: "" },
      ],
    })
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({ places });
  } catch (error) {
    console.error("GET /api/places error:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.name || !body.coordinates || !body.address || !body.history) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const existing = await PlaceModel.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "A place with this name already exists" },
        { status: 409 }
      );
    }

    const place = await PlaceModel.create({
      ...body,
      slug,
      status: "pending", // User submissions still queue for approval
      viewCount: 0,
      submittedAt: new Date(),
    });

    return NextResponse.json(
      {
        place,
        message:
          "Your discovery has been logged in the archives. Awaiting verification.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/places error:", error);
    return NextResponse.json(
      { error: "Failed to create place" },
      { status: 500 }
    );
  }
}