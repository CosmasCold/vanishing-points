// components/workspaces/TerminalWorkspace.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';

import { gameState, useGameState } from '@/logic/gameState';
import { eventBus } from '@/logic/eventBus';
import { accumulateDust } from '@/logic/actions';
import { ArchiveShell } from '@/components/archive/ArchiveShell';

import { THEMES, cycleTheme } from '@/lib/terminalThemes';
import type { TerminalTheme } from '@/lib/terminalThemes';
import type { ThemeKey } from '@/logic/gameState';
import {
  LOGS, COMMAND_REGISTRY, TIER_GHOST_LINES, TIER_HIJACK,
  getGhostTier, getHijackTier, getOtherStatusText,
  NUMBERS_STATIONS,
  type TerminalLine, type LineType, type SideTab,
} from '@/lib/terminalContent';

import TerminalLineView from '@/components/terminal/TerminalLineView';
import TerminalHUD from '@/components/terminal/TerminalHUD';
import TerminalSidebar from '@/components/terminal/TerminalSidebar';
import CommandPalette from '@/components/terminal/CommandPalette';
import TerminalDustParticles from '@/components/effects/TerminalDustParticles';
import StaticWaveform from '@/components/effects/StaticWaveform';
import CaesarWheel from '@/components/puzzles/CaesarWheel';
import DoorCanvas from '@/components/puzzles/DoorCanvas';
import ResonanceGraph from '@/components/puzzles/ResonanceGraph';

// External components (preserved from original)
import TerminalBootSequence from '@/components/TerminalBootSequence';
import VideoModal from '@/components/VideoModal';
import AssetGallery from '@/components/AssetGallery';
import SignalTab from '@/components/SignalTab';
import LeadPanel from '@/components/LeadPanel';
import TheGrid from '@/components/TheGrid';
import SpectrogramViewer from '@/components/SpectrogramViewer';

// External hooks (preserved interfaces)
import { useDustLevel, markEchoesVisited } from '@/hooks/useDustLevel';
import { useCorruptionStage, useIdleGhost, useThreeFourteen } from '@/hooks/useCorruptionStage';
import { useBreachProtocol } from '@/hooks/useBreachProtocol';
import { useKeystrokeAudio } from '@/hooks/useKeystrokeAudio';
import { useArchiveReadings } from '@/hooks/useArchiveReadings';
import { useSubPlaces } from '@/hooks/useSubPlaces';

// External libs (preserved)
import { getSeasonalState } from '@/lib/seasonal';
import {
  getMemory, getOtherEncounters, recordOtherEncounter,
  shouldTriggerOther, getBunkerLie, getGlobalLanternCount,
} from '@/lib/bunkerBrain';
import { recordCommand, getMemoryBasedOtherResponse } from '@/lib/commandMemory';
import { getUnlockedAssets, STORY_ASSETS, ARCHIVE_CODES, getFoundCodes } from '@/lib/assets';
import { getInventory, INVENTORY_ITEMS } from '@/lib/inventory';
import { getDossierProgress } from '@/lib/dossiers';
import { evaluateUnlock, type WitnessState } from '@/lib/unlock-engine';
import { getSubPlaceById } from '@/lib/subPlaces';
import { addDiscovery, getDiscoveries } from '@/lib/discoveries';
import { getDailyCode } from '@/lib/dailyCode';
import { getWeeklyRotation } from '@/lib/weeklyRotation';
import { checkCaesar, DUST_THRESHOLD } from '@/lib/assets';

import { type Place } from '@/logic/gameState';

/* ═══════════════════════════════════════════
   TERMINAL WORKSPACE
   The main composition component for /echoes
   ═══════════════════════════════════════════ */

