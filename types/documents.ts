export type DocumentType = 
  | 'field_report' 
  | 'witness_statement' 
  | 'internal_memo' 
  | 'photograph' 
  | 'audio_transcript' 
  | 'blueprint' 
  | 'telegram' 
  | 'journal_entry'
  | 'bunker7_transmission';

export type DocumentCondition = 'pristine' | 'aged' | 'damaged' | 'corrupted' | 'unreadable';

export type DocumentSource = 'BUNKER_7' | 'field_agent' | 'contributor' | 'archive_recovery' | 'unknown';

export interface DocumentArtifact {
  id: string;
  slug: string;
  title: string;
  type: DocumentType;
  date: string;
  source: DocumentSource;
  author?: string;
  condition: DocumentCondition;
  tier: number;
  placeSlug: string;
  content: string;
  corruptedContent?: string;
  pages: number;
  paperType: 'bond' | 'thermal' | 'newsprint' | 'photographic' | 'handmade';
  inkType: 'typewriter' | 'ballpoint' | 'fountain' | 'carbon' | 'print' | 'marker';
  corruptionLevel: number;
  foldMarks?: number;
  coffeeStain?: boolean;
  burnMarks?: boolean;
  waterDamage?: boolean;
  mediaUrl?: string;
  audioUrl?: string;
  recoveredAt: string;
  recoveredBy: string;
  verificationStatus: 'verified' | 'pending' | 'disputed';
  relatedDocuments: string[];
  dustReward: number;
  readCount: number;
  lastReadAt?: string;
  annotations: DocumentAnnotation[];
}

export interface DocumentAnnotation {
  id: string;
  text: string;
  highlightStart: number;
  highlightEnd: number;
  note: string;
  createdAt: string;
}

export interface DocumentFilter {
  type?: DocumentType;
  condition?: DocumentCondition;
  tier?: number;
  placeSlug?: string;
  source?: DocumentSource;
  search?: string;
}