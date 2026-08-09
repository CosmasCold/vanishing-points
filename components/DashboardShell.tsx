'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useBootStore } from '@/state/bootStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useMediaStore } from '@/state/mediaStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRelayTypingInjector } from '@/hooks/useRelayTypingInjector'; // Global keystroke solenoid feedback
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
import { GeigerHUD } from './system/GeigerHUD'; // Clean relative import for our new radiometric counter widget

import { registry } from '@/logic/commandRegistry';
import { registerSystemCommands } from '@/logic/commands/system';
import { registerInvestigationCommands } from '@/logic/commands/investigation';
import { registerEvidenceBoardCommands } from '@/logic/commands/evidenceBoard';
import { colors, spacing } from '@/styles/theme';

export const DashboardShell: React.FC = () => {
  // Mount global hotkeys and keyboard navigation
  useKeyboardShortcuts();

  // Mount global mechanical keyboard solenoid typewriter clicks [2, 9, 44]
  // Generates real-time click/armature thuds on every textual input globally
  useRelayTypingInjector({
    baseVolume: 0.22,
    pitchOffset: 145, // Heavy iron frame resonance base frequency (Hz)
  });

  // Register command registry loops on cold boot
  useEffect(() => {
    registerSystemCommands(registry);
    registerInvestigationCommands(registry);
    registerEvidenceBoardCommands(registry);
  }, []);

  // Sync state selectors from global Zustand stores
  const { booted, activeModule } = useUIStore();
  const { isComplete } = useBootStore();
  const { activeInvestigationId } = useInvestigationStore();
  const { places } = useAtlasStore();
  const { activeMedia, closeMedia } = useMediaStore();

  // Guard: If booting sequence has not completed, keep dashboard hidden
  if (!booted || !isComplete) return null;

  // Resolve the active case folder currently opened by the investigator
  const activePlace = activeInvestigationId ? places.find((p) => p.slug === activeInvestigationId) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 flex overflow-hidden select-none"
      style={{ backgroundColor: colors.archive.black }}
    >
      {/* Tungsten desklamp radial lighting glow — visually locks the screen's canvas depth [1] */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 28% 18%, rgba(255, 170, 85, 0.055) 0%, transparent 55%)',
          zIndex: 1,
        }}
      />

      {/* 3.5rem Tactical Left Navigation Rail */}
      <NavigationRail />

      {/* Main Visual Canvas Area */}
      <div
        className="flex-1 h-full relative overflow-hidden"
        style={{
          marginLeft: spacing.rail,
          marginBottom: spacing.statusBar,
        }}
      >
        {/* Default View: Geodetic Atlas Map (Visible when evidence board is inactive) */}
        <ArchiveErrorBoundary moduleName="Cartographic Atlas">
          <div className={`absolute inset-0 transition-opacity duration-500 ${activeModule === 'evidence' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <AtlasMap />
          </div>
        </ArchiveErrorBoundary>

        {/* Alternative View: Crimson-Threaded Evidence Graph Board [14] */}
        <ArchiveErrorBoundary moduleName="Evidence Connection Board">
          {activeModule === 'evidence' && (
            <div className="absolute inset-0 animate-fade-in">
              <EvidenceBoard />
            </div>
          )}
        </ArchiveErrorBoundary>

        {/* ─── CLASSIC RETRO MODULE SLIDE PANELS ─── */}
        <ArchiveErrorBoundary moduleName="Inbox Subsystem">
          <ModulePanel moduleId="inbox" title="INCOMING MESSAGES">
            <InboxPanel />
          </ModulePanel>
        </ArchiveErrorBoundary>

        <ArchiveErrorBoundary moduleName="Atlas Directory Subsystem">
          <ModulePanel moduleId="atlas" title="GEODETIC ATTLAS INDEX">
            <AtlasPanel />
          </ModulePanel>
        </ArchiveErrorBoundary>

        <ArchiveErrorBoundary moduleName="Shortwave Signal Center">
          <ModulePanel moduleId="signals" title="SIGNAL INTERCEPTS">
            <SignalPanel />
          </ModulePanel>
        </ArchiveErrorBoundary>

        <ArchiveErrorBoundary moduleName="Declassified Document Vault">
          <ModulePanel moduleId="documents" title="DOCUMENT ARCHIVE">
            <DocumentArchive />
          </ModulePanel>
        </ArchiveErrorBoundary>

        <ArchiveErrorBoundary moduleName="Classified Research logs">
          <ModulePanel moduleId="research" title="CLASSIFIED RESEARCH">
            <ResearchPanel />
          </ModulePanel>
        </ArchiveErrorBoundary>

        <ArchiveErrorBoundary moduleName="Quarantine Containment Locker">
          <ModulePanel moduleId="inventory" title="CONTAINMENT LOCKER">
            <InventoryPanel />
          </ModulePanel>
        </ArchiveErrorBoundary>

        <ArchiveErrorBoundary moduleName="Historical Milestone Index">
          <ModulePanel moduleId="discoveries" title="DISCOVERY TRACKER">
            <DiscoveryPanel />
          </ModulePanel>
        </ArchiveErrorBoundary>

        <ArchiveErrorBoundary moduleName="Archive Node Core Utility">
          <ModulePanel moduleId="system" title="SYSTEM UTILITIES">
            <SystemPanel />
          </ModulePanel>
        </ArchiveErrorBoundary>

        {/* ─── DYNAMIC OVERLAYS, VIEWERS & ACTIVE CASEFILES ─── */}

        {/* Active Dossier Investigation Folder View [30] */}
        <AnimatePresence mode="wait">
          {activeInvestigationId && activePlace && (
            <ArchiveErrorBoundary moduleName="Active Case Dossier">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 z-10"
              >
                <InvestigationView place={activePlace} />
              </motion.div>
            </ArchiveErrorBoundary>
          )}
        </AnimatePresence>

        {/* Desktop Radiometric Geiger-Müller counter widget overlay */}
        <div 
          className="absolute top-4 right-4 z-20 flex flex-col gap-3 pointer-events-auto transition-all duration-300"
          style={{
            transform: activeInvestigationId ? 'translateY(4rem) scale(0.95)' : 'translateY(0) scale(1)',
          }}
        >
          <ArchiveErrorBoundary moduleName="Radiometric Geiger Sensor">
            <GeigerHUD />
          </ArchiveErrorBoundary>
        </div>
      </div>

      {/* ─── ROOT LEVEL POPUPS, TAPE DECKS & SYSTEM HUDs ─── */}

      {/* Full-screen Terminal Command Console Overlay [16] */}
      <ArchiveErrorBoundary moduleName="Terminal CLI Panel">
        <Terminal />
      </ArchiveErrorBoundary>

      {/* Cassette Tape & Video Monitor Media Overlay [5] */}
      <AnimatePresence>
        {activeMedia && (
          <ArchiveErrorBoundary moduleName="Workstation Tape/Monitor Media System">
            <MediaViewer
              url={activeMedia.url}
              type={activeMedia.type}
              title={activeMedia.title}
              onClose={closeMedia}
            />
          </ArchiveErrorBoundary>
        )}
      </AnimatePresence>

      {/* Paper Sheet Document Zoom/UV Viewer Overlay [30] */}
      <ArchiveErrorBoundary moduleName="Document Inspection Panel">
        <DocumentViewer />
      </ArchiveErrorBoundary>

      {/* 3D Physical Artifact Magnification Desk Overlay [5] */}
      <ArchiveErrorBoundary moduleName="Physical Artifact Inspection Panel">
        <ArtifactViewer />
      </ArchiveErrorBoundary>

      {/* Daily Archival Boot-Up Sync Ritual Gate [17] */}
      <ArchiveErrorBoundary moduleName="Personnel Sync Sequence">
        <DailyRitual />
      </ArchiveErrorBoundary>

      {/* Interactive Operator Briefing Overlay */}
      <ArchiveErrorBoundary moduleName="Briefing Overlay Subsystem">
        <GuideOverlay />
      </ArchiveErrorBoundary>

      {/* Historical Smuggled Prologue Briefing */}
      <ArchiveErrorBoundary moduleName="Prologue Archive Overlay">
        <PrologueOverlay />
      </ArchiveErrorBoundary>

      {/* Silent environmental anomalies watcher [26] */}
      <ImpossibleChangeToast />

      {/* 2rem Footer Status HUD Bar */}
      <StatusBar />
    </motion.div>
  );
};

export default DashboardShell;
