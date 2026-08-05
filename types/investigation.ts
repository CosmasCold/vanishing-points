export type EvidenceType = 'photo' | 'document' | 'audio' | 'video' | 'physical' | 'witness' | 'signal';
export type EvidenceStatus = 'locked' | 'available' | 'collected' | 'analyzing' | 'analyzed';

export type TimelineCategory = 'incident' | 'discovery' | 'anomaly' | 'testimony';
export type TimelineCertainty = 'confirmed' | 'uncertain' | 'theory';

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  source?: string;
  timestamp?: string;
  relatedTo: string[];
  status: EvidenceStatus;
  unlockCondition?: {
    type: 'dust' | 'evidence' | 'time' | 'visit';
    value: string | number;
    message: string;
  };
  mediaUrl?: string;
  metadata?: Record<string, string>;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  evidenceIds: string[];
  certainty: TimelineCertainty;
  category: TimelineCategory;
}