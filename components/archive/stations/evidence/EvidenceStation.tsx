'use client';
import React from 'react';
import ArchiveEnvironment from '../../ArchiveEnvironment';
import { ArchiveSurface } from '../../ArchiveSurface';
import { ArchiveCard } from '../../ArchiveCard';

export interface EvidenceStationProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  caseLabel?: string;
  status?: string;
}

export function EvidenceStation({ children, title='EVIDENCE BOARD', subtitle='INVESTIGATOR WORKSTATION', caseLabel='ACTIVE INVESTIGATION', status='ARCHIVE // LIVE' }: EvidenceStationProps) {
  return (
    <main className="archive-station archive-station-evidence relative min-h-screen overflow-hidden">
      <ArchiveEnvironment station="evidence" />
      <div className="relative z-10 min-h-screen p-[clamp(16px,2.5vw,40px)]">
        <header className="archive-station-header">
          <div>
            <div className="archive-station-kicker">{subtitle}</div>
            <h1 className="archive-station-title">{title}</h1>
          </div>
          <div className="archive-station-status">{status}</div>
        </header>
        <div className="archive-station-grid">
          <section className="archive-station-board" aria-label="Evidence board">
            <ArchiveSurface tone="wood" className="archive-board-surface">
              <div className="archive-board-meta">
                <span>{caseLabel}</span>
                <span>CARREL 7-B</span>
              </div>
              {children}
            </ArchiveSurface>
          </section>
          <aside className="archive-station-side" aria-label="Investigation register">
            <ArchiveCard eyebrow="INVESTIGATION" title="ST. ELMO LIGHTHOUSE" status="OPEN" statusState="suspected">
              <p>Physical state does not cleanly correspond to its archived history.</p>
            </ArchiveCard>
            <ArchiveCard eyebrow="ARCHIVE NOTE" title="Reasoning, not collection" status="RULE">
              <p>Evidence records what was observed. Hypotheses record what the investigator believes it means.</p>
            </ArchiveCard>
          </aside>
        </div>
      </div>
    </main>
  );
}
export default EvidenceStation;
