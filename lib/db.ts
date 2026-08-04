import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const PlaceSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['abandoned', 'haunted', 'both'] },
  coordinates: [Number],
  address: {
    city: String,
    country: String,
    formatted: String,
  },
  yearAbandoned: Number,
  history: String,
  hauntingReports: [String],
  dangerLevel: Number,
  photos: [String],
  status: { type: String, enum: ['verified', 'pending', 'rejected', 'sealed', 'whispered', 'mirage'] },
  contributor: {
    name: String,
    email: String,
  },
  viewCount: Number,
  submittedAt: Date,
  verifiedAt: Date,
  verifiedBy: String,
  unlockCondition: {
    type: { type: String },
    value: mongoose.Schema.Types.Mixed,
    message: String,
  },
  connectedTo: [String],
  resonanceNote: String,
});

export const PlaceModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);
export default dbConnect;