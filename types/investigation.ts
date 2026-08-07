export interface EvidenceItem {
  id: string;
  type: 'document' | 'witness' | 'signal' | 'photo' | 'audio' | 'video' | 'personal' | 'artifact';
  title: string;
  description: string;
  source?: string;
  status: 'locked' | 'available' | 'collected' | 'analyzing' | 'analyzed' | 'viewed';
  relatedTo: string[];
  mediaUrl?: string;
  /** Gated behind Dust or other conditions. */
  unlockCondition?: {
    message: string;
    value?: number; // dust cost to unlock
  };
  /** Flat cost for generated/derived evidence (alternative to unlockCondition). */
  dustCost?: number;
  timestamp?: string;
  metadata?: Record<string, string>;
  /** Years since document creation. Design pillar: "Documents are physical artifacts." */
  paperAge?: number;
  archivistCache?: number;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  evidenceIds: string[];
  certainty: 'confirmed' | 'suspected' | 'unverified';
  category: 'incident' | 'discovery' | 'anomaly';
}