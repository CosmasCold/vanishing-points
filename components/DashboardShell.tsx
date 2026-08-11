'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useBootStore } from '@/state/bootStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useMediaStore } from '@/state/mediaStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRelayTypingInjector } from '@/hooks/useRelayTypingInjector'; // Global keystroke solenoid feedback
import { useTerminalJitter } from '@/hooks/useTerminalJitter'; // Screen scanline jitter & hold drift engine [28]
import { ArchiveErrorBoundary } from './ArchiveErrorBoundary';
import { NavigationRail } from './NavigationRail';
import { StatusBar } from './StatusBar';
import { Terminal } from './Terminal';
import { ModulePanel } from './ModulePanel';
import { AtlasMap } from './atlas/AtlasMap';
import { AtlasPanel } from './atlas/AtlasPanel';
import { InvestigationsPanel } from './investigation/InvestigationsPanel';
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
import { colors, spacing, typography, shadows, microform } from '@/styles/theme';

/* ═══════════════════════════════════════════════════════════════
   STROWGER STEPPING SELECTOR WIDGET (Self-Contained SVG Mechanical Instrument)
   ═══════════════════════════════════════════════════════════════ */

interface PinCoord {
  idx: number;
  cx: number;
  cy: number;
  label: string;
}

const StrowgerStepper: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [plungerActive, setPlungerActive] = useState<boolean>(false);

  // Generate the coordinates of the 10 stepped contact terminals radially arranged
  const terminals = useMemo<PinCoord[]>(() => {
    const coords: PinCoord[] = [];
    const radius = 30; // Orbit distance in pixels
    const centerX = 50;
    const centerY = 50;

    for (let idx = 0; idx < 10; idx++) {
      // Map index to angle (offset by -90 deg so 0 is at the absolute top)
      const angleDeg = (idx * 36) - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      coords.push({
        idx,
        cx: centerX + radius * Math.cos(angleRad),
        cy: centerY + radius * Math.sin(angleRad),
        label: idx.toString(),
      });
    }
    return coords;
  }, []);

  // Listen to global keypresses to advance the mechanical stepping dial [22]
  useEffect(() => {
    let timer: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Exclude system keys, navigation modifiers, and utility operations
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ['Control', 'Shift', 'Alt', 'Meta', 'Escape'].includes(e.key) ||
        e.key.startsWith('Arrow') ||
        e.key.startsWith('F')
      ) {
        return;
      }

      // Check for alphanumeric keys, backspaces, spaces, and CLI indicators [22]
      if (
        e.key.length === 1 ||
        ['Backspace', 'Spacebar', ' ', 'Enter', '`'].includes(e.key)
      ) {
        setStep((prev) => (prev + 1) % 10);
        setPlungerActive(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setPlungerActive(false), 85);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className="p-4 border rounded-[2px] w-64 select-none relative"
      style={{
        borderColor: colors.archive.grayDark || '#2a2a28',
        backgroundColor: 'rgba(10, 8, 6, 0.96)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 0 16px rgba(0,0,0,0.9)',
      }}
    >
      {/* Header and instrument classification tag */}
      <div className="flex justify-between items-center mb-3">
        <span
          style={{
            fontFamily: typography.mono,
            fontSize: '8.5px',
            letterSpacing: '0.12em',
            color: colors.archive.grayLight || '#a4a29b',
          }}
        >
          STROWGER SELECTOR // MDL-11A
        </span>
        {/* Glow neon indicating line activity */}
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: typography.mono, fontSize: '7px', color: colors.archive.gray }}>LINE_ACT</span>
          <div
            className="w-2.5 h-2.5 rounded-full transition-all duration-75"
            style={{
              backgroundColor: plungerActive ? microform.halogen : '#2a1a12',
              boxShadow: plungerActive 
                ? `0 0 10px ${microform.halogen}, 0 0 4px ${microform.halogen}`
                : 'none',
              border: '1px solid #1a1510',
            }}
          />
        </div>
      </div>

      {/* Main SVG Dial & Magnet Mechanics */}
      <div
        className="py-3 px-4 mb-3 border relative overflow-hidden flex items-center justify-center"
        style={{
          backgroundColor: '#070503',
          borderColor: 'rgba(26, 17, 10, 0.6)',
          height: '110px',
        }}
      >
        <svg viewBox="0 0 130 100" className="w-full h-full max-w-[190px]">
          {/* Main Dial Circular Rails */}
          <circle cx="50" cy="50" r="36" fill="none" stroke="#1f1a14" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="24" fill="none" stroke="#16120e" strokeDasharray="2, 4" strokeWidth="1" />

          {/* Stepped radial contact pins */}
          {terminals.map((pin) => {
            const isTarget = step === pin.idx;
            const pinColor = isTarget ? microform.halogen : '#3a2e22';
            
            return (
              <g key={`pin-${pin.idx}`}>
                <circle
                  cx={pin.cx}
                  cy={pin.cy}
                  r={isTarget ? 3.5 : 2}
                  fill={isTarget ? microform.halogen : 'none'}
                  stroke={pinColor}
                  strokeWidth={1.2}
                  style={{
                    filter: isTarget ? `drop-shadow(0 0 3px ${microform.halogen})` : 'none',
                    transition: 'r 80ms ease, fill 80ms ease',
                  }}
                />
                {isTarget && (
                  <text
                    x={pin.cx}
                    y={pin.cy + 2.5}
                    textAnchor="middle"
                    fill="#000"
                    style={{
                      fontFamily: typography.mono,
                      fontSize: '6.5px',
                      fontWeight: 'bold',
                    }}
                  >
                    {pin.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Centered needle representing the mechanical rotary wiper */}
          <g transform={`translate(50, 50) rotate(${step * 36})`} style={{ transition: 'transform 100ms cubic-bezier(0.25, 1, 0.5, 1.2)' }}>
            {/* Pointer path */}
            <path d="M 0 -8 L 3 -4 L 1 24 L -1 24 L -3 -4 Z" fill="#bf9f62" stroke="#523d24" strokeWidth="0.8" />
            {/* Center cap core */}
            <circle cx="0" cy="0" r="5.5" fill="#1c1813" stroke="#523d24" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill={plungerActive ? microform.halogen : '#3a2a1b'} style={{ transition: 'fill 80ms ease' }} />
          </g>

          {/* Electromagnetic copper wire solenoid plunger (renders at the right-hand panel) */}
          <g transform="translate(98, 30)">
            {/* Magnetic iron bracket */}
            <rect x="0" y="0" width="24" height="44" fill="none" stroke="#3a3228" strokeWidth="1" rx="1" />
            
            {/* Solenoid plunger shaft */}
            <rect
              x="9"
              y={plungerActive ? 6 : 2}
              width="6"
              height="36"
              fill="#2a2620"
              stroke="#4d443a"
              strokeWidth="0.8"
              style={{ transition: 'y 80ms ease-out' }}
            />

            {/* Copper wire windings block - squashes procedurally on charge rise */}
            <g
              transform={`translate(4, 12) scale(1, ${plungerActive ? '0.86' : '1.0'})`}
              style={{ transformOrigin: 'bottom', transition: 'transform 80ms ease-out' }}
            >
              <rect x="0" y="0" width="16" height="22" fill="#7a452a" stroke="#a35a37" strokeWidth="0.8" rx="0.5" />
              {/* Copper shine horizontal lines */}
              <line x1="2" y1="4" x2="14" y2="4" stroke="#c2703a" strokeWidth="0.8" opacity="0.5" />
              <line x1="2" y1="9" x2="14" y2="9" stroke="#c2703a" strokeWidth="0.8" opacity="0.5" />
              <line x1="2" y1="14" x2="14" y2="14" stroke="#c2703a" strokeWidth="0.8" opacity="0.5" />
              <line x1="2" y1="18" x2="14" y2="18" stroke="#c2703a" strokeWidth="0.8" opacity="0.5" />
            </g>
          </g>
        </svg>
      </div>

      {/* Auxiliary text diagnostics */}
      <div
        className="flex justify-between items-center px-1 font-mono text-[9px]"
        style={{ color: colors.archive.grayLight }}
      >
        <div className="flex flex-col">
          <span style={{ fontSize: '7px', opacity: 0.5, letterSpacing: '0.05em' }}>WIPER POSITION</span>
          <span style={{ color: microform.halogen, fontWeight: 'medium' }}>
            STEP {step.toString().padStart(2, '0')} // RAD_{(step * 36).toString().padStart(3, '0')}°
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span style={{ fontSize: '7px', opacity: 0.5, letterSpacing: '0.05em' }}>SOLENOID FORCE</span>
          <span style={{ color: plungerActive ? colors.archive.green : colors.archive.gray }}>
            {plungerActive ? '22.8 mN' : '0.0 mN'}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const DashboardShell: React.FC = () => {
  // Mount global hotkeys and keyboard navigation
  useKeyboardShortcuts();

  // Mount global mechanical keyboard solenoid typewriter clicks [2, 9, 44]
  useRelayTypingInjector({
    baseVolume: 0.22,
    pitchOffset: 145, // Heavy iron frame resonance base frequency (Hz)
  });

  // Mount high-performance CSS-Variable driven terminal scanline jitters & hold slips [28]
  const { jitterStyles } = useTerminalJitter();

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
      style={{ 
        backgroundColor: colors.archive.black,
        ...jitterStyles,
        transform: `translate(var(--crt-jitter-x, 0px), var(--crt-jitter-y, 0px))`,
        opacity: `var(--crt-flicker, 1)`,
        filter: `contrast(1.05) brightness(var(--crt-flicker, 1))`,
      } as React.CSSProperties}
    >
      {/* CSS-injected Chromatic Aberration Text Shadow Split Filter [28] */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .crt-text-chromatic {
          text-shadow: 
            var(--crt-chromatic-shift, 0px) 0px 0px rgba(255, 0, 0, 0.4),
            calc(var(--crt-chromatic-shift, 0px) * -1) 0px 0px rgba(0, 255, 255, 0.4) !important;
        }
        .crt-scanlines::after {
          content: ' ';
          display: block;
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px);
          opacity: var(--crt-scanline-opacity, 0.12) !important;
          pointer-events: none;
          z-index: 50;
        }
      `
      }} />

      {/* Primary hardware composited scanline wrapper overlay [28] */}
      <div className="fixed inset-0 pointer-events-none crt-scanlines z-50" />

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

        <ArchiveErrorBoundary moduleName="Archival Cases Subsystem">
          <ModulePanel moduleId="investigations" title="ARCHIVAL CASES">
            <InvestigationsPanel />
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

        {/* Floating Instrumental Sensor HUD Stack: Geiger HUD + Strowger Stepper Dial */}
        <AnimatePresence>
          {activeModule === 'atlas' && !activeInvestigationId && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute top-4 right-4 z-20 flex flex-col gap-3 pointer-events-auto"
            >
              <ArchiveErrorBoundary moduleName="Radiometric Geiger Sensor">
                <GeigerHUD />
              </ArchiveErrorBoundary>

              <ArchiveErrorBoundary moduleName="Strowger Stepper Mechanical Dial">
                <StrowgerStepper />
              </ArchiveErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
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
