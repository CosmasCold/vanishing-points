export interface EvidenceItem {
  id: string;
  type: 'document' | 'witness' | 'signal' | 'photo' | 'audio' | 'video' | 'personal' | 'artifact';
  title: string;
  description: string;
  source?: string;
  status: 'collected' | 'analyzing' | 'analyzed';
  relatedTo: string[];
  mediaUrl?: string;
  unlockDust?: number;
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