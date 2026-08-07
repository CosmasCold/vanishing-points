'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useUIStore } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

export const DiscoveryPanel: React.FC = () => {
  const { places } = useAtlasStore();
  const { evidence, timelines, notes } = useInvestigationStore();
  const { status } = useUIStore();

  const investigatedSlugs = Object.keys(evidence).filter((k) => evidence[k]?.length > 0);
  const placesWithNotes = Object.keys(notes).filter((k) => notes[k]?.length > 0);
  const placesWithTimeline = Object.keys(timelines).filter((k) => timelines[k]?.length > 0);

  const totalEvidence = Object.values(evidence).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const totalTimelineEvents = Object.values(timelines).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const stats = [
    { label: 'LOCATIONS INDEXED', value: places.length, color: colors.archive.amber },
    { label: 'INVESTIGATIONS OPENED', value: investigatedSlugs.length, color: colors.archive.blue },
    { label: 'EVIDENCE EXAMINED', value: totalEvidence, color: colors.archive.green },
    { label: 'TIMELINE EVENTS', value: totalTimelineEvents, color: colors.archive.redBright },
    { label: 'FIELD NOTES', value: placesWithNotes.length, color: colors.archive.grayLight },
    { label: 'DUST INDEX', value: status.dustIndex, color: colors.archive.amber },
  ];

  const milestones = [
    { label: 'First Investigation', condition: investigatedSlugs.length >= 1, desc: 'Open your first case file' },
    { label: 'Evidence Collector', condition: totalEvidence >= 5, desc: 'Examine 5 pieces of evidence' },
    { label: 'Chronicler', condition: placesWithNotes.length >= 3, desc: 'Write notes for 3 cases' },
    { label: 'Historian', condition: totalTimelineEvents >= 5, desc: 'Record 5 timeline events' },
    { label: 'Dust Walker', condition: status.dustIndex >= 25, desc: 'Reach Moderate Dust exposure' },
    { label: 'Stability Keeper', condition: status.observerStability >= 90, desc: 'Maintain 90%+ stability' },
    { label: 'Resonance Hunter', condition: places.some((p) => p.connectedTo?.some((c) => investigatedSlugs.includes(c))), desc: 'Follow a resonance connection' },
    { label: 'Archivist', condition: investigatedSlugs.length >= 10, desc: 'Open 10 investigations' },
  ];

  const completedMilestones = milestones.filter((m) => m.condition).length;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-6 pb-2 border-b" style={{ borderColor: colors.archive.grayDark }}>
        <h2 style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.1em' }}>
          DISCOVERY TRACKER
        </h2>
        <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginTop: '0.25rem' }}>
          {completedMilestones} OF {milestones.length} MILESTONES REACHED
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 border" style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}>
            <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginBottom: '0.5rem' }}>
              {stat.label}
            </div>
            <div style={{ color: stat.color, fontFamily: typography.mono, fontSize: typography.sizes.xl }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <h3 style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          MILESTONES
        </h3>
        {milestones.map((milestone, i) => (
          <motion.div
            key={milestone.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-3 border"
            style={{
              borderColor: milestone.condition ? colors.archive.green : colors.archive.grayDark,
              backgroundColor: milestone.condition ? 'rgba(106, 168, 106, 0.05)' : 'transparent',
              opacity: milestone.condition ? 1 : 0.6,
            }}
          >
            <span
              style={{
                color: milestone.condition ? colors.archive.green : colors.archive.grayDark,
                fontFamily: typography.mono,
                fontSize: typography.sizes.sm,
              }}
            >
              {milestone.condition ? '▣' : '▪'}
            </span>
            <div className="flex-1">
              <div
                style={{
                  color: milestone.condition ? colors.archive.white : colors.archive.gray,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                }}
              >
                {milestone.label}
              </div>
              <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                {milestone.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};