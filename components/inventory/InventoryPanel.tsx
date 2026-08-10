'use client';

import React from 'react';
import { useArtifactStore } from '@/state/artifactStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, microform } from '@/styles/theme';
import { Box, Sparkles, Scale, Info, ShieldAlert } from 'lucide-react';

export const InventoryPanel: React.FC = () => {
  const { inventory, openArtifact } = useArtifactStore();
  const { click } = useAudioStore();

  const handleInspect = (artifact: any) => {
    click();
    openArtifact(artifact);
  };

  const getQuarantineBadge = (status: string) => {
    switch (status) {
      case 'anomalous':
        return {
          label: 'ANOMALOUS RESIDUE',
          color: colors.archive.red,
          bg: 'rgba(168, 93, 93, 0.08)'
        };
      case 'pending':
        return {
          label: 'PENDING CALIBRATION',
          color: colors.archive.amber,
          bg: 'rgba(201, 169, 110, 0.08)'
        };
      default:
        return {
          label: 'CLEARED SECURE',
          color: colors.archive.green,
          bg: 'rgba(122, 158, 122, 0.08)'
        };
    }
  };

  if (inventory.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center font-mono text-xs select-none">
        <Box size={24} className="text-stone-600 mb-3 animate-pulse" />
        <div style={{ color: colors.archive.gray }}>CONTAINMENT LOCKER EMPTY</div>
        <div className="text-[10px] text-stone-600 mt-1 uppercase tracking-widest">No objects logged for analysis.</div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col select-none font-mono text-xs">
      {/* Header */}
      <div className="shrink-0 mb-4 pb-2 border-b flex justify-between items-end" style={{ borderColor: colors.archive.grayDark }}>
        <div>
          <h2 style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, letterSpacing: '0.12em' }}>
            QUARANTINE CONTAINMENT LOCKER
          </h2>
          <div className="text-[10px] mt-1.5" style={{ color: colors.archive.gray }}>
            {inventory.length} ANOMALOUS PHYSICAL OBJECTS SECURED
          </div>
        </div>
      </div>

      {/* Artifact Checklist */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {inventory.map((artifact) => {
          const badge = getQuarantineBadge(artifact.quarantineStatus);

          return (
            <div
              key={artifact.id}
              onClick={() => handleInspect(artifact)}
              className="p-4 border rounded-[1px] cursor-pointer hover:border-[#4d443a] transition-all bg-stone-950/90 border-[#2d2924] flex flex-col gap-3"
            >
              {/* Card Title Bezel */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Box size={14} style={{ color: colors.archive.amber }} />
                  <span className="font-bold text-xs text-white">
                    {artifact.name}
                  </span>
                </div>
                <span
                  className="px-1.5 py-0.5 border text-[8px] font-bold scale-90"
                  style={{
                    color: badge.color,
                    borderColor: badge.color,
                    backgroundColor: badge.bg
                  }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] leading-relaxed opacity-75" style={{ color: colors.archive.grayLight, fontFamily: typography.serif }}>
                {artifact.description}
              </p>

              {/* Physical specifications block */}
              <div className="grid grid-cols-2 gap-2 border-t pt-2.5" style={{ borderColor: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: colors.archive.gray }}>
                  <Scale size={11} />
                  <span>MASS: {artifact.weight}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: colors.archive.gray }}>
                  <Info size={11} />
                  <span>SIZE: {artifact.dimensions}</span>
                </div>
              </div>

              {/* Action indicator bar */}
              <div
                className="flex items-center justify-between text-[8px] font-bold tracking-wider pt-2 border-t text-stone-500 uppercase"
                style={{ borderColor: 'rgba(255,255,255,0.02)' }}
              >
                <span>Sourced: {artifact.origin}</span>
                <span className="text-[#bf9f62] flex items-center gap-1">
                  <Sparkles size={10} /> CLICK FOR UV CORE SCAN
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryPanel;
