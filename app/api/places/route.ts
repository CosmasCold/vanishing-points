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

    console.log(
      `[api/places] MongoDB returned ${places.length} places.`
    );

    return NextResponse.json(places, {
      headers: {
        ...noStoreHeaders,
        'x-atlas-source': 'mongodb',
      },
    });
  } catch (error: any) {
    console.error(
      '[api/places] MongoDB failed:',
      error?.message || error
    );

    return NextResponse.json(LOCAL_PLACES, {
      status: 503,
      headers: {
        ...noStoreHeaders,
        'x-atlas-source': 'local-cache',
      },
    });
  }
}