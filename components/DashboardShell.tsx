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
import { useAudioStore } from '@/state/audioStore';
import { SignalPanel } from './signals/SignalPanel';
import { DocumentArchive } from './documents/DocumentArchive';
import { ResearchPanel } from './research/ResearchPanel';
import { DiscoveryPanel } from './discoveries/DiscoveryPanel';
import { SystemPanel } from './system/SystemPanel';

const InvestigationsContent: React.FC = () => {
  const { places, selectPlace } = useAtlasStore();
  const { openInvestigation } = useInvestigationStore();
  const { click } = useAudioStore();
  const { setActiveModule } = useUIStore();

  const caseNumber = (slug: string) => {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = ((hash << 5) - hash) + slug.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 9000) + 1000;
  };

  const handleOpenCase = (place: typeof places[0]) => {
    click();
    selectPlace(place.slug);
    openInvestigation(place.slug, place.name);
    setActiveModule(null);
  };

  return (
    <div className="space-y-2">
      {places.map((place) => (
        <button
          key={place.slug}
          onClick={() => handleOpenCase(place)}
          className="w-full text-left p-3 border cursor-pointer hover:border-amber-700 transition-colors"
          style={{ borderColor: colors.archive.grayDark, backgroundColor: 'transparent' }}
        >
          <div className="flex justify-between items-center">
            <span style={{ color: colors.archive.white, fontSize: typography.sizes.sm, fontFamily: typography.mono }}>
              Case #{caseNumber(place.slug)} — {place.name}
            </span>
            <span
              className="px-1.5 py-0.5 text-xs border"
              style={{
                borderColor: statusColor(place.status),
                color: statusColor(place.status),
                fontFamily: typography.mono,
              }}
            >
              {(place.status || 'verified').toUpperCase()}
            </span>
          </div>
          <div
            className="mt-1 flex gap-3"
            style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
          >
            <span>D{place.dangerLevel || 0}</span>
            {place.yearAbandoned && <span>{place.yearAbandoned}</span>}
            <span>{(place.category || 'unknown').toUpperCase()}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

function statusColor(status?: string): string {
  switch (status) {
    case 'sealed': return colors.archive.red;
    case 'whispered': return colors.archive.blue;
    case 'mirage': return colors.archive.grayLight;
    default: return colors.archive.green;
  }
}

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
  <SignalPanel />
</ModulePanel>

<ModulePanel moduleId="documents" title="DOCUMENT ARCHIVE">
  <DocumentArchive />
</ModulePanel>

<ModulePanel moduleId="research" title="RESEARCH LOG">
  <ResearchPanel />
</ModulePanel>

<ModulePanel moduleId="inventory" title="INVENTORY">
  <div className="p-6" style={{ color: colors.archive.gray, fontFamily: typography.mono }}>
    No items in quarantine...
  </div>
</ModulePanel>

<ModulePanel moduleId="discoveries" title="DISCOVERIES">
  <DiscoveryPanel />
</ModulePanel>

<ModulePanel moduleId="system" title="SYSTEM">
  <SystemPanel />
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