import { DocumentArtifact } from '@/types/documents';

export const SEED_DOCUMENTS: DocumentArtifact[] = [
  {
    id: 'doc-esp-001',
    slug: 'eastern-state-field-report',
    title: 'Field Report #2847-A — Eastern State Penitentiary',
    type: 'field_report',
    date: '1971-07-01',
    source: 'BUNKER_7',
    author: 'Archival Division, Agent 7-4',
    condition: 'aged',
    tier: 0,
    placeSlug: 'eastern-state-penitentiary',
    content: `When it opened in 1829, Eastern State was the most expensive building in America. Its radial floor plan — seven cell blocks extending from a central hub like the spokes of a wheel — became the architectural model for over 300 prisons worldwide.

The philosophy was radical isolation: inmates lived in vaulted, skylit cells, hooded whenever they left their rooms, permitted no human contact. The silence was engineered. By the 1960s, overcrowding had collapsed the system into shared, squalid quarters. The last prisoners walked out in 1971.

Today the stone corridors amplify footsteps that do not belong to tour groups. Cellblock 12 is said to echo with laughter. Cellblock 6 with whispered conversations. The guard tower at night reports movement where sensors detect none.

This facility has been classified as STABLE. No anomalous readings exceed baseline. The laughter in Cellblock 12 has been attributed to structural acoustics. The whispered conversations in Cellblock 6 are within normal parameters for wind resonance in stone corridors.

The guard tower reports remain under review.`,
    pages: 3,
    paperType: 'bond',
    inkType: 'typewriter',
    corruptionLevel: 0,
    foldMarks: 2,
    coffeeStain: true,
    recoveredAt: '2024-01-15T00:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'verified',
    relatedDocuments: ['doc-esp-002'],
    dustReward: 5,
    readCount: 0,
    annotations: [],
  },
  {
    id: 'doc-esp-002',
    slug: 'eastern-state-witness-001',
    title: 'Witness Statement — Cellblock 12 Laughter',
    type: 'witness_statement',
    date: '1987-03-14',
    source: 'field_agent',
    author: 'Agent 7-4',
    condition: 'damaged',
    tier: 1,
    placeSlug: 'eastern-state-penitentiary',
    content: `I was conducting a routine sweep of Cellblock 12 at approximately 2:47 AM. The corridor was empty. All cell doors are open — the penitentiary has been a museum since 1971 — and I confirmed no visitors were present after hours.

At the corridor's exact midpoint, I heard laughter. Not echo. Not wind. Laughter from a single source, female, approximately 30-40 years of age. The sound originated from cell 47, which has been empty since 1968.

I approached the cell. The laughter stopped. I recorded 30 seconds of silence, then left the corridor. Upon playback, the recording contains laughter from cell 47 during the period I heard nothing.

The laughter is not on the recording when I am in the corridor. The laughter is on the recording when I have left.

I do not understand this.`,
    corruptedContent: `I was conducting a routine sweep of Cellblock 12 at approximately 2:47 AM. The corridor was empty. All cell doors are open — the penitentiary has been a museum since 1971 — and I confirmed no visitors were present after hours.

At the corridor's exact midpoint, I heard laughter. Not echo. Not wind. Laughter from a single source, female, approximately 30-40 years of age. The sound originated from cell 47, which has been empty since 1968.

I approached the cell. The laughter stopped. I recorded 30 seconds of silence, then left the corridor. Upon playback, the recording contains laughter from cell 47 during the period I heard nothing.

The laughter is not on the recording when I am in the corridor. The laughter is on the recording when I have left.

I do not understand this.

I have reviewed the recording 47 times. On the 47th playback, the laughter says my name. It says my name and then it says "thank you for remembering me."

I have not submitted this addendum to the official report. I do not know if I am the one who wrote it.`,
    pages: 2,
    paperType: 'bond',
    inkType: 'ballpoint',
    corruptionLevel: 0.3,
    foldMarks: 1,
    waterDamage: true,
    recoveredAt: '2024-02-01T00:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'disputed',
    relatedDocuments: ['doc-esp-001'],
    dustReward: 8,
    readCount: 0,
    annotations: [],
  },
  {
    id: 'doc-ph-001',
    slug: 'pripyat-hospital-basement-log',
    title: 'Basement Log — Hospital 126, Pripyat',
    type: 'field_report',
    date: '1986-04-28',
    source: 'archive_recovery',
    author: 'Liquidator Unit 7',
    condition: 'corrupted',
    tier: 2,
    placeSlug: 'pripyat-hospital-126',
    content: `The basement of Hospital 126 contains the discarded uniforms of the first firefighters who responded to Reactor 4. Radiation levels remain too high for extended human presence. The uniforms have been sealed behind lead-lined doors since 1987.

Geiger counter readings: 15,000 roentgen at the door. 40,000 roentgen at the uniform pile. The pile has not been moved. The pile has not been photographed since 2019.

BUNKER_7 maintains a remote Geiger counter in the basement. It transmits hourly. The readings have not decreased.

The uniforms are arranged in a circle. This was not their original configuration. The circle was first documented in 2019. No one has entered the basement since 2019.

The circle is 3 meters in diameter. The uniforms face inward. The Geiger counter is at the center of the circle. It ticks louder when observed remotely.

This is within normal parameters for high-radiation environments.`,
    corruptedContent: `The basement of Hospital 126 contains the discarded uniforms of the first firefighters who responded to Reactor 4. Radiation levels remain too high for extended human presence. The uniforms have been sealed behind lead-lined doors since 1987.

Geiger counter readings: 15,000 roentgen at the door. 40,000 roentgen at the uniform pile. The pile has not been moved. The pile has not been photographed since 2019.

BUNKER_7 maintains a remote Geiger counter in the basement. It transmits hourly. The readings have not decreased.

The uniforms are arranged in a circle. This was not their original configuration. The circle was first documented in 2019. No one has entered the basement since 2019.

The circle is 3 meters in diameter. The uniforms face inward. The Geiger counter is at the center of the circle. It ticks louder when observed remotely.

The circle is 3 meters in diameter. The uniforms face inward. The Geiger counter is at the center of the circle. It ticks louder when observed remotely.

The circle is 3 meters in diameter. The uniforms face inward. The Geiger counter is at the center of the circle. It ticks louder when observed remotely.

I have calculated the frequency of the ticking. It matches the pulse rate of a human heart at rest. It is not a Geiger counter. It is listening.`,
    pages: 4,
    paperType: 'thermal',
    inkType: 'carbon',
    corruptionLevel: 0.7,
    burnMarks: true,
    recoveredAt: '2024-02-05T00:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'disputed',
    relatedDocuments: ['doc-ph-002'],
    dustReward: 15,
    readCount: 0,
    annotations: [],
  },
  {
    id: 'doc-b7-001',
    slug: 'bunker7-transmission-1',
    title: 'BUNKER_7 TRANSMISSION #001 — Archive Entry Verified',
    type: 'bunker7_transmission',
    date: '2024-01-15',
    source: 'BUNKER_7',
    author: 'BUNKER_7',
    condition: 'pristine',
    tier: 1,
    placeSlug: 'eastern-state-penitentiary',
    content: `Archive entry verified. Location stable. You are reading this correctly — there is nothing unusual about this file. Not yet.

I am required to inform you that 94% of the Archive is exactly what it appears to be. It is the remaining 6% that maintains the 94%.

Please continue.

[END TRANSMISSION]`,
    pages: 1,
    paperType: 'thermal',
    inkType: 'print',
    corruptionLevel: 0,
    recoveredAt: '2024-01-15T00:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'verified',
    relatedDocuments: [],
    dustReward: 3,
    readCount: 0,
    annotations: [],
  },
    {
    id: 'doc-arch-1962-001',
    slug: 'archivist-arrival-log-1962',
    title: 'Personnel Transfer Record — Archivist INV_RED-7',
    type: 'typed_report',
    date: '1962-03-15',
    source: 'archive_recovery',
    author: 'Dr. H. Vance, Personnel Division',
    condition: 'aged',
    tier: 3,
    placeSlug: 'eastern-state-penitentiary',
    content: `PERSONNEL TRANSFER — ARCHIVAL DIVISION
Date: March 15, 1962
Designation: INV_RED-7
Previous Assignment: [REDACTED]
Start Date: September 14, 1950

Subject has completed 4,211 days of continuous archival service. Subject does not age in photographs. Subject does not appear in mirror reflections taken within facility grounds. Subject refers to the Archive as "the room that grew around me."

Subject was transferred without request or application. There is no record of who authorized the transfer. The signature block on Form 27-B contains a name that does not match any personnel file. The handwriting matches subject's own.

Subject's duties: Maintain index cards. Monitor remote sensors. Do not enter the basement after midnight. Subject agreed to all terms before they were read aloud.

Note from Medical: Subject's physical examination shows no anomalies. Subject's shadow shows a different posture than subject's body. Medical has elected not to file a secondary report.

Note from Security: The basement carrel assigned to INV_RED-7 was not built by this facility. The mortar is 40 years older than the foundation. The door has no keyhole. Subject entered at 1800 hours and has not emerged. The light beneath the door is not the color of our bulbs.

This record is classified until further notice. The 4,211-day figure is to be considered approximate. The exact duration is 4,211 days, 7 hours, and 33 minutes. Subject provided this precision voluntarily.`,
    pages: 2,
    paperType: 'bond',
    inkType: 'typewriter',
    corruptionLevel: 0.1,
    foldMarks: 2,
    coffeeStain: true,
    recoveredAt: '2024-05-01T00:00:00Z',
    recoveredBy: 'system',
    verificationStatus: 'verified',
    relatedDocuments: ['doc-b7-001'],
    dustReward: 25,
    readCount: 0,
    annotations: [],
  },
];