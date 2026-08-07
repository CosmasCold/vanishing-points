'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useBootStore } from '@/state/bootStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useMediaStore } from '@/state/mediaStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ArchiveErrorBoundary } from './ArchiveErrorBoundary';
import { SkeletonLoader } from './loading/SkeletonLoader';
import { NavigationRail } from './NavigationRail';
import { StatusBar } from './StatusBar';
import { Terminal } from './Terminal';
import { ModulePanel } from './ModulePanel';
import { AtlasMap } from './atlas/AtlasMap';
import { AtlasPanel } from './atlas/AtlasPanel';
import { InvestigationView } from './investigation/InvestigationView';
import { EvidenceBoard } from './evidence/EvidenceBoard';
import { MediaViewer } from './media/MediaViewer';
import { DocumentViewer } from './documents/DocumentViewer';
import { ArtifactViewer } from './artifacts/ArtifactViewer';
import { DailyRitual } from './DailyRitual';
import { InboxPanel } from './inbox/InboxPanel';
import { ImpossibleChangeToast } from './ImpossibleChangeToast';
import { colors, typography, spacing, shadows } from '@/styles/theme';
import { GuideOverlay } from './GuideOverlay';
import { PrologueOverlay } from './PrologueOverlay';

const InvestigationsContent: React.FC = () => (
  <div className="space-y-2">
    {['Case #2847 - Blackwood Hospital', 'Case #2901 - St. Elmo Lighthouse', 'Case #2912 - Meridian Mine'].map(
      (c) => (
        <div
          key={c}
          className="p-2 border cursor-pointer hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.grayDark }}
        >
          <span style={{ color: colors.archive.white, fontSize: typography.sizes.sm }}>{c}</span>
        </div>
      )
    )}
  </div>
);

export const DashboardShell: React.FC = () => {
  useKeyboardShortcuts();

  const { booted, activeModule } = useUIStore();
  const { isComplete } = useBootStore();
  const { activeInvestigationId } = useInvestigationStore();
  const { places } = useAtlasStore();
  const { activeMedia, closeMedia } = useMediaStore();

  if (!booted || !isComplete) return null;

  const activePlace = activeInvestigationId
    ? places.find((p) => p.slug === activeInvestigationId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 flex"
      style={{ backgroundColor: colors.archive.black }}
    >
      {/* Desk texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <PrologueOverlay />
      <GuideOverlay />

      {/* Navigation Rail */}
      <NavigationRail />

      {/* Main workspace */}
      <div
        className="flex-1 flex flex-col relative"
        style={{
          marginLeft: spacing.rail,
          marginBottom: spacing.statusBar,
        }}
      >
        {/* Workspace content */}
        <div className="flex-1 relative overflow-hidden">
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

          {/* Atlas workspace */}
          {activeModule === 'atlas' && !activeInvestigationId && (
            <ArchiveErrorBoundary moduleName="Atlas">
              <Suspense fallback={<SkeletonLoader type="map" />}>
                <AtlasMap />
              </Suspense>
            </ArchiveErrorBoundary>
          )}

          {/* Evidence Board workspace */}
          {activeModule === 'evidence' && !activeInvestigationId && (
            <ArchiveErrorBoundary moduleName="Evidence Board">
              <Suspense fallback={<SkeletonLoader type="grid" />}>
                <EvidenceBoard />
              </Suspense>
            </ArchiveErrorBoundary>
          )}

          {/* Investigation workspace overlay */}
          {activePlace && (
            <ArchiveErrorBoundary moduleName={`Investigation: ${activePlace.name}`}>
              <Suspense fallback={<SkeletonLoader type="document" lines={6} />}>
                <InvestigationView place={activePlace} />
              </Suspense>
            </ArchiveErrorBoundary>
          )}
        </div>

        {/* Module panels (slide-in sidebars) */}
        <ModulePanel moduleId="inbox" title="INBOX">
          <InboxPanel />
        </ModulePanel>

        <ModulePanel moduleId="atlas" title="ATLAS">
          <AtlasPanel />
        </ModulePanel>

        <ModulePanel moduleId="investigations" title="INVESTIGATIONS">
          <InvestigationsContent />
        </ModulePanel>

        <ModulePanel moduleId="evidence" title="EVIDENCE BOARD">
          <div style={{ color: colors.archive.gray }}>Evidence board initialization pending...</div>
        </ModulePanel>

        <ModulePanel moduleId="signals" title="SIGNAL ANALYSIS">
          <div style={{ color: colors.archive.gray }}>Signal processor offline...</div>
        </ModulePanel>

        <ModulePanel moduleId="documents" title="DOCUMENT ARCHIVE">
          <div style={{ color: colors.archive.gray }}>Document viewer not loaded...</div>
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

        {/* Overlays */}
        <DailyRitual />
        <ImpossibleChangeToast />

        {/* Global Viewers */}
        {activeMedia && (
          <MediaViewer
            url={activeMedia.url}
            type={activeMedia.type}
            title={activeMedia.title}
            onClose={closeMedia}
          />
        )}
        <DocumentViewer />
        <ArtifactViewer />
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Terminal Modal (floats above everything) */}
      <Terminal />
    </motion.div>
  );
};