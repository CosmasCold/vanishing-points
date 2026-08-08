'use client';

import React, { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useBootStore } from '@/state/bootStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useMediaStore } from '@/state/mediaStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ArchiveErrorBoundary } from './ArchiveErrorBoundary';
import { NavigationRail } from './NavigationRail';
import { StatusBar } from './StatusBar';
import { Terminal } from './Terminal';
import { ModulePanel } from './ModulePanel';
import { AtlasMap } from './atlas/AtlasMap';
import { AtlasPanel } from './atlas/AtlasPanel';
import { InvestigationView } from './investigation/InvestigationView';
import { EvidenceBoard } from './evidenceBoard/EvidenceBoard';
import { MediaViewer } from './media/MediaViewer';
import { DocumentViewer } from './documents/DocumentViewer';
import { ArtifactViewer } from './artifacts/ArtifactViewer';
import { DailyRitual } from './DailyRitual';
import { InboxPanel } from './inbox/InboxPanel';
import { ImpossibleChangeToast } from './ImpossibleChangeToast';
import { GuideOverlay } from './GuideOverlay';
import { PrologueOverlay } from './PrologueOverlay';
import { useAudioStore } from '@/state/audioStore';
import { SignalPanel } from './signals/SignalPanel';
import { DocumentArchive } from './documents/DocumentArchive';
import { ResearchPanel } from './research/ResearchPanel';
import { DiscoveryPanel } from './discoveries/DiscoveryPanel';
import { SystemPanel } from './system/SystemPanel';
import { InventoryPanel } from './inventory/InventoryPanel';
import { registry } from '@/logic/commandRegistry';
import { registerSystemCommands } from '@/logic/commands/system';
import { registerInvestigationCommands } from '@/logic/commands/investigation';
import { registerEvidenceBoardCommands } from '@/logic/commands/evidenceBoard';
import { colors, spacing } from '@/styles/theme';
import { ModuleId } from '@/types';

export const DashboardShell: React.FC = () => {
  useKeyboardShortcuts();

  useEffect(() => {
    registerSystemCommands(registry);
    registerInvestigationCommands(registry);
    registerEvidenceBoardCommands(registry);
  }, []);

  const { booted, activeModule } = useUIStore();
  const { isComplete } = useBootStore();
  const { activeInvestigationId } = useInvestigationStore();
  const { places } = useAtlasStore();
  const { activeMedia, closeMedia } = useMediaStore();

  if (!booted || !isComplete) return null;

  const activePlace = activeInvestigationId ? places.find((p) => p.slug === activeInvestigationId) : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }} 
      className="fixed inset-0 flex" 
      style={{ backgroundColor: colors.archive.black }}
    >
      {/* Tungsten lamp radial gradient — bridges 3D desk into 2D */}
      <div 
        className="fixed inset-0 pointer-events-none" 
        style={{ 
          background: 'radial-gradient(ellipse at 28% 18%, rgba(255, 170, 85, 0.055) 0%, transparent 55%)', 
          zIndex: 1, 
        }} 
      />

      <NavigationRail />

      {activeModule && (
        <ModulePanel moduleId={activeModule as ModuleId} title={activeModule.toUpperCase()}>
          {activeModule === 'inbox' && <InboxPanel />}
          {activeModule === 'atlas' && <AtlasPanel />}
          {activeModule === 'signals' && <SignalPanel />}
          {activeModule === 'documents' && <DocumentArchive />}
          {activeModule === 'research' && <ResearchPanel />}
          {activeModule === 'inventory' && <InventoryPanel />}
          {activeModule === 'discoveries' && <DiscoveryPanel />}
          {activeModule === 'system' && <SystemPanel />}
        </ModulePanel>
      )}

      <div 
        className="flex-1 flex flex-col relative transition-all" 
        style={{ 
          marginLeft: activeModule ? `calc(${spacing.rail} + 24rem)` : spacing.rail, 
          marginBottom: spacing.statusBar, 
          zIndex: 2, 
          transitionDuration: '0.35s', 
          transitionProperty: 'margin-left' 
        }}
      >
        <div className="flex-1 relative">
          <Suspense fallback={null}>
            <AtlasMap />
          </Suspense>

          {activePlace && (
            <ArchiveErrorBoundary moduleName="Case Investigation">
              <InvestigationView place={activePlace} />
            </ArchiveErrorBoundary>
          )}

          {activeModule === 'evidence' && (
            <ArchiveErrorBoundary moduleName="Evidence Board">
              <EvidenceBoard />
            </ArchiveErrorBoundary>
          )}
        </div>

        <Terminal />
      </div>

      <StatusBar />
      <DailyRitual />
      <ImpossibleChangeToast />
      <GuideOverlay />
      <PrologueOverlay />

      <ArchiveErrorBoundary moduleName="Document Reader">
        <DocumentViewer />
      </ArchiveErrorBoundary>

      <ArchiveErrorBoundary moduleName="Containment Analyzer">
        <ArtifactViewer />
      </ArchiveErrorBoundary>

      {activeMedia && (
        <MediaViewer
          url={activeMedia.url}
          type={activeMedia.type}
          title={activeMedia.title}
          onClose={closeMedia}
        />
      )}
    </motion.div>
  );
};
