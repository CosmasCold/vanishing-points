import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('vanishing-points');
    const documents = await db.collection('documents').find({}).toArray();
    return NextResponse.json(documents);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}