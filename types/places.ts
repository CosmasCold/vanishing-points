export type PlaceCategory = 'abandoned' | 'haunted' | 'both';
export type PlaceStatus = 'verified' | 'pending' | 'rejected' | 'sealed' | 'whispered' | 'mirage';

export interface Address {
  city: string;
  country: string;
  formatted: string;
}

export interface UnlockCondition {
  type: 'dust' | 'code' | 'inventory' | 'visit' | 'reading' | 'time';
  value: string | number;
  message: string;
}

export interface Place {
  slug: string;
  name: string;
  category: PlaceCategory;
  coordinates: [number, number];
  address: Address;
  yearAbandoned?: number;
  history: string;
  hauntingReports: string[];
  dangerLevel: number;
  photos: string[];
  status: PlaceStatus;
  contributor?: { name: string; email: string };
  viewCount: number;
  submittedAt: string;
  verifiedAt: string;
  verifiedBy: string;
  unlockCondition?: UnlockCondition;
  connectedTo: string[];
  resonanceNote?: string;
  
  // ─── OPTION A: NATIVE GEODETIC PROGRESSION TIERS ───
  tier?: number;
}
