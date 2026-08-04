export type PlaceCategory = "abandoned" | "haunted" | "both";

export type { Place } from '@/logic/gameState';

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