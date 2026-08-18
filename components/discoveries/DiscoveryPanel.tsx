'use client';

import React, { useMemo } from 'react';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useProgressionStore } from '@/state/progressionStore';
import { colors, typography, microform } from '@/styles/theme';
import { Shield, Activity, Lock, CheckCircle2, AlertTriangle, FileDigit } from 'lucide-react';

export const DiscoveryPanel: React.FC = () => {
  const { places } = useAtlasStore();
  const { evidence, timelines, notes } = useInvestigationStore();
  const { dustIndex, observerStability } = useProgressionStore();

  const investigatedSlugs = Object.keys(evidence).filter((k) => evidence[k]?.length > 0);
  const placesWithNotes = Object.keys(notes).filter((k) => notes[k]?.length > 0);
  const placesWithTimeline = Object.keys(timelines).filter((k) => timelines[k]?.length > 0);

  const totalEvidence = Object.values(evidence).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const totalTimelineEvents = Object.values(timelines).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  // Redesigning stats into clinically dry surveillance/consensus metrics [122]
  const metrics = [
    { label: 'CORES INDEXED', value: `${places.length} SITES`, color: colors.archive.amber, desc: 'Total mapped spatial irregularities' },
    { label: 'DOSSIERS OPENED', value: `${investigatedSlugs.length} ACTIVE`, color: colors.archive.blue, desc: 'Local cognitive investigations synchronized' },
    { label: 'EVIDENCE EXAMINED', value: `${totalEvidence} DOSSIERS`, color: colors.archive.green, desc: 'Analyzed archival materials' },
    { label: 'TEMPORAL DRIFT LOGS', value: `${totalTimelineEvents} MARKS`, color: colors.archive.redBright, desc: 'Chronological anomalies cataloged' },
    { label: 'INVESTIGATOR ANNOTATIONS', value: `${placesWithNotes.length} SECTORS`, color: colors.archive.grayLight, desc: 'Free-form observation sets saved' },
    { label: 'ELECTROSTATIC LOAD', value: `${dustIndex}% DUST`, color: colors.archive.amber, desc: 'TIMELINE RESIDUE RESISTANCE PRESSURE' },
  ];

  // Overhaul achievements into highly threatening "Consensus Slip Threat Diagnostics"
  const intercepts = [
    {
      id: "LOG-01",
      label: "INITIAL OBSERVATION CYCLE",
      condition: investigatedSlugs.length >= 1,
      desc: "Observer initiated first carrel session. The walnut desk and CRT persistence have locked onto physical coordinates.",
    },
    {
      id: "LOG-02",
      label: "EVIDENCE EXPOSURE BLEED",
      condition: totalEvidence >= 5,
      desc: "Five distinct declassified dossiers analyzed. Electrostatic particulate is settling into your keyboard contacts.",
    },
    {
      id: "LOG-03",
      label: "CHRONOLOGY CORROSION",
      condition: totalTimelineEvents >= 5,
      desc: "Five impossible dates logged. Time indexing has failed. The Archive cannot guarantee chronological alignment.",
    },
    {
      id: "LOG-04",
      label: "PARTICULATE OVERLOAD SENSING",
      condition: dustIndex >= 25,
      desc: "Moderate Dust accumulation. Micro-fine ash has settled on the screen interior, blooming the phosphorus glow.",
    },
    {
      id: "LOG-05",
      label: "NOMINAL ANCHOR CALIBRATION",
      condition: observerStability >= 90,
      desc: "Cognitive stability sustained above 90%. Consensus reality remains cleanly locked in. For now.",
    },
    {
      id: "LOG-06",
      label: "GEODETIC SECTOR CROSSOVER",
      condition: places.some((p) => p.connectedTo?.some((c) => investigatedSlugs.includes(c))),
      desc: "Resonance lines connected. You have perceived the geodetic triangle forming around the Null Point.",
    },
    {
      id: "LOG-07",
      label: "RECURSIVE EXPOSURE CASCADE",
      condition: investigatedSlugs.length >= 8,
      desc: "Ten cases synchronized. Your assignment parameters have begun repeating. You have spent 4,211 days here.",
    }
  ];

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col select-none font-mono text-xs">
      {/* Header Bezel */}
      <div className="shrink-0 mb-4 pb-2 border-b flex justify-between items-end" style={{ borderColor: colors.archive.grayDark }}>
        <div>
          <h2 style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, letterSpacing: '0.12em' }}>
            REALITY CONSENSUS INTEGRITY LOG
          </h2>
          <div className="text-[10px] mt-1.5" style={{ color: colors.archive.gray }}>
            SECURE DIAG_BUS SYSTEM-7B STATUS READOUTS
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Core System Status Diagnostics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="p-3 border rounded-[1px] bg-void"
              style={{ borderColor: colors.archive.grayDark }}
            >
              <div className="text-[8px] opacity-50 uppercase tracking-widest" style={{ color: m.color }}>
                {m.label}
              </div>
              <div className="text-sm font-bold mt-1 text-white tracking-wide">
                {m.value}
              </div>
              <div className="text-[9px] text-stone-500 leading-normal mt-1">
                {m.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Security Drifts & Intercept Logs */}
        <div className="space-y-3">
          <div className="text-[9px] uppercase tracking-wider text-stone-500 font-bold border-b pb-1 mb-2" style={{ borderColor: 'rgba(255,255,255,0.02)' }}>
            CONSENSUS MEMORY SLIP INTERCEPTS
          </div>

          <div className="space-y-2.5">
            {intercepts.map((log) => (
              <div
                key={log.id}
                className="p-3 border flex gap-3 items-start"
                style={{
                  borderColor: log.condition ? colors.archive.grayDark : "rgba(255, 170, 85, 0.05)",
                  backgroundColor: log.condition ? "rgba(20, 18, 16, 0.2)" : "rgba(10, 8, 6, 0.4)",
                  opacity: log.condition ? 1 : 0.4,
                }}
              >
                {/* Visual Status Indicator */}
                <div className="shrink-0 mt-0.5">
                  {log.condition ? (
                    <CheckCircle2 size={13} style={{ color: colors.archive.green }} />
                  ) : (
                    <Lock size={13} style={{ color: colors.archive.gray }} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <span
                      className="font-bold text-[10px] tracking-wide"
                      style={{ color: log.condition ? colors.archive.white : colors.archive.gray }}
                    >
                      {log.id} // {log.label}
                    </span>
                    {log.condition && (
                      <span className="text-[8px] px-1 bg-[#1a2d1a] text-green-500 font-bold scale-90 border border-green-900 rounded-[1px]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: log.condition ? colors.archive.grayLight : colors.archive.gray }}>
                    {log.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPanel;
