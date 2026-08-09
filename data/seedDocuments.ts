import { DocumentArtifact } from "@/types/documents";

/**
 * PRODUCTION-READY CLASSIFIED DOSSIERS ARCHIVE SEED
 * Wired directly to unredacting Consensus Gates [145, 148].
 */
export const SEED_DOCUMENTS: DocumentArtifact[] = [
  {
    "id": "doc-esp-001",
    "slug": "eastern-state-field-report",
    "title": "Field Report #2847-A \u2014 Eastern State Penitentiary",
    "type": "field_report",
    "date": "1971-07-01",
    "source": "BUNKER_7",
    "author": "Archival Division, Agent 7-4",
    "condition": "aged",
    "tier": 0,
    "placeSlug": "eastern-state-penitentiary",
    "content": "When it opened in 1829, Eastern State was the most expensive building in America. Its radial floor plan \u2014 seven cell blocks extending from a central hub like the spokes of a wheel \u2014 became the architectural model for over 300 prisons worldwide. The system of extreme isolation was meant to foster absolute penitence, but instead it broke the sanity of those kept under its gaze. The corridors still reflect structural hums that match no electrical layout.",
    "pages": 2,
    "paperType": "bond",
    "inkType": "ballpoint",
    "corruptionLevel": 0.3,
    "foldMarks": 1,
    "waterDamage": true,
    "recoveredAt": "2024-02-01T00:00:00Z",
    "recoveredBy": "system",
    "verificationStatus": "verified",
    "relatedDocuments": [],
    "dustReward": 8,
    "readCount": 0,
    "annotations": [
      "The laughter is not on the recording when I am in the corridor. The laughter is on the recording when I have left."
    ]
  },
  {
    "id": "doc-ph-001",
    "slug": "pripyat-hospital-basement-log",
    "title": "Basement Log \u2014 Hospital 126, Pripyat",
    "type": "field_report",
    "date": "1986-04-28",
    "source": "archive_recovery",
    "author": "Liquidator Unit 7",
    "condition": "corrupted",
    "tier": 2,
    "placeSlug": "pripyat-hospital-126",
    "content": "The basement of Hospital 126 contains the discarded uniforms of the first firefighters who responded to Reactor 4. Radiation levels remain too high for extended human presence. The uniforms have been sealed behind lead-lined doors since 1987. Geiger counter readings: 15,000 roentgen at the door. 40,000 roentgen at the uniform pile. The pile has not been moved.",
    "corruptedContent": "The basement of Hospital 126 contains the discarded uniforms of the first firefighters who responded to Reactor 4. [REDACTED SECTION] [ERROR: DUST LEVEL SATURATION REACHED] The geophones are not clicking. The geophones are breathing.",
    "pages": 4,
    "paperType": "thermal",
    "inkType": "carbon",
    "corruptionLevel": 0.7,
    "burnMarks": true,
    "recoveredAt": "2024-02-05T00:00:00Z",
    "recoveredBy": "system",
    "verificationStatus": "disputed",
    "relatedDocuments": [],
    "dustReward": 15,
    "readCount": 0,
    "annotations": [
      "The Geiger counter in the basement ticks louder when you are watching. It is listening."
    ]
  },
  {
    "id": "doc-arch-1962-001",
    "slug": "archivist-arrival-log-1962",
    "title": "Personnel Transfer Record \u2014 Archivist INV_RED-7",
    "type": "typed_report",
    "date": "1962-03-15",
    "source": "archive_recovery",
    "author": "Dr. H. Vance, Personnel Division",
    "condition": "aged",
    "tier": 3,
    "placeSlug": "eastern-state-penitentiary",
    "content": "PERSONNEL TRANSFER \u2014 ARCHIVAL DIVISION. Date: March 15, 1962. Subject has completed 4,211 days of continuous archival service. Subject does not age in photographs. Subject does not appear in mirror reflections taken within facility grounds. Subject refers to the Archive as 'the room that grew around me.' Subject entered the basement carrel at 1800 hours and has not emerged. The light beneath the door is not the color of our bulbs.",
    "pages": 2,
    "paperType": "bond",
    "inkType": "typewriter",
    "corruptionLevel": 0.1,
    "foldMarks": 2,
    "coffeeStain": true,
    "recoveredAt": "2024-05-01T00:00:00Z",
    "recoveredBy": "system",
    "verificationStatus": "verified",
    "relatedDocuments": [],
    "dustReward": 25,
    "readCount": 0,
    "annotations": [
      "Subject's shadow shows a different posture than subject's body."
    ]
  },
  {
    "id": "doc-mwe-4.5hz",
    "slug": "mount-weather-geodetic-analysis",
    "title": "Declassified Survey: Blue Ridge Triangulation",
    "type": "field_report",
    "date": "2026-08-08",
    "source": "FEMA / Geodetic Survey Division",
    "author": "Archival Division, Agent 7-4",
    "condition": "aged",
    "tier": 2,
    "placeSlug": "mount-weather-emergency-operations-center",
    "content": "FEMA / GEODETIC SURVEY DIVISION DECLASSIFIED SIGNAL ANALYSIS REPORT. Subject: BLUE RIDGE MOUNTAIN RESONANCE AND TRIANGULATION. Date: August 8, 2026. Author: Agent 7-4, Archival Division. We have confirmed a severe spatial folding phenomenon along the summer solstice axis between Lebanon, Kansas (The Grid Null Point) and Stull Cemetery, Kansas. Net Spatial Compression: -125.38 km (72.7% compression). The space between these coordinates is actively collapsing. The seismic arrays at Mount Weather (Virginia), Cheyenne Mountain (Colorado), and Raven Rock (Pennsylvania) are vibrating in perfect, synchronized unison at a sub-audible frequency of 4.5 Hz.",
    "pages": 2,
    "paperType": "bond",
    "inkType": "typewriter",
    "corruptionLevel": 0.1,
    "foldMarks": 2,
    "coffeeStain": true,
    "recoveredAt": "2026-08-08T12:00:00Z",
    "recoveredBy": "system",
    "verificationStatus": "verified",
    "relatedDocuments": [],
    "dustReward": 15,
    "readCount": 0,
    "annotations": [
      "The center of the triangle is 40 kilometers from nowhere in Kansas.",
      "The future transmission in Tokyo has a date. The date is currently in our future."
    ]
  }
];
