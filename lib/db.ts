import mongoose, { Schema, Document, Model } from "mongoose";

export interface PlaceAddress {
  city: string;
  country: string;
  formatted?: string;
}

export interface PlaceDocument extends Document {
  name: string;
  slug: string;
  category: "abandoned" | "haunted" | "both";
  coordinates: [number, number]; // [longitude, latitude]
  address: PlaceAddress;
  yearAbandoned?: number;
  history: string;
  dangerLevel: number;
  photos: string[];
  hauntingReports?: string[];
  viewCount: number;
  status: "pending" | "approved" | "rejected";
  contributorName?: string;
  contributorEmail?: string;
  submittedAt: Date;
}

const PlaceSchema = new Schema<PlaceDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ["abandoned", "haunted", "both"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      index: "2dsphere",
    },
    address: {
      city: { type: String, required: true },
      country: { type: String, required: true },
      formatted: { type: String },
    },
    yearAbandoned: { type: Number },
    history: { type: String, required: true },
    dangerLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 1,
    },
    photos: { type: [String], default: [] },
    hauntingReports: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    contributorName: { type: String },
    contributorEmail: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from name if not provided
PlaceSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

// Connection cache for serverless
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export const PlaceModel: Model<PlaceDocument> =
  mongoose.models.Place || mongoose.model<PlaceDocument>("Place", PlaceSchema);

export default dbConnect;