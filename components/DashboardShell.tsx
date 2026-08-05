'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useBootStore } from '@/state/bootStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { NavigationRail } from './NavigationRail';
import { StatusBar } from './StatusBar';
import { Terminal } from './Terminal';
import { ModulePanel } from './ModulePanel';
import { AtlasMap } from './atlas/AtlasMap';
import { AtlasPanel } from './atlas/AtlasPanel';
import { InvestigationView } from './investigation/InvestigationView';
import { EvidenceBoard } from './evidenceBoard/EvidenceBoard';
import { BoardPanel } from './evidenceBoard/BoardPanel';
import { DocumentViewer } from './documents/DocumentViewer';
import { DocumentPanel } from './documents/DocumentPanel';
import { DocumentAudio } from './documents/DocumentAudio';
import { colors, typography, spacing } from '@/styles/theme';

const InboxContent: React.FC = () => (
  <div className="space-y-3">
    <div
      className="p-3 border cursor-pointer hover:border-amber-700 transition-colors"
      style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
    >
      <div className="flex justify-between items-baseline mb-1">
        <span style={{ color: colors.archive.amber, fontSize: typography.sizes.sm }}>
          URGENT: Coordinate Drift
        </span>
        <span style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>14:01</span>
      </div>
      <p style={{ color: colors.archive.white, fontSize: typography.sizes.sm, opacity: 0.8 }}>
        Atlas sector 7-B has shifted 0.3km from last known position. Recommend immediate verification.
      </p>
    </div>
    <div
      className="p-3 border cursor-pointer hover:border-amber-700 transition-colors"
      style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
    >
      <div className="flex justify-between items-baseline mb-1">
        <span style={{ color: colors.archive.green, fontSize: typography.sizes.sm }}>
          Evidence Sync Complete
        </span>
        <span style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>13:45</span>
      </div>
      <p style={{ color: colors.archive.white, fontSize: typography.sizes.sm, opacity: 0.8 }}>
        3 new documents recovered from Case #2847. Awaiting review.
      </p>
    </div>
  </div>
);

const InvestigationsContent: React.FC = () => (
  <div className="space-y-2">
    {['Case #2847 - Blackwood Hospital', 'Case #2901 - St. Elmo Lighthouse', 'Case #2912 - Meridian Mine'].map(
      (c) => (
        <div
          key={c}
          className="p-2 border cursor-pointer hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.gray }}
        >
          <span style={{ color: colors.archive.white, fontSize: typography.sizes.sm }}>{c}</span>
        </div>
      )
    )}
  </div>
);

export const DashboardShell: React.FC = () => {
  const { booted, activeModule, terminalOpen } = useUIStore();
  const { isComplete } = useBootStore();
  const { selectedPlaceId, places } = useAtlasStore();
  const { activeInvestigationId } = useInvestigationStore();

  if (!booted || !isComplete) return null;

  const selectedPlace = places.find((p) => p.slug === selectedPlaceId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0"
      style={{ backgroundColor: colors.archive.black }}
    >
      {/* ── Main Workspace ── */}
      <div
        className="absolute inset-0"
        style={{
          marginLeft: spacing.rail,
          marginBottom: terminalOpen
            ? `calc(${spacing.statusBar} + ${spacing.terminalHeight})`
            : spacing.statusBar,
        }}
      >
        {/* Empty state */}
        {!activeModule && !activeInvestigationId && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center space-y-4" style={{ fontFamily: typography.mono }}>
              <h2
                style={{
                  color: colors.archive.green,
                  fontSize: typography.sizes.xl,
                  letterSpacing: '0.1em',
                }}
              >
                ARCHIVE ACTIVE
              </h2>
              <p style={{ color: colors.archive.gray, fontSize: typography.sizes.sm }}>
                Select a module from the rail to begin
              </p>
              <p style={{ color: colors.archive.grayLight, fontSize: typography.sizes.xs }}>
                Press ` or click TERM to open terminal
              </p>
            </div>
          </div>
        )}

        {/* Atlas */}
        {activeModule === 'atlas' && !activeInvestigationId && <AtlasMap />}

        {/* Evidence Board */}
        {activeModule === 'evidence' && !activeInvestigationId && <EvidenceBoard />}

        {/* Document Archive */}
        {activeModule === 'documents' && !activeInvestigationId && (
          <div className="w-full h-full" style={{ backgroundColor: colors.archive.black }}>
            <DocumentViewer />
          </div>
        )}

        {/* Investigation View — overlays everything when active */}
        {activeInvestigationId && selectedPlace && (
          <InvestigationView place={selectedPlace} />
        )}
      </div>

      {/* ── Module Panels (Sidebar Drawers) ── */}
      <ModulePanel moduleId="inbox" title="INBOX">
        <InboxContent />
      </ModulePanel>

      <ModulePanel moduleId="atlas" title="ATLAS">
        <AtlasPanel />
      </ModulePanel>

      <ModulePanel moduleId="investigations" title="INVESTIGATIONS">
        <InvestigationsContent />
      </ModulePanel>

      <ModulePanel moduleId="evidence" title="EVIDENCE BOARD">
        <BoardPanel />
      </ModulePanel>

      <ModulePanel moduleId="documents" title="DOCUMENT ARCHIVE">
        <DocumentPanel />
      </ModulePanel>

      <ModulePanel moduleId="signals" title="SIGNAL ANALYSIS">
        <div style={{ color: colors.archive.gray }}>Signal processor offline...</div>
      </ModulePanel>

      <ModulePanel moduleId="research" title="RESEARCH LOG">
        <div style={{ color: colors.archive.gray }}>Research database empty...</div>
      </ModulePanel>

      <ModulePanel moduleId="inventory" title="INVENTORY">
        <div style={{ color: colors.archive.gray }}>No items in quarantine...</div>
      </ModulePanel>

      <ModulePanel moduleId="discoveries" title="DISCOVERIES">
        <div style={{ color: colors.archive.gray }}>Discovery tracker ready...</div>
      </ModulePanel>

      <ModulePanel moduleId="system" title="SYSTEM">
        <div style={{ color: colors.archive.gray }}>System diagnostics nominal...</div>
      </ModulePanel>

      {/* ── Global UI Layers ── */}
      <DocumentAudio />
      <NavigationRail />
      <StatusBar />
      <Terminal />
    </motion.div>
  );
};