'use client';

import React, { useMemo, useState } from 'react';
import { getExposure } from '@/data/exposures';
import { performExposure } from '@/logic/progression/exposure';
import { useProgressionStore } from '@/state/progressionStore';
import type { HypothesisState } from '@/types/conditions';

const CASE_ID = 'stelmo-light';
const PRIMARY_EVIDENCE = 'doc-stelmo-001';
const EXPOSURE_ID = 'stelmo-locked-drawer';
const RESULT_EVIDENCE = 'evidence-stelmo-locked-drawer';
const HYPOTHESIS_ID = 'hyp-physical-record-drift';
const CONTRADICTION_ID = 'contradiction-stelmo-physical-record';

export interface StElmoCasePanelProps {
  onEvidenceRevealed?: (evidenceId: string) => void;
  onComplete?: () => void;
}

export function StElmoCasePanel({ onEvidenceRevealed, onComplete }: StElmoCasePanelProps) {
  const [notice, setNotice] = useState('CASE OPEN // Review the source record before exposing the drawer record.');
  const exposure = getExposure(EXPOSURE_ID);
  const dust = useProgressionStore((state) => state.dustIndex);
  const addEvidence = useProgressionStore((state) => state.addEvidence);
  const markEvidenceAnalysed = useProgressionStore((state) => state.markEvidenceAnalysed);
  const addHypothesisEvidence = useProgressionStore((state) => state.addHypothesisEvidence);
  const setHypothesis = useProgressionStore((state) => state.setHypothesis);
  const addContradiction = useProgressionStore((state) => state.addContradiction);
  const setKnowledge = useProgressionStore((state) => state.setKnowledge);
  const completeCase = useProgressionStore((state) => state.completeCase);
  const sessionCount = useProgressionStore((state) => state.sessionCount);
  const evidenceIds = useProgressionStore((state) => state.discoveredEvidenceIds);
  const analysedIds = useProgressionStore((state) => state.analysedEvidenceIds);
  const hypothesisEvidence = useProgressionStore((state) => state.hypothesisEvidence);
  const hypothesisState = useProgressionStore((state) => state.hypotheses[HYPOTHESIS_ID]) as HypothesisState | undefined;
  const completed = useProgressionStore((state) => state.completedCaseIds.includes(CASE_ID));

  const hasSource = evidenceIds.includes(PRIMARY_EVIDENCE);
  const hasExposure = evidenceIds.includes(RESULT_EVIDENCE);
  const hasHypothesisEvidence = (hypothesisEvidence[HYPOTHESIS_ID] ?? []).includes(RESULT_EVIDENCE);
  const canSupport = hasSource && hasExposure;
  const canContradict = canSupport && hypothesisState === 'supported';

  const exposureState = useMemo(() => {
    if (!exposure) return 'MISSING EXPOSURE DEFINITION';
    if (hasExposure) return 'EXPOSED / FILED';
    if (dust < exposure.dustCost) return `LOCKED / ${exposure.dustCost - dust} DUST SHORT`;
    return `AVAILABLE / ${exposure.dustCost} DUST`;
  }, [exposure, hasExposure, dust]);

  const openSource = () => {
    addEvidence(PRIMARY_EVIDENCE);
    markEvidenceAnalysed(PRIMARY_EVIDENCE);
    setNotice('SOURCE VERIFIED // Vance reports the lamp already lit before his maintenance action.');
  };

  const expose = () => {
    if (!exposure) {
      setNotice('ARCHIVE ERROR // St. Elmo exposure definition is unavailable.');
      return;
    }

    const result = performExposure(exposure);
    if (!result.success) {
      setNotice(
        result.reason === 'ALREADY_EXPOSED'
          ? 'EXPOSURE ALREADY FILED // No additional Dust is consumed.'
          : 'INSUFFICIENT DUST // The record remains inaccessible.'
      );
      return;
    }

    addEvidence(RESULT_EVIDENCE);
    markEvidenceAnalysed(RESULT_EVIDENCE);
    onEvidenceRevealed?.(RESULT_EVIDENCE);
    setNotice(`EXPOSURE COMPLETE // ${result.resultTitle ?? 'Derived record recovered.'}`);
  };

  const supportHypothesis = () => {
    if (!canSupport) {
      setNotice('HYPOTHESIS INCOMPLETE // Both source and derived evidence are required.');
      return;
    }

    addHypothesisEvidence(HYPOTHESIS_ID, PRIMARY_EVIDENCE);
    addHypothesisEvidence(HYPOTHESIS_ID, RESULT_EVIDENCE);
    setHypothesis(HYPOTHESIS_ID, 'supported');
    setKnowledge(HYPOTHESIS_ID, 'known', [PRIMARY_EVIDENCE, RESULT_EVIDENCE]);
    setNotice('HYPOTHESIS SUPPORTED // Physical state may diverge from archival history.');
  };

  const registerContradiction = () => {
    if (!canContradict) {
      setNotice('CONTRADICTION LOCKED // Support the hypothesis first.');
      return;
    }

    addContradiction({
      id: CONTRADICTION_ID,
      status: 'unresolved',
      sourceIds: [PRIMARY_EVIDENCE, RESULT_EVIDENCE],
      discoveredAtSession: sessionCount,
    });
    setHypothesis(HYPOTHESIS_ID, 'contradicted');
    setKnowledge(HYPOTHESIS_ID, 'suspected', [PRIMARY_EVIDENCE, RESULT_EVIDENCE]);
    setNotice('CONTRADICTION FILED // The maintenance record cannot fully explain the physical state.');
  };

  const archiveCase = () => {
    if (!hasSource || !hasExposure || !hypothesisEvidence[HYPOTHESIS_ID]?.length) {
      setNotice('CASE INCOMPLETE // Source, exposure result, and interpretation must be filed.');
      return;
    }

    setHypothesis(HYPOTHESIS_ID, 'confirmed');
    setKnowledge(HYPOTHESIS_ID, 'confirmed', [PRIMARY_EVIDENCE, RESULT_EVIDENCE]);
    completeCase(CASE_ID);
    onComplete?.();
    setNotice('CASE ARCHIVED // St. Elmo Lighthouse has been entered into the canonical record.');
  };

  return (
    <section className="stelmo-case-panel" aria-labelledby="stelmo-case-title">
      <header className="stelmo-case-header">
        <div>
          <div className="archive-card-eyebrow">ACT I / CASE 01</div>
          <h2 id="stelmo-case-title">ST. ELMO LIGHTHOUSE</h2>
        </div>
        <span className={`stelmo-case-state ${completed ? 'is-complete' : ''}`}>
          {completed ? 'ARCHIVED' : 'OPEN'}
        </span>
      </header>

      <div className="stelmo-case-paper">
        <div className="stelmo-document-label">PRIMARY RECORD / DOC-STELMO-001</div>
        <h3>Keeper&apos;s Log — St. Elmo Light</h3>
        <p>
          Keeper Edward Vance reports that the lamp was already lit when he woke,
          despite his forty-year record of personally maintaining it.
        </p>
        <div className="stelmo-record-mark">OBSERVATION // PHYSICAL STATE DOES NOT CLEANLY MATCH THE RECORD</div>
        <button type="button" onClick={openSource} className="archive-action-button">
          {hasSource ? 'SOURCE VERIFIED' : 'EXAMINE SOURCE'}
        </button>
      </div>

      <div className="stelmo-exposure">
        <div>
          <div className="archive-card-eyebrow">DUST EXPOSURE</div>
          <h3>{exposure?.title ?? 'Exposure unavailable'}</h3>
          <p>{exposure?.resultDescription ?? 'No authored exposure definition is registered.'}</p>
        </div>
        <div className="stelmo-exposure-meta">
          <span>DUST // {dust}</span>
          <span>{exposureState}</span>
          <button type="button" onClick={expose} disabled={!exposure || hasExposure || dust < (exposure?.dustCost ?? 999)} className="archive-action-button">
            {hasExposure ? 'RECORD FILED' : `EXPOSE / ${exposure?.dustCost ?? '—'} DUST`}
          </button>
        </div>
      </div>

      <div className="stelmo-reasoning">
        <div className="stelmo-reasoning-card">
          <div className="archive-card-eyebrow">INVESTIGATOR HYPOTHESIS</div>
          <h3>Physical Record Drift</h3>
          <p>Physical states at abandoned sites may not correspond reliably to their archived histories.</p>
          <div className="stelmo-evidence-count">
            {hasHypothesisEvidence ? '2 RECORDS ASSIGNED' : canSupport ? 'READY FOR INTERPRETATION' : 'AWAITING EVIDENCE'}
          </div>
          <button type="button" onClick={supportHypothesis} disabled={!canSupport || hypothesisState === 'confirmed'} className="archive-action-button">
            {hypothesisState === 'confirmed' ? 'HYPOTHESIS CONFIRMED' : 'SUPPORT HYPOTHESIS'}
          </button>
        </div>

        <div className="stelmo-reasoning-card contradiction-card">
          <div className="archive-card-eyebrow">CONTRADICTION</div>
          <h3>Maintenance Cause / Physical Result</h3>
          <div className="stelmo-contradiction-line">
            <span>VANCE</span><b>×</b><span>LAMP</span>
          </div>
          <p>The lamp performs its function without the action that historically caused it.</p>
          <button type="button" onClick={registerContradiction} disabled={!canContradict} className="archive-action-button archive-action-danger">
            FILE CONTRADICTION
          </button>
        </div>
      </div>

      <footer className="stelmo-case-footer">
        <span aria-live="polite">{notice}</span>
        <button type="button" onClick={archiveCase} disabled={!hasSource || !hasExposure || !hasHypothesisEvidence || completed} className="archive-action-button archive-action-primary">
          {completed ? 'CASE ARCHIVED' : 'ARCHIVE CASE'}
        </button>
      </footer>
    </section>
  );
}

export default StElmoCasePanel;
