// components/workspaces/AtlasWorkspace.tsx
'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

import { gameState, useGameState } from '@/logic/gameState';
import { type Place } from '@/logic/gameState';
import { accumulateDust } from '@/logic/actions';

import { ArchiveShell } from '@/components/archive/ArchiveShell';
import { TopStatusBar } from '@/components/archive/TopStatusBar';
import { BottomStatusCluster } from '@/components/archive/BottomStatusCluster';
import { WitchingHourBanner } from '@/components/archive/WitchingHourBanner';
import { WitnessCounter } from '@/components/archive/WitnessCounter';
import { NearestBanner } from '@/components/archive/NearestBanner';
import { MapAgingOverlay } from '@/components/effects/MapAgingOverlay';
import { EchoRipples } from '@/components/effects/EchoRipples';

import { usePlaceLoader } from '@/hooks/usePlaceLoader';
import { useActiveDustEngine } from '@/hooks/useActiveDustEngine';
import { usePhosphorPulse } from '@/hooks/usePhosphorPulse';
import { useMapBreathing } from '@/hooks/useMapBreathing';
import { useWitnessPolling } from '@/hooks/useWitnessPolling';
import { useNearestPlace } from '@/hooks/useNearestPlace';
import { useGhostToast } from '@/hooks/useGhostToast';
import { useAtlasKeyboardShortcuts } from '@/hooks/useAtlasKeyboardShortcuts';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

// External components (preserved from original)
import PlacePanel from '@/components/PlacePanel';
import ExpeditionPlanner from '@/components/ExpeditionPlanner';
import ExpeditionLog from '@/components/ExpeditionLog';
import LanternSystem from '@/components/LanternSystem';
import RandomDestination from '@/components/RandomDestination';
import HelpOverlay from '@/components/HelpOverlay';
import ShortcutHint from '@/components/ShortcutHint';
import MapSearch from '@/components/MapSearch';
import TransmissionFeed from '@/components/TransmissionFeed';
import AtlasBootSequence from '@/components/AtlasBootSequence';
import DustOverlay from '@/components/DustOverlay';
import CollaborativeCursors from '@/components/CollaborativeCursors';
import LyingCompass from '@/components/LyingCompass';
import AbsenceGreeting from '@/components/AbsenceGreeting';
import AtlasInversion from '@/components/AtlasInversion';
import LiveSignalOverlay from '@/components/LiveSignalOverlay';
import AudioEngine from '@/components/AudioEngine';

// External hooks (preserved interfaces, delegate to store where possible)
import { useSeasonalHauntings } from '@/hooks/useSeasonalHauntings';
import { useVisitedPlaces } from '@/hooks/useVisitedPlaces';
import { showToast } from '@/lib/toast';

const MapContainer = dynamic(() => import('@/components/Map/MapContainer'), {
  ssr: false,
  loading: function MapLoadingFallback() {
    return (
      <div className="w-full h-full bg-[#0c0a08] flex items-center justify-center">
        <div className="text-[#9a8a72] font-mono text-sm animate-pulse tracking-widest uppercase">
          Establishing cartographic link...
        </div>
      </div>
    );
  },
});

