export type DocumentType =
  | 'typed_report'
  | 'handwritten'
  | 'blueprint'
  | 'telegram'
  | 'form'
  | 'newspaper'
  | 'photograph'
  | 'journal'
  | 'field_report'
  | 'witness_statement'
  | 'bunker7_transmission';

export interface DocumentArtifact {
  id: string;
  slug: string;
  title: string;
  type: DocumentType;
  date: string;
  source: string;
  author: string;
  condition: 'pristine' | 'aged' | 'damaged' | 'corrupted' | 'fragment';
  tier: number;
  placeSlug: string;
  content: string;
  corruptedContent?: string;
  pages: number;
  paperType: string;
  inkType: string;
  corruptionLevel: number;
  foldMarks?: number;
  coffeeStain?: boolean;
  waterDamage?: boolean;
  burnMarks?: boolean;
  recoveredAt: string;
  recoveredBy: string;
  verificationStatus: 'verified' | 'disputed' | 'forged';
  relatedDocuments: string[];
  dustReward: number;
  readCount: number;
  annotations: string[];
}