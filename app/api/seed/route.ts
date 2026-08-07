import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the mapped places from the generated file
    const filePath = path.join(process.cwd(), 'scripts', 'mapped-places.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { places } = JSON.parse(raw);

    if (!Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: 'No mapped places found' }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 });
    }

    const db = client.db('vanishing-points');

    // Clear existing and insert mapped data
    await db.collection('places').deleteMany({});
    const result = await db.collection('places').insertMany(places);

    return NextResponse.json({
      success: true,
      inserted: result.insertedCount,
      total: places.length,
      tiers: places.reduce((acc: Record<number, number>, p: any) => {
        acc[p.tier] = (acc[p.tier] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}