export default function TerminalWorkspace() {
  const state = useGameState();
  const dust = state.dust;
  const corruptionStage = state.corruptionStage;

  // ─── THEME ───
  const [theme, setTheme] = useState<ThemeKey>('tungsten');
  const t = THEMES[theme];

  // ─── BOOT ───
  const [booted, setBooted] = useState(false);

  // ─── TERMINAL STATE ───
  const lineIdRef = useRef(0);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState(false);
  const [hijacked, setHijacked] = useState(false);
  const [promptLabel, setPromptLabel] = useState('BUNKER_7');
  const [cursorStyle, setCursorStyle] = useState<'block' | 'underscore' | 'pipe'>('underscore');

  // ─── AI CHAT ───
  const [aiHistory, setAiHistory] = useState<{ role: string; content: string }[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // ─── DECRYPT ───
  const [unlocked, setUnlocked] = useState(3);
  const [decryptCode, setDecryptCode] = useState('');
  const [decryptError, setDecryptError] = useState(false);

  // ─── SIDEBAR ───
  const [activeTab, setActiveTab] = useState<SideTab>('logs');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─── PALETTE ───
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  // ─── ASSETS / INVENTORY ───
  const [assets, setAssets] = useState<string[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [lanternCount, setLanternCount] = useState(0);

  // ─── PLACES ───
  const [places, setPlaces] = useState<Place[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  // ─── MODALS ───
  const [activeVideo, setActiveVideo] = useState<{ src: string; label: string } | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showSpectrogram, setShowSpectrogram] = useState(false);
  const [showCipherWheel, setShowCipherWheel] = useState(false);
  const [showResonanceGraph, setShowResonanceGraph] = useState(false);
  const [showDoorCanvas, setShowDoorCanvas] = useState(false);
  const [resonancePlace, setResonancePlace] = useState<Place | null>(null);
  const [resonanceConnections, setResonanceConnections] = useState<Place[]>([]);

  // ─── WALL ───
  const [wallMessages, setWallMessages] = useState<{ text: string; date: string }[]>([]);

  // ─── EXTERNAL HOOKS ───
  const corruption = useCorruptionStage();
  const is314 = useThreeFourteen();
  const { active: breachActive } = useBreachProtocol();
  const { onType } = useKeystrokeAudio();
  const { active: activeReading } = useArchiveReadings();
  const { unlocked: unlockedSubPlaces, current: currentSubPlace, enter: enterSubPlace, exit: exitSubPlace } = useSubPlaces(dust, inventory, codes);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const memory = getMemory();
  const otherCount = getOtherEncounters();

  // ─── INIT ───
  useEffect(() => {
    markEchoesVisited();

    // Theme from legacy localStorage or shared store
    const savedTheme = localStorage.getItem('vp-theme') as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) {
      setTheme(savedTheme);
      gameState.setState({ theme: savedTheme });
    }

    const savedUnlocked = parseInt(localStorage.getItem('vp-logs-unlocked') || '3', 10);
    setUnlocked(savedUnlocked);

    setAssets(getUnlockedAssets());
    setCodes(getFoundCodes());
    setInventory(getInventory());
    setLanternCount(getGlobalLanternCount());

    // Load wall messages
    const wall = JSON.parse(localStorage.getItem('vp-wall') || '[]');
    setWallMessages(wall);

    // Load places
    fetch('/api/places')
      .then((r) => r.json())
      .then((data) => {
        const loaded: Place[] = data.places || [];
        setPlaces(loaded);
        // Hydrate shared store
        const record: Record<string, Place> = {};
        loaded.forEach((p: Place) => { record[p.slug] = p; });
        gameState.setState({ places: record });

        // Evaluate visible
        const logs = JSON.parse(localStorage.getItem('vp-expedition-log') || '[]');
        const witnessState: WitnessState = {
          dust,
          encounters: otherCount,
          inventory: JSON.parse(localStorage.getItem('vp-bunker-inventory') || '[]'),
          visitedSlugs: logs.map((l: { slug?: string }) => l.slug).filter(Boolean),
          unlockedCodes: JSON.parse(localStorage.getItem('vp-found-codes') || '[]'),
          readingsComplete: false,
          now: new Date(),
        };
        const visible = loaded.filter((p: Place) => evaluateUnlock(p, witnessState).visible);
        setVisibleCount(visible.length);
      })
      .catch(() => {});

    // Initial lines
    const hasVisited = localStorage.getItem('vp-echoes-visited') === 'true';
    if (!hasVisited) {
      pushLines([
        '══════════════════════════════════════════',
        'BUNKER_7 TERMINAL v2.4.1',
        '══════════════════════════════════════════',
        '',
        'Signal acquired from surface node.',
        'Dust contamination: 0%',
        'Other encounters: 0',
        '',
        'The archivist is dead. I am what remains.',
        '',
        "Type 'status' to assess the system.",
        "Type 'chat' if you need to speak.",
        "Type 'help' when you are ready for the full command set.",
        '',
        'I have been waiting.',
        '',
      ], 'system');
    } else {
      const visits = JSON.parse(localStorage.getItem('vp-expedition-log') || '[]');
      const lastPlace = visits.length > 0 ? visits[visits.length - 1] : null;
      const initial: string[] = [
        '╔════════════════════════════════════════╗',
        '║     BUNKER_7 TERMINAL v2.4.1           ║',
        '╠════════════════════════════════════════╣',
        ...(lastPlace ? [`║  Last surface contact: ${lastPlace.name.slice(0, 24).padEnd(24)}║`] : []),
        "║  Type 'help' for command list          ║",
        "║  Type 'chat' to speak with BUNKER_7    ║",
        "║  Type '?' for command palette          ║",
        '╚════════════════════════════════════════╝',
        '',
      ];
      pushLines(initial, 'system');
    }
  }, []);

  // ─── SCROLL ───
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, isAiTyping]);

  // ─── CURSOR MUTATION ───
  useEffect(() => {
    if (corruptionStage >= 3) {
      const interval = setInterval(() => {
        const styles: Array<'block' | 'underscore' | 'pipe'> = ['block', 'underscore', 'pipe'];
        setCursorStyle(styles[Math.floor(Math.random() * styles.length)]);
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setCursorStyle('underscore');
    }
  }, [corruptionStage]);

  // ─── PROMPT LABEL ───
  useEffect(() => {
    if (hijacked) setPromptLabel('OTHER');
    else if (chatMode) setPromptLabel('BUNKER_7');
    else setPromptLabel('BUNKER_7');
  }, [hijacked, chatMode]);

  // ─── AUTOCOMPLETE ───
  useEffect(() => {
    if (!input || input.startsWith('>') || chatMode) {
      setSuggestions([]);
      return;
    }
    const clean = input.trim().toLowerCase();
    if (!clean) { setSuggestions([]); return; }
    setSuggestions(
      COMMAND_REGISTRY.filter((c) => c.cmd.startsWith(clean)).map((c) => c.cmd).slice(0, 5)
    );
  }, [input, chatMode]);

  // ─── HELPERS ───
  const pushLines = useCallback((texts: string[], type: LineType = 'normal') => {
    setLines((prev) => [
      ...prev,
      ...texts.map((text) => ({
        id: ++lineIdRef.current,
        text,
        type,
        timestamp: Date.now(),
      })),
    ]);
  }, []);

  const talkToBunker = async (msg: string) => {
    setIsAiTyping(true);
    pushLines([`> ${msg}`], 'input');
    try {
      const res = await fetch('/api/bunker-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: aiHistory,
          memory: {
            name: memory.name,
            lastTopics: memory.lastTopics.slice(-3),
            sentiment: getMemory(),
            otherEncounters: otherCount,
            corruption: corruptionStage,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const response = data.response || '...';
      if (data.other) recordOtherEncounter();
      setAiHistory((h) => [...h.slice(-10), { role: 'user', content: msg }, { role: 'assistant', content: response }]);
      pushLines([response, ''], data.other ? 'other' : 'normal');
    } catch {
      pushLines(['the channel is dead. static only.', ''], 'error');
    } finally {
      setIsAiTyping(false);
    }
  };

  // ─── COMMAND RUNNER ───
  const runCommand = async (cmd: string) => {
    const clean = cmd.trim().toLowerCase();
    if (!clean) return;
    if (chatMode && clean !== 'exit') {
      await talkToBunker(cmd);
      setInput('');
      return;
    }
    setInput('');
    setSuggestions([]);
    setShowPalette(false);

    window.dispatchEvent(new CustomEvent('vp-static', { detail: { duration: 0.2, intensity: 0.05 } }));
    const args = clean.split(' ');
    const base = args[0];
    recordCommand(base);

    // First contact unlock
    const isFirstContact = localStorage.getItem('vp-echoes-visited') !== 'true';
    if (isFirstContact && ['status', 'chat', 'help'].includes(base)) {
      localStorage.setItem('vp-echoes-visited', 'true');
      pushLines([
        '',
        '══════════════════════════════════════════',
        'FULL COMMAND ACCESS GRANTED',
        '══════════════════════════════════════════',
        '',
        'The terminal recognizes your signature.',
        'All systems are now available.',
        '',
      ], 'success');
    }

    // Bunker lie check
    const lie = getBunkerLie(base);
    if (lie) { pushLines([lie, ''], 'other'); return; }

    // Hijack check
    if (hijacked && base !== 'exorcise') {
      pushLines([...getMemoryBasedOtherResponse(base), ''], 'other');
      return;
    }

    switch (base) {
      case 'help':
        pushLines([
          '┌────────────────────────────────────────┐',
          '│ AVAILABLE COMMANDS                     │',
          '├────────────────────────────────────────┤',
          ...COMMAND_REGISTRY.map((c) => `│  ${c.cmd.padEnd(12)} ${c.desc.padEnd(25)}│`),
          '└────────────────────────────────────────┘',
        ], 'system');
        break;

      case 'status': {
        const dossierProg = getDossierProgress();
        pushLines([
          `┌─ TERMINAL DIAGNOSTICS ───────────────┐`,
          `│  ID:        BUNKER_7                 │`,
          `│  STATUS:    SEALED                   │`,
          `│  ATMOSPHERE: BREATHABLE (QUESTIONABLE)│`,
          `│  SIGNAL:    INTERMITTENT             │`,
          `│  THEME:     ${theme.toUpperCase().padEnd(17)}│`,
          `│  LOGS:      ${unlocked}/${LOGS.length} UNLOCKED${' '.repeat(12 - String(unlocked).length - String(LOGS.length).length)}│`,
          `│  DOSSIERS:  ${String(dossierProg.claimed).padEnd(3)}/${dossierProg.total}${' '.repeat(15)}│`,
          `│  ASSETS:    ${String(assets.length).padEnd(3)}/${STORY_ASSETS.length}${' '.repeat(15)}│`,
          `│  CODES:     ${String(codes.length).padEnd(3)}/${ARCHIVE_CODES.length}${' '.repeat(15)}│`,
          `│  CORRUPTION:${corruption.label.padEnd(17)}│`,
          `│  OTHER:     ${otherCount} encounter${otherCount !== 1 ? 's' : ''}${' '.repeat(14 - String(otherCount).length)}│`,
          `│  DUST:      ${String(dust).padEnd(3)}%${' '.repeat(25)}│`,
          `│  ATLAS:     ${visibleCount} places visible${' '.repeat(12 - String(visibleCount).length)}│`,
          '└──────────────────────────────────────┘',
        ], 'system');
        break;
      }

      case 'logs':
        setActiveTab('logs');
        pushLines(['Opening LOGS window...', `${LOGS.length - unlocked} entries remain encrypted.`], 'system');
        break;

      case 'chat':
        setChatMode(true);
        pushLines([
          '╔══════════════════════════════════════╗',
          '║  BUNKER_7 CHANNEL OPEN               ║',
          '╠══════════════════════════════════════╣',
          '║  Speak. The static listens either way║',
          "║  Type 'exit' to return               ║",
          '╚══════════════════════════════════════╝',
        ], 'system');
        break;

      case 'exit':
        if (chatMode) {
          setChatMode(false);
          pushLines(['Channel closed.', 'Returning to command interface.'], 'system');
        } else {
          pushLines(['Nothing to exit.'], 'error');
        }
        break;

      case 'color': {
        const next = cycleTheme(theme);
        setTheme(next);
        gameState.setState({ theme: next });
        localStorage.setItem('vp-theme', next);
        pushLines([`Theme shifted: ${next.toUpperCase()}`, 'The phosphor hums at a different frequency.'], 'system');
        break;
      }

      case 'clear':
        setLines([]);
        break;

      case 'gallery':
        setGalleryOpen(true);
        pushLines(['Opening gallery...'], 'system');
        break;

      case 'wall':
        setActiveTab('wall');
        pushLines(['Opening TRANSMISSION WALL...', `${wallMessages.length} signals archived.`], 'system');
        break;

      case 'grid':
        setShowGrid(true);
        pushLines(['Initializing grid visualization...', 'The atlas is more connected than it appears.'], 'system');
        break;

      case 'spectrogram':
        setShowSpectrogram(true);
        pushLines(['Spectrogram viewer active.', 'Watch the frequencies. They watch back.'], 'system');
        break;

      case 'cipher':
        if (args.length === 1) {
          setShowCipherWheel(true);
          pushLines(['Opening Caesar decoder...', 'Align the wheel to reveal the message.'], 'system');
        } else {
          const ans = args.slice(1).join(' ');
          if (checkCaesar(ans)) {
            pushLines(['DECRYPTION SUCCESSFUL.', 'THE DOOR OPENS INWARD.', 'CODE: INWARD'], 'success');
          } else {
            pushLines(['DECRYPTION FAILED.'], 'error');
          }
        }
        break;

      case 'resonance': {
        const slug = args[1];
        if (!slug) {
          pushLines(["Usage: resonance [archive-slug]", 'Shows connected archives and grid commentary.'], 'error');
          break;
        }
        const place = places.find((p) => p.slug === slug);
        if (!place) {
          pushLines([`Archive '${slug}' not found.`], 'error');
          break;
        }
        const connections = places.filter((p) => place.connectedTo?.includes(p.slug));
        setResonancePlace(place);
        setResonanceConnections(connections);
        setShowResonanceGraph(true);
        pushLines([`Resonance graph for ${place.name} opened.`], 'system');
        break;
      }

      case 'door': {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        if (hour === 3 && min === 14) {
          setShowDoorCanvas(true);
          pushLines(['The door manifests. The wheel is warm.'], 'warning');
        } else if (dust > DUST_THRESHOLD) {
          setShowDoorCanvas(true);
          pushLines(['The door recognizes you. Turn the wheel.'], 'normal');
        } else {
          pushLines(
            [
              `Time: ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
              `Dust: ${dust}%. Insufficient.`,
              'The door is sealed.',
              'It responds at 03:14 or to the dust-claimed.',
            ],
            'normal'
          );
        }
        break;
      }

      case 'atlas':
        pushLines(['Opening atlas...', 'The surface calls back.'], 'system');
        window.location.href = '/';
        break;

      case 'purge': {
        const { dustReset, corruptionReset } = { dustReset: true, corruptionReset: true }; // placeholder
        if (dustReset) {
          pushLines(['PURGE COMPLETE.', 'The dust settles. The static quiets.', 'You are... lighter.'], 'success');
        }
        break;
      }

      default:
        if (chatMode) {
          await talkToBunker(cmd);
        } else {
          pushLines([`Unknown: ${cmd}`, "Type 'help' for commands."], 'error');
        }
    }
  };

  const attemptDecrypt = () => {
    const code = decryptCode.trim().toUpperCase();
    const valid = NUMBERS_STATIONS.some((s) => s.code === code);
    if (valid && unlocked < LOGS.length) {
      const next = Math.min(unlocked + 1, LOGS.length);
      setUnlocked(next);
      localStorage.setItem('vp-logs-unlocked', next.toString());
      setDecryptCode('');
      setDecryptError(false);
      setActiveTab('logs');
    } else {
      setDecryptError(true);
      setTimeout(() => setDecryptError(false), 2000);
    }
  };

  // ─── RENDER ───
  return (
    <ArchiveShell>
      <div className="relative min-h-screen overflow-hidden bg-[#060504] font-mono">
        {/* ─── CRT BEZEL ─── */}
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-4 rounded-xl shadow-[inset_0_0_60px_rgba(0,0,0,0.6),0_0_20px_rgba(0,0,0,0.3)] border border-white/[0.02]" />
          <div className="absolute bottom-2 right-5 text-[4px] font-mono tracking-[0.4em] uppercase opacity-10 text-[#5a4e42] select-none">
            BUNKER_7 // ARCHIVE TERMINAL
          </div>
          {corruptionStage >= 3 && (
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M15 12 L35 42 L28 65 L48 85 L42 125 L72 145 L68 185 L92 195' stroke='%23c4785a' stroke-width='0.3' fill='none'/%3E%3Cpath d='M178 18 L158 48 L163 78 L138 98 L143 128 L118 158 L128 188' stroke='%23c4785a' stroke-width='0.3' fill='none'/%3E%3C/svg%3E") no-repeat center/cover`,
              }}
            />
          )}
        </div>

        {/* ─── ATMOSPHERE ─── */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#0c0a08] to-[#060504]" />
        <div className="vp-scanlines opacity-10" />

        {/* ─── DUST PARTICLES ─── */}
        <TerminalDustParticles theme={t} dust={dust} corruptionStage={corruptionStage} />

        {/* ─── DYNAMIC OVERLAYS ─── */}
        {corruptionStage >= 4 && (
          <div
            className="pointer-events-none fixed inset-0 z-[45] animate-pulse"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${t.corruption}05 0%, transparent 70%)`,
              animationDuration: '4s',
            }}
          />
        )}
        {hijacked && (
          <div
            className="pointer-events-none fixed inset-0 z-[46]"
            style={{
              background: 'linear-gradient(90deg, rgba(255,0,0,0.015) 0%, transparent 50%, rgba(0,255,255,0.015) 100%)',
            }}
          />
        )}

        {/* ─── BOOT SEQUENCE ─── */}
        {!booted && <TerminalBootSequence onComplete={() => setBooted(true)} />}

        <div
          className="relative z-10 flex flex-col h-screen max-w-[1600px] mx-auto"
          style={{ opacity: booted ? 1 : 0, transition: 'opacity 0.8s ease' }}
        >
          {/* ─── HUD ─── */}
          <TerminalHUD
            theme={t}
            themeName={theme}
            dust={dust}
            corruptionLabel={corruption.label}
            corruptionColor={corruption.color}
            otherCount={otherCount}
            unlocked={unlocked}
            totalLogs={LOGS.length}
            visibleCount={visibleCount}
          />

          {/* ─── WORKSPACE ─── */}
          <div className="flex-1 flex overflow-hidden">
            {/* Terminal Column */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0c0a08]/20">
              {/* Terminal Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-[#9a8a72]/5">
                <div className="flex items-center gap-2 text-[7px]">
                  <span className="text-[#9a8a72]/30 uppercase tracking-wider">Session:</span>
                  <span className="text-[#7a9a6a]/50 font-mono">ACTIVE</span>
                  <span className="text-[#9a8a72]/20 mx-1">•</span>
                  <span className="text-[#9a8a72]/30 uppercase tracking-wider">Terminal:</span>
                  <span
                    className="text-[#ddd0bc]/40 font-mono"
                    style={{ color: hijacked ? t.corruption : undefined }}
                  >
                    {hijacked ? 'COMPROMISED' : 'SECURE'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPalette(true)}
                    className="text-[#9a8a72]/30 hover:text-[#ddd0bc]/50 transition-colors text-[6px] uppercase tracking-wider"
                  >
                    [?]
                  </button>
                </div>
              </div>

              {/* Terminal Output */}
              <div
                ref={terminalRef}
                className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9a8a72]/20"
              >
                {lines.map((line) => (
                  <TerminalLineView
                    key={line.id}
                    line={line}
                    theme={t}
                    corruptionStage={corruptionStage}
                    hijacked={hijacked}
                  />
                ))}
                {isAiTyping && (
                  <div className="flex items-center gap-2 mt-2 text-[#9a8a72]/30">
                    <span className="inline-block w-1 h-3 animate-pulse bg-[#9a8a72]/40" />
                    <span className="text-[8px] italic tracking-wider">BUNKER_7 is typing...</span>
                  </div>
                )}
              </div>

              {/* ─── LIVE STATIC WAVEFORM ─── */}
              <StaticWaveform theme={t} active={true} />

              {/* Terminal Input */}
              <div className="flex-shrink-0 relative flex items-center gap-1.5 px-4 py-2 border-t border-[#9a8a72]/8 bg-[#0c0a08]/40">
                <span className="text-[8px] font-bold tracking-wider text-[#9a8a72]/40 select-none">
                  {chatMode ? '~' : promptLabel}
                </span>
                <span className="text-[8px] text-[#9a8a72]/20 select-none">{'>'}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    onType();
                    window.dispatchEvent(new CustomEvent('vp-keystroke'));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runCommand(input);
                    else if (e.key === 'Tab' && suggestions.length > 0) {
                      e.preventDefault();
                      setInput(suggestions[0]);
                      setSuggestions([]);
                    } else if (e.key === '?' && !chatMode && !input) {
                      e.preventDefault();
                      setShowPalette(true);
                      setPaletteQuery('');
                    }
                  }}
                  className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-[#9a8a72]/15 min-w-0"
                  style={{ color: t.primary, caretColor: t.cursor }}
                  placeholder={chatMode ? 'Speak to BUNKER_7...' : 'Enter command...'}
                  spellCheck={false}
                  autoFocus
                />
                <span
                  className={`inline-block ${
                    cursorStyle === 'block' ? 'w-1.5 h-4' : cursorStyle === 'pipe' ? 'w-px h-4' : 'w-2.5 h-px'
                  } opacity-40`}
                  style={{ background: hijacked ? t.corruption : t.cursor }}
                />
                <div className="w-8 h-1.5 bg-[#1a1612] rounded-full overflow-hidden border border-[#9a8a72]/8">
                  <div
                    className="h-full bg-[#9a8a72]/20 transition-all duration-100"
                    style={{ width: `${Math.min(100, input.length * 2)}%` }}
                  />
                </div>

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute left-4 right-4 bottom-full mb-1 border border-[#9a8a72]/10 bg-[#0c0a08]/95 backdrop-blur-sm rounded overflow-hidden shadow-xl"
                    >
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setInput(s);
                            setSuggestions([]);
                            inputRef.current?.focus();
                          }}
                          className="w-full text-left px-3 py-1.5 text-[8px] hover:bg-[#9a8a72]/5 transition-colors flex items-center justify-between"
                        >
                          <span className="text-[#ddd0bc]/70 font-mono">{s}</span>
                          <span className="text-[#9a8a72]/30 text-[7px]">
                            {COMMAND_REGISTRY.find((c) => c.cmd === s)?.desc}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ─── SIDEBAR ─── */}
            <TerminalSidebar
              theme={t}
              activeTab={activeTab}
              onSetTab={setActiveTab}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
              unlocked={unlocked}
              totalLogs={LOGS.length}
              logs={LOGS}
              decryptCode={decryptCode}
              decryptError={decryptError}
              onDecryptCodeChange={setDecryptCode}
              onAttemptDecrypt={attemptDecrypt}
              assets={assets}
              onOpenGallery={() => setGalleryOpen(true)}
              dust={dust}
              triangulated={false}
              inventoryCount={inventory.length}
              totalInventory={INVENTORY_ITEMS.length}
              wallMessages={wallMessages}
              visibleCount={visibleCount}
              signalTab={<SignalTab theme={t} onPushTerminal={pushLines} />}
                            leadsPanel={<LeadPanel theme={t} onPushTerminal={pushLines} />}
            />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 py-1.5 border-t border-[#9a8a72]/5">
            <p className="text-center text-[5px] tracking-[0.4em] uppercase text-[#9a8a72]/10">
              The dust remembers everything
            </p>
          </div>
        </div>

        {/* ─── COMMAND PALETTE ─── */}
        <CommandPalette
          open={showPalette}
          query={paletteQuery}
          onQueryChange={setPaletteQuery}
          onClose={() => setShowPalette(false)}
          onSelect={(cmd) => {
            setShowPalette(false);
            setInput(cmd);
            inputRef.current?.focus();
          }}
          commands={COMMAND_REGISTRY}
        />

        {/* ─── MODALS ─── */}
        {showGrid && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowGrid(false)}>
            <div className="w-full max-w-2xl border border-[#9a8a72]/15 bg-[#0c0a08] p-5 rounded relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[8px] uppercase tracking-[0.3em] font-bold text-[#9a8a72]">The Grid</h2>
                <button onClick={() => setShowGrid(false)} className="text-[8px] text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 uppercase tracking-wider">[x]</button>
              </div>
              <TheGrid />
            </div>
          </div>
        )}
        {showSpectrogram && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowSpectrogram(false)}>
            <div className="w-full max-w-lg border border-[#9a8a72]/15 bg-[#0c0a08] p-5 rounded relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[8px] uppercase tracking-[0.3em] font-bold text-[#9a8a72]">Spectrogram</h2>
                <button onClick={() => setShowSpectrogram(false)} className="text-[8px] text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 uppercase tracking-wider">[x]</button>
              </div>
              <SpectrogramViewer active={true} color={t.primary} />
            </div>
          </div>
        )}

        <VideoModal src={activeVideo?.src || ''} label={activeVideo?.label || ''} isOpen={!!activeVideo} onClose={() => setActiveVideo(null)} />
        <AssetGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} themeColor={t.primary} />

        {showCipherWheel && (
          <CaesarWheel
            onDecode={(shift, decoded) => {
              if (decoded.includes('THE DOOR OPENS INWARD') || decoded === 'THE DOOR OPENS INWARD') {
                pushLines(['DECRYPTION SUCCESSFUL.', 'THE DOOR OPENS INWARD.', 'CODE: INWARD'], 'success');
              } else {
                pushLines([`Decoded: ${decoded}`], 'system');
              }
            }}
            onClose={() => setShowCipherWheel(false)}
          />
        )}

        {showResonanceGraph && resonancePlace && (
          <ResonanceGraph
            place={resonancePlace}
            connections={resonanceConnections}
            onClose={() => setShowResonanceGraph(false)}
          />
        )}

        {showDoorCanvas && (
          <DoorCanvas
            onUnlock={() => {
              pushLines(['The door swings open. A corridor of dust and static.', 'You step through.'], 'success');
            }}
            onClose={() => setShowDoorCanvas(false)}
          />
        )}
      </div>
    </ArchiveShell>
  );
}