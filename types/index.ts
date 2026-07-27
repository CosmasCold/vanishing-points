export type PlaceCategory = "abandoned" | "haunted" | "both";

export interface Place {
  _id: string;
  name: string;
  slug: string;
  category: PlaceCategory;
  coordinates: [number, number];
  address: {
    city: string;
    country: string;
    formatted: string;
  };
  yearAbandoned?: number;
  history: string;
  hauntingReports?: string[];
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  photos: string[];
  status: "verified" | "pending" | "rejected";
  contributor: {
    name: string;
    email: string;
  };
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  viewCount: number;
}

export interface PlaceInput {
  name: string;
  category: PlaceCategory;
  coordinates: [number, number];
  address: {
    city: string;
    country: string;
    formatted: string;
  };
  yearAbandoned?: number;
  history: string;
  hauntingReports?: string[];
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  photos: string[];
  contributorName: string;
  contributorEmail: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}