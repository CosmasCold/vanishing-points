import { NextResponse } from 'next/server';
import dbConnect, { PlaceModel } from '@/lib/db';
import { LOCAL_PLACES } from '@/data/places';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

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
    return NextResponse.json(places, { headers: noStoreHeaders });
  } catch (error: any) {
    console.warn('[api/places] Remote archive unavailable. Using local cache.', error?.message);

    return NextResponse.json(LOCAL_PLACES, {
      headers: {
        ...noStoreHeaders,
        'x-atlas-source': 'local-cache',
      },
    });
  }
}
