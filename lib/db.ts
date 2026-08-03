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
  coordinates: [number, number];
  address: PlaceAddress;
  yearAbandoned?: number;
  history: string;
  dangerLevel: number;
  photos: string[];
  hauntingReports?: string[];
  viewCount: number;
  status: "pending" | "verified" | "rejected" | "sealed" | "whispered" | "mirage";
  contributor?: {
    name: string;
    email: string;
  };
  contributorName?: string; // legacy
  contributorEmail?: string; // legacy
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  unlockCondition?: {
    type: "dust" | "code" | "inventory" | "visit" | "reading" | "time";
    value: string | number;
    message: string;
  };
  connectedTo?: string[];
  resonanceNote?: string;
}

const UnlockConditionSchema = new Schema(
  {
    type: { type: String, enum: ["dust", "code", "inventory", "visit", "reading", "time"] },
    value: Schema.Types.Mixed,
    message: String,
  },
  { _id: false }
);

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
      enum: ["pending", "verified", "rejected", "sealed", "whispered", "mirage"],
      default: "verified",
    },
    contributor: {
      name: String,
      email: String,
    },
    contributorName: { type: String },
    contributorEmail: { type: String },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    unlockCondition: { type: UnlockConditionSchema, required: false },
    connectedTo: { type: [String], default: [] },
    resonanceNote: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PlaceSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

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