export default function AtlasWorkspace() {
  const [booted, setBooted] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState<string | null>(
    null
  );
  const [showPlanner, setShowPlanner] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showLanterns, setShowLanterns] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [sessionStart] = useState(Date.now());

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // ─── Shared Foundation State ───
  const state = useGameState();
  const dust = state.dust;
  const places = Object.values(state.places);
  const visiblePlaces = places.filter((p) => gameState.checkUnlock(p.slug));
  const hiddenPlaces = places.filter((p) => !gameState.checkUnlock(p.slug));

  // ─── External Hooks (preserved interfaces) ───
  const { loading } = usePlaceLoader();
  const { isAnniversary } = useSeasonalHauntings();
  const { count: visitedCount, visitGhost } = useVisitedPlaces();
  const { nearest, findNearest, clearNearest } = useNearestPlace();
  const { witnessCount, ghostWitness } = useWitnessPolling(booted);

  // ─── Time & Atmosphere ───
  useTimeOfDay();
  const tod = state.timeOfDay;

  // ─── Bug-Fixed Effects ───
  useActiveDustEngine(booted);
  usePhosphorPulse();
  useMapBreathing();
  useGhostToast(booted);

  // ─── Stable Keyboard Shortcuts ───
  useAtlasKeyboardShortcuts(
    {
      selectedPlace: !!selectedPlace,
      showPlanner,
      showLog,
      showLanterns,
      showHelp,
      nearest: !!nearest,
    },
    {
      togglePlanner: () => setShowPlanner((v) => !v),
      toggleLog: () => setShowLog((v) => !v),
      toggleLanterns: () => setShowLanterns((v) => !v),
      toggleHelp: () => setShowHelp((v) => !v),
      findNearest,
      selectRandomPlace: () => {
        if (places.length > 0) {
          const random = places[Math.floor(Math.random() * places.length)];
          openPlace(random);
        }
      },
      clearSelection: () => setSelectedPlace(null),
      clearNearest,
    }
  );

  // ─── Session time for aging overlay ───
  const sessionTime = Date.now() - sessionStart;

  // ─── Actions ───
  const openPlace = useCallback((place: Place) => {
    accumulateDust(3);
    setSelectedPlace(place);
    setSelectedPlaceSlug(place.slug);

    // Legacy localStorage sync (for components still reading it)
    const logs = JSON.parse(
      localStorage.getItem('vp-expedition-log') || '[]'
    );
    if (!logs.find((l: any) => l.slug === place.slug)) {
      logs.push({
        slug: place.slug,
        name: place.name,
        addedAt: new Date().toISOString(),
      });
      localStorage.setItem('vp-expedition-log', JSON.stringify(logs));
    }

    // Backward-compatible audio event
    window.dispatchEvent(
      new CustomEvent('placeaudiochange', {
        detail: { category: place.category, atmosphere: place.dangerLevel },
      })
    );
  }, []);

  const handleGhostCapture = useCallback(
    (ghost: { name: string; slug: string; coords: string }) => {
      visitGhost(ghost);
    },
    [visitGhost]
  );

  const handleTowerFound = useCallback(() => {
    showToast(
      'A tower hums on frequencies the atlas does not register. The terminal might hear it.',
      'warning'
    );
  }, []);

  const handleBootComplete = useCallback(() => setBooted(true), []);

  const connectedSlugs = selectedPlace ? selectedPlace.connectedTo : [];

  return (
    <ArchiveShell>
      <AtlasBootSequence onComplete={handleBootComplete} />
      <AudioEngine />

      <main
        className={`relative w-full h-[100dvh] overflow-hidden transition-colors duration-[2000ms] select-none ${
          tod === 'night'
            ? 'bg-[#0a0806]'
            : tod === 'dusk'
            ? 'bg-[#14100c]'
            : tod === 'dawn'
            ? 'bg-[#181410]'
            : 'bg-[#0c0a08]'
        }`}
      >
        {/* ─── ATMOSPHERIC LAYER ─── */}
        <DustOverlay />
        <AtlasInversion />
        <CollaborativeCursors />

        {/* Edge vignette (legacy — ArchiveShell also provides one, but preserve for now) */}
        <div
          className="pointer-events-none fixed inset-0 z-[30]"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, transparent 60%, rgba(8,6,4,0.45) 100%)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* ─── MAP AGING OVERLAY ─── */}
        <MapAgingOverlay dust={dust} sessionTime={sessionTime} />

        {/* ─── ECHO RIPPLES ─── */}
        <EchoRipples selectedPlace={selectedPlace} />

        {/* ─── HEADER / HUD ─── */}
        <TopStatusBar
          booted={booted}
          visitedCount={visitedCount}
          places={places}
          visibleCount={visiblePlaces.length}
          onOpenLog={() => setShowLog(true)}
          onOpenPlanner={() => setShowPlanner(true)}
          onOpenLanterns={() => setShowLanterns(true)}
          onOpenPlace={openPlace}
        />

        {/* ─── 03:14 WITCHING HOUR BANNER ─── */}
        <WitchingHourBanner />

        {/* ─── BOTTOM LEFT STATUS CLUSTER ─── */}
        <BottomStatusCluster
          booted={booted}
          visibleCount={visiblePlaces.length}
          totalCount={places.length}
          hauntedCount={places.filter((p) => p.category === 'haunted').length}
          abandonedCount={
            places.filter((p) => p.category === 'abandoned').length
          }
          hoveredPlace={hoveredPlace}
        />

        {/* ─── WITNESS COUNTER ─── */}
        <WitnessCounter
          booted={booted}
          witnessCount={witnessCount}
          ghostWitness={ghostWitness}
        />

        {/* ─── NEAR ME BUTTON ─── */}
        <div className="absolute top-20 md:top-28 right-4 md:right-8 z-40">
          <motion.button
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: booted ? 1 : 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            onClick={findNearest}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm transition-all duration-300 active:scale-95"
            style={{
              color: '#ddd0bc',
              background: 'rgba(12,10,8,0.7)',
              border: '1px solid rgba(122,107,82,0.25)',
              backdropFilter: 'blur(8px)',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(122,107,82,0.1)',
            }}
            title="Locate nearest ruin (N)"
          >
            <Navigation size={13} />
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">
              Locate
            </span>
          </motion.button>
        </div>

        {/* ─── NEAREST BANNER ─── */}
        <NearestBanner
          nearest={nearest}
          onOpenPlace={openPlace}
          onClear={clearNearest}
        />

        {/* ─── SEARCH ─── */}
        <MapSearch
          places={places}
          onSelect={openPlace}
          onFlyTo={(coords) => setMapCenter(coords)}
        />

        {/* ─── MAP ─── */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0">
          <MapContainer
            places={visiblePlaces}
            onSelectPlace={openPlace}
            loading={loading}
            center={mapCenter}
            anniversarySlugs={
              isAnniversary
                ? places
                    .filter((p) => isAnniversary(p.slug))
                    .map((p) => p.slug)
                : []
            }
            onGhostCapture={handleGhostCapture}
            onTowerFound={handleTowerFound}
            onHoverPlace={setHoveredPlace}
            selectedSlug={selectedPlaceSlug}
            connectedSlugs={connectedSlugs}
            agitationLevel={dust}
            hiddenPlaces={hiddenPlaces}
          />
        </div>

        {/* ─── OVERLAYS ─── */}
        <AnimatePresence mode="wait">
          {selectedPlace && (
            <PlacePanel
              key={selectedPlace.slug}
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPlanner && (
            <ExpeditionPlanner
              places={places}
              onClose={() => setShowPlanner(false)}
              onFlyTo={(coords) => setMapCenter(coords)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLog && <ExpeditionLog onClose={() => setShowLog(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {showLanterns && (
            <LanternSystem
              onClose={() => setShowLanterns(false)}
              preselectedPlace={selectedPlace ?? undefined}
              mapCenter={mapCenter}
            />
          )}
        </AnimatePresence>

        <TransmissionFeed />
        <HelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
        <ShortcutHint onClick={() => setShowHelp(true)} />
        <LyingCompass places={places} />
        <AbsenceGreeting />
        <LiveSignalOverlay twitchChannel="atlas_bunker_7" />
      </main>
    </ArchiveShell>
  );
}