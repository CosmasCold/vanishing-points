'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArtifactStore } from '@/state/artifactStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing } from '@/styles/theme';

export const ArtifactViewer: React.FC = () => {
  const {
    activeArtifact,
    rotation,
    zoom,
    lampMode,
    activeMarking,
    closeArtifact,
    rotate,
    adjustZoom,
    setLampMode,
    inspectMarking,
    updateArtifact,
  } = useArtifactStore();
  const { click } = useAudioStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!activeArtifact) return;
      e.preventDefault();
      adjustZoom(e.deltaY > 0 ? -0.15 : 0.15);
    };
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [activeArtifact, adjustZoom]);

  if (!activeArtifact) return null;

  const lampColor =
    lampMode === 'uv' ? 'rgba(60, 100, 200, 0.3)' :
    lampMode === 'magnify' ? 'rgba(255, 250, 220, 0.4)' :
    'transparent';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex flex-col"
      style={{
        marginLeft: spacing.rail,
        marginBottom: spacing.statusBar,
        backgroundColor: 'rgba(26, 26, 24, 0.98)',
      }}
      onClick={closeArtifact}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 h-10 border-b shrink-0"
        style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
      >
        <div className="flex items-center gap-4" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          <span style={{ color: colors.archive.amber }}>ARTIFACT</span>
          <span style={{ color: colors.archive.gray }}>|</span>
          <span style={{ color: colors.archive.white }}>{activeArtifact.name}</span>
          <span style={{ color: colors.archive.gray }}>|</span>
          <span style={{ color: colors.archive.gray }}>{activeArtifact.material.toUpperCase()}</span>
          <span style={{ color: colors.archive.gray }}>|</span>
          <span style={{ color: colors.archive.gray }}>{activeArtifact.weight}</span>
        </div>

        <div className="flex items-center gap-2">
          {(['standard', 'magnify', 'uv', 'measure'] as const).map((mode) => (
            <button
              key={mode}
              onClick={(e) => { e.stopPropagation(); click(); setLampMode(mode); }}
              className="px-2 py-0.5 border text-xs transition-colors hover:border-amber-700"
              style={{
                borderColor: lampMode === mode ? colors.archive.amber : colors.archive.gray,
                color: lampMode === mode ? colors.archive.amber : colors.archive.white,
                fontFamily: typography.mono,
              }}
            >
              {mode.toUpperCase()}
            </button>
          ))}

          <div className="w-px h-5 mx-1" style={{ backgroundColor: colors.archive.gray }} />

          <button
            onClick={(e) => { e.stopPropagation(); click(); closeArtifact(); }}
            className="px-2 py-0.5 border text-xs hover:border-red-700 transition-colors"
            style={{ borderColor: colors.archive.red, color: colors.archive.red, fontFamily: typography.mono }}
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Examination surface */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Desk surface texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, ${colors.archive.surfaceRaised} 0%, ${colors.archive.black} 100%)`,
            }}
          />

          {/* Lamp cone */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${lampColor} 0%, transparent 60%)`,
              opacity: lampMode === 'standard' ? 0 : 1,
            }}
          />

          {/* Artifact representation */}
          <motion.div
            className="relative cursor-grab active:cursor-grabbing"
            style={{
              width: 240,
              height: 240,
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease-out',
            }}
            drag
            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            dragElastic={0.1}
          >
            {/* Artifact body */}
            <div
              className="w-full h-full border-2 relative"
              style={{
                borderColor: colors.archive.gray,
                backgroundColor: activeArtifact.material === 'metal' ? 'rgba(140, 140, 140, 0.15)' :
                  activeArtifact.material === 'glass' ? 'rgba(180, 200, 220, 0.1)' :
                  activeArtifact.material === 'wood' ? 'rgba(120, 90, 60, 0.2)' :
                  activeArtifact.material === 'fabric' ? 'rgba(160, 80, 80, 0.1)' :
                  'rgba(100, 100, 100, 0.15)',
                borderRadius: activeArtifact.material === 'ceramic' ? '4px' : '0px',
                boxShadow: activeArtifact.condition === 'corroded'
                  ? 'inset 0 0 30px rgba(80, 60, 40, 0.3)'
                  : 'inset 0 0 20px rgba(0,0,0,0.2)',
              }}
            >
              {/* Marking hotspots */}
              {activeArtifact.markings.map((marking) => (
                <button
                  key={marking.id}
                  onClick={(e) => { e.stopPropagation(); click(); inspectMarking(marking); }}
                  className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 transition-all"
                  style={{
                    top: `${30 + (marking.id.charCodeAt(0) % 40)}%`,
                    left: `${25 + (marking.id.charCodeAt(1) % 50)}%`,
                  }}
                >
                  <div
                    className="w-full h-full rounded-full animate-pulse"
                    style={{
                      backgroundColor: activeMarking?.id === marking.id ? colors.archive.amber : colors.archive.red,
                      opacity: 0.6,
                      boxShadow: `0 0 8px ${activeMarking?.id === marking.id ? colors.archive.amber : colors.archive.red}`,
                    }}
                  />
                </button>
              ))}

              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span
                  style={{
                    color: colors.archive.gray,
                    fontFamily: typography.mono,
                    fontSize: typography.sizes.xs,
                    opacity: 0.4,
                    transform: `rotate(${-rotation}deg)`,
                  }}
                >
                  {activeArtifact.dimensions}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Rotation controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); click(); rotate(-45); }}
              className="px-3 py-1 border text-xs hover:border-amber-700 transition-colors"
              style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono }}
            >
              ← 45°
            </button>
            <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, minWidth: '4rem', textAlign: 'center' }}>
              {rotation}°
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); click(); rotate(45); }}
              className="px-3 py-1 border text-xs hover:border-amber-700 transition-colors"
              style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono }}
            >
              45° →
            </button>
          </div>

          {/* Zoom controls */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); click(); adjustZoom(0.25); }}
              className="px-2 py-1 border text-xs hover:border-amber-700 transition-colors"
              style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono }}
            >
              +
            </button>
            <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '0.625rem', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); click(); adjustZoom(-0.25); }}
              className="px-2 py-1 border text-xs hover:border-amber-700 transition-colors"
              style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono }}
            >
              -
            </button>
          </div>
        </div>

        {/* Sidebar: Markings & Metadata */}
        <div
          className="w-80 border-l overflow-y-auto p-4 shrink-0"
          style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surfaceRaised }}
        >
          <div className="space-y-6">
            {/* Quarantine status */}
            <div>
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.25rem' }}>
                QUARANTINE STATUS
              </div>
              <div
                style={{
                  color:
                    activeArtifact.quarantineStatus === 'anomalous' ? colors.archive.red :
                    activeArtifact.quarantineStatus === 'pending' ? colors.archive.amber :
                    colors.archive.green,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                }}
              >
                {activeArtifact.quarantineStatus.toUpperCase()}
              </div>
            </div>

            {/* Description */}
            <div>
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.25rem' }}>
                DESCRIPTION
              </div>
              <p style={{ color: colors.archive.white, fontSize: typography.sizes.sm, lineHeight: '1.6', fontFamily: typography.serif }}>
                {activeArtifact.description}
              </p>
            </div>

            {/* Markings list */}
            <div>
              <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                MARKINGS & ANOMALIES
              </div>
              {activeArtifact.markings.length === 0 ? (
                <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>None recorded</div>
              ) : (
                <div className="space-y-2">
                  {activeArtifact.markings.map((marking) => (
                    <button
                      key={marking.id}
                      onClick={() => { click(); inspectMarking(marking); }}
                      className="w-full text-left p-2 border transition-colors"
                      style={{
                        borderColor: activeMarking?.id === marking.id ? colors.archive.amber : colors.archive.gray,
                        backgroundColor: activeMarking?.id === marking.id ? 'rgba(184, 149, 106, 0.1)' : 'transparent',
                      }}
                    >
                      <div style={{ color: colors.archive.white, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                        {marking.type.toUpperCase()}: {marking.location}
                      </div>
                      <div style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.serif, marginTop: '0.125rem' }}>
                        {marking.description}
                      </div>
                      {(marking.requiresMagnification || marking.requiresUV) && (
                        <div style={{ color: colors.archive.amber, fontSize: '0.625rem', fontFamily: typography.mono, marginTop: '0.25rem' }}>
                          {marking.requiresMagnification && '[MAGNIFY] '}
                          {marking.requiresUV && '[UV]'}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Marking detail */}
            <AnimatePresence>
              {activeMarking && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 border"
                  style={{ borderColor: colors.archive.amber, backgroundColor: 'rgba(184, 149, 106, 0.05)' }}
                >
                  <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.25rem' }}>
                    ACTIVE INSPECTION
                  </div>
                  <div style={{ color: colors.archive.white, fontSize: typography.sizes.sm, fontFamily: typography.serif }}>
                    {activeMarking.description}
                  </div>
                  <div style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono, marginTop: '0.5rem' }}>
                    Location: {activeMarking.location}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recovery info */}
            <div>
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.25rem' }}>
                RECOVERY
              </div>
              <div style={{ color: colors.archive.white, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                {activeArtifact.origin}
              </div>
              <div style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
                {activeArtifact.recoveredBy} / {activeArtifact.dateRecovered}
              </div>
            </div>

            {/* Examination checklist */}
            <div className="space-y-2">
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                EXAMINATION LOG
              </div>
              {[
                { label: 'WEIGHED', done: activeArtifact.hasBeenWeighed },
                { label: 'PHOTOGRAPHED', done: activeArtifact.hasBeenPhotographed },
                { label: 'SCANNED', done: activeArtifact.hasBeenScanned },
              ].map((check) => (
                <div key={check.label} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 border"
                    style={{
                      borderColor: check.done ? colors.archive.green : colors.archive.gray,
                      backgroundColor: check.done ? colors.archive.green : 'transparent',
                    }}
                  />
                  <span
                    style={{
                      color: check.done ? colors.archive.green : colors.archive.gray,
                      fontSize: '0.625rem',
                      fontFamily: typography.mono,
                    }}
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};