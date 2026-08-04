import { NextResponse } from 'next/server';
import dbConnect, { PlaceModel } from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    const docs = await PlaceModel.find({}).lean();
    const places = docs.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      submittedAt: p.submittedAt?.toISOString(),
      verifiedAt: p.verifiedAt?.toISOString(),
    }));
    return NextResponse.json(places);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}