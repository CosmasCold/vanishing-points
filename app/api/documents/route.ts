import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 });
    }

    const db = client.db('vanishing-points');
    const documents = await db.collection('documents').find({}).toArray();
    return NextResponse.json(documents);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}