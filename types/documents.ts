export type DocumentType = 
  | 'typed_report'      // Institutional, monospaced, clean or carbon-copied
  | 'handwritten'       // Cursive or print, ink bleed, personal
  | 'blueprint'         // Technical drawings, grid lines, annotations
  | 'telegram'          // All-caps, faded tape, urgent
  | 'form'              // Boxes, stamps, bureaucracy
  | 'newspaper'         // Columns, ink transfer, age spots
  | 'photograph'        // Glossy or matte, borders, developer marks
  | 'journal';          // Bound pages, margin notes, bookmarks

export interface DocumentArtifact {
  id: string;
  type: DocumentType;
  title: string;
  content: string;              // The text
  date: string;
  author: string;
  source: string;               // Where it was found
  condition: 'pristine' | 'worn' | 'damaged' | 'fragment';
  
  // Physical properties
  paperAge: number;             // 0-100, affects yellowing
  hasFoldMarks: boolean;
  hasCoffeeRing: boolean;
  hasTornCorner: boolean;
  hasAnnotation: boolean;
  annotationText?: string;
  
  // Provenance
  collectedBy: string;
  collectedDate: string;
  verificationStatus: 'verified' | 'suspected' | 'forged';
  
  // Related
  relatedEvidenceIds: string[];
  relatedPlaceSlugs: string[];
}