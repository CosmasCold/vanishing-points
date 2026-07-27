import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["abandoned", "haunted", "both"],
      required: true,
    },
    coordinates: { type: [Number], required: true, index: "2dsphere" },
    address: {
      city: String,
      country: String,
      formatted: String,
    },
    yearAbandoned: Number,
    history: { type: String, required: true },
    hauntingReports: [String],
    dangerLevel: { type: Number, min: 1, max: 5, default: 1 },
    photos: [String],
    status: {
      type: String,
      enum: ["verified", "pending", "rejected"],
      default: "pending",
    },
    contributor: {
      name: String,
      email: String,
    },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: Date,
    verifiedBy: String,
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

placeSchema.index({ coordinates: "2dsphere" });
placeSchema.index({ status: 1, category: 1 });
placeSchema.index({ slug: 1 });

export const PlaceModel =
  mongoose.models.Place || mongoose.model("Place", placeSchema);

export default dbConnect;