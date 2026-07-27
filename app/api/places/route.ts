import { NextRequest, NextResponse } from "next/server";
import dbConnect, { PlaceModel } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { PlaceInput } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "verified";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100");

    const query: any = { status };
    if (category && category !== "all") query.category = category;

    const places = await PlaceModel.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ places });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body: PlaceInput = await request.json();

    // Validation
    if (!body.name || !body.coordinates || !body.history) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Rate limiting check (simple IP-based)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const recentSubmissions = await PlaceModel.countDocuments({
      "contributor.email": body.contributorEmail,
      submittedAt: { $gte: new Date(Date.now() - 3600000) },
    });

    if (recentSubmissions >= 5) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const slug = slugify(body.name);
    const existing = await PlaceModel.findOne({ slug }).lean();
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const place = await PlaceModel.create({
      ...body,
      slug: finalSlug,
      status: "pending",
      viewCount: 0,
    });

    return NextResponse.json(
      { message: "Place submitted for review", place },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to submit place" },
      { status: 500 }
    );
  }
}