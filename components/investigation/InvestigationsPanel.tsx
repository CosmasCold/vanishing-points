'use client';

import React, { useMemo } from 'react';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, microform } from '@/styles/theme';
import { BookOpen, AlertTriangle, ShieldAlert, FolderLock, FileDigit } from 'lucide-react';

// 13 Authoritative Core Case Slugs (Layer A) to isolate and prevent list clutter
const CORE_CASE_SLUGS = new Set([
  'eastern-state-penitentiary',
  'pripyat-amusement-park',
  'pripyat-hospital-126',
  'chernobyl-reactor-4-control-room',
  'isla-de-las-muecas',
  'bodie-ghost-town',
  'aokigahara-forest',
  'the-grid-null-point',
  'the-vanishing-hospital',
  'borovsko-bridge',
  'st-kilda',
  'teufelsberg-echo-dome',
  'byberry-state-hospital'
]);

export const InvestigationsPanel: React.FC = () => {
  const { places } = useAtlasStore();
  const { evidence, notes, openInvestigation } = useInvestigationStore();
  const { status, setActiveModule } = useUIStore();
  const { click, play } = useAudioStore();

  const dustIndex = status.dustIndex;

  // Classify places based on their progression status & tier — showing ONLY Layer A cases
  const classifiedCases = useMemo(() => {
    return places.filter(place => CORE_CASE_SLUGS.has(place.slug)).map((place) => {
      // Evaluate lock status based on Dust Index threshold or specific conditions
      let isLocked = false;
      let lockReason = '';

      if (place.unlockCondition) {
        if (place.unlockCondition.type === 'dust') {
          const requiredDust = Number(place.unlockCondition.value);
          if (dustIndex < requiredDust) {
            isLocked = true;
            lockReason = `Requires Particulate Exposure: ${requiredDust}%`;
          }
        } else if (place.unlockCondition.type === 'code') {
          isLocked = true;
          lockReason = `Requires Cipher Decryption Access`;
        } else if (place.unlockCondition.type === 'time') {
          isLocked = true;
          lockReason = `Access Restricted Until Solstice Alignment`;
        }
      }

      // Check evidence collection progress
      const caseEvidence = evidence[place.slug] || [];
      const totalEv = caseEvidence.length;
      const analyzedEv = caseEvidence.filter(e => e.status === 'analyzed' || e.status === 'viewed').length;
      const hasNotes = (notes[place.slug] || '').trim().length > 0;

      return {
        ...place,
        isLocked,
        lockReason,
        progress: {
          total: totalEv,
          analyzed: analyzedEv,
          hasNotes,
        }
      };
    }).sort((a, b) => {
      // Unlocked items rise to top, then sorted by tier
      if (a.isLocked !== b.isLocked) return a.isLocked ? 1 : -1;
      return (b.tier || 0) - (a.tier || 0);
    });
  }, [places, dustIndex, evidence, notes]);

  const handleOpenCase = (slug: string, name: string, isLocked: boolean) => {
    if (isLocked) {
      play('error');
      return;
    }
    // Play tactile mechanical deck engagement
    play('tape');
    openInvestigation(slug, name);
    // Keep activeModule set or slide out of view
    setActiveModule(null);
  };

  const unlockedCount = classifiedCases.filter(c => !c.isLocked).length;

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full flex flex-col select-none font-mono text-xs">
      {/* Dossier Header */}
      <div className="shrink-0 mb-4 pb-2 border-b flex justify-between items-end" style={{ borderColor: colors.archive.grayDark }}>
        <div>
          <h2 style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, letterSpacing: '0.12em' }}>
            REGISTRY OF ACTIVE INVESTIGATIONS
          </h2>
          <div className="text-[10px] mt-1.5" style={{ color: colors.archive.gray }}>
            {unlockedCount} OF {classifiedCases.length} CASE DOSSIERS UNLOCKED
          </div>
        </div>
      </div>

      {/* Directory of cases */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {classifiedCases.map((item) => {
          const statusColor = item.status === 'sealed' ? colors.archive.red 
                            : item.status === 'whispered' ? colors.archive.blue 
                            : item.status === 'mirage' ? '#bf9f62' 
                            : colors.archive.green;

          return (
            <div
              key={item.slug}
              onClick={() => handleOpenCase(item.slug, item.name, item.isLocked)}
              className={`p-4 border rounded-[1px] transition-all flex flex-col gap-2 ${
                item.isLocked 
                  ? 'opacity-40 cursor-default bg-stone-950/40 border-stone-900/60' 
                  : 'cursor-pointer hover:border-[#4d443a] bg-stone-950/90 border-[#2d2924]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.isLocked ? (
                      <FolderLock size={12} className="text-stone-500" />
                    ) : (
                      <BookOpen size={12} style={{ color: statusColor }} />
                    )}
                    <span className="font-bold text-xs" style={{ color: item.isLocked ? colors.archive.gray : colors.archive.white }}>
                      {item.name}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-60" style={{ color: colors.archive.grayLight }}>
                    {item.address?.formatted || 'COORDINATES CLASSIFIED'}
                  </div>
                </div>

                {!item.isLocked && (
                  <span className="px-1.5 py-0.5 border text-[8.5px] font-bold scale-90" style={{ color: statusColor, borderColor: statusColor }}>
                    {item.status.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Progress Tracker / Locked State Notice */}
              {item.isLocked ? (
                <div className="text-[9.5px] flex items-center gap-1.5 py-1" style={{ color: colors.archive.redBright }}>
                  <ShieldAlert size={12} />
                  <span>{item.lockReason || 'REGISTRY CLASSIFIED'}</span>
                </div>
              ) : (
                <div className="text-[10px] flex items-center justify-between border-t pt-2 mt-1" style={{ borderColor: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <FileDigit size={11} style={{ color: colors.archive.green }} />
                      <span>EVIDENCE: {item.progress.analyzed}/{item.progress.total || 0}</span>
                    </span>
                    {item.progress.hasNotes && (
                      <span className="text-[9px] px-1 bg-[#2e2a24] text-[#bf9f62] rounded-[1px]">
                        NOTES ACTIVE
                      </span>
                    )}
                  </div>
                  {item.dangerLevel >= 4 && (
                    <span className="text-[9px] flex items-center gap-0.5" style={{ color: colors.archive.red }}>
                      <AlertTriangle size={10} /> D{item.dangerLevel} THREAT
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvestigationsPanel;
