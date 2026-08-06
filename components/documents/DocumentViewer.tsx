'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/state/documentStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing } from '@/styles/theme';
import { DocumentArtifact, DocumentType } from '@/types/documents';

const TYPE_META: Record<DocumentType, { label: string; font: string; size: string }> = {
  typed_report: { label: 'OFFICIAL REPORT', font: typography.mono, size: '0.8125rem' },
  handwritten: { label: 'HANDWRITTEN LETTER', font: typography.serif, size: '0.9375rem' },
  blueprint: { label: 'TECHNICAL DRAWING', font: typography.mono, size: '0.75rem' },
  telegram: { label: 'TELEGRAM', font: typography.mono, size: '0.875rem' },
  form: { label: 'INSTITUTIONAL FORM', font: typography.mono, size: '0.8125rem' },
  newspaper: { label: 'PRESS CLIPPING', font: typography.serif, size: '0.875rem' },
  photograph: { label: 'PHOTOGRAPH', font: typography.mono, size: '0.8125rem' },
  journal: { label: 'FIELD JOURNAL', font: typography.serif, size: '0.9375rem' },
  field_report: { label: 'FIELD REPORT', font: typography.mono, size: '0.8125rem' },
  witness_statement: { label: 'WITNESS STATEMENT', font: typography.serif, size: '0.9375rem' },
  bunker7_transmission: { label: 'BUNKER_7 TRANSMISSION', font: typography.mono, size: '0.8125rem' },
};

const CONDITION_OPACITY: Record<string, number> = {
  pristine: 1,
  aged: 0.92,
  damaged: 0.78,
  corrupted: 0.7,
  fragment: 0.65,
};

export const DocumentViewer: React.FC = () => {
  const {
    activeDocument,
    zoom,
    rotation,
    showUV,
    showAnnotation,
    closeDocument,
    adjustZoom,
    setRotation,
    toggleUV,
    toggleAnnotation,
  } = useDocumentStore();
  const { click } = useAudioStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCorrupted, setShowCorrupted] = useState(false);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!activeDocument) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      adjustZoom(delta);
    };

    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [activeDocument, adjustZoom]);

  if (!activeDocument) return null;

  const meta = TYPE_META[activeDocument.type];
  const conditionOpacity = CONDITION_OPACITY[activeDocument.condition] || 1;

  // Determine displayed content
  const displayContent = showCorrupted && activeDocument.corruptedContent
    ? activeDocument.corruptedContent
    : activeDocument.content;

  const hasAnnotation = activeDocument.annotations.length > 0;
  const annotationText = activeDocument.annotations.join('\n\n');

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
      onClick={closeDocument}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 h-10 border-b shrink-0"
        style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
      >
        <div className="flex items-center gap-4" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          <span style={{ color: colors.archive.amber }}>{meta.label}</span>
          <span style={{ color: colors.archive.gray }}>|</span>
          <span style={{ color: colors.archive.gray }}>{activeDocument.date}</span>
          <span style={{ color: colors.archive.gray }}>|</span>
          <span style={{ color: colors.archive.gray }}>{activeDocument.author}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); click(); adjustZoom(0.25); }}
            className="px-2 py-0.5 border text-xs hover:border-amber-700 transition-colors"
            style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono }}
          >
            +
          </button>
          <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, minWidth: '3rem', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); click(); adjustZoom(-0.25); }}
            className="px-2 py-0.5 border text-xs hover:border-amber-700 transition-colors"
            style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono }}
          >
            -
          </button>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: colors.archive.gray }} />

          <button
            onClick={(e) => { e.stopPropagation(); click(); setRotation(rotation === 0 ? 90 : 0); }}
            className="px-2 py-0.5 border text-xs hover:border-amber-700 transition-colors"
            style={{ borderColor: colors.archive.gray, color: colors.archive.white, fontFamily: typography.mono }}
          >
            ROT
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); click(); toggleUV(); }}
            className="px-2 py-0.5 border text-xs hover:border-amber-700 transition-colors"
            style={{
              borderColor: showUV ? colors.archive.blue : colors.archive.gray,
              color: showUV ? colors.archive.blue : colors.archive.white,
              fontFamily: typography.mono,
            }}
          >
            UV
          </button>

          {hasAnnotation && (
            <button
              onClick={(e) => { e.stopPropagation(); click(); toggleAnnotation(); }}
              className="px-2 py-0.5 border text-xs hover:border-amber-700 transition-colors"
              style={{
                borderColor: showAnnotation ? colors.archive.amber : colors.archive.gray,
                color: showAnnotation ? colors.archive.amber : colors.archive.white,
                fontFamily: typography.mono,
              }}
            >
              NOTE
            </button>
          )}

          {activeDocument.corruptedContent && (
            <button
              onClick={(e) => { e.stopPropagation(); click(); setShowCorrupted(!showCorrupted); }}
              className="px-2 py-0.5 border text-xs hover:border-red-700 transition-colors"
              style={{
                borderColor: showCorrupted ? colors.archive.red : colors.archive.gray,
                color: showCorrupted ? colors.archive.red : colors.archive.white,
                fontFamily: typography.mono,
              }}
            >
              {showCorrupted ? 'ORIGINAL' : 'CORRUPTED'}
            </button>
          )}

          <div className="w-px h-5 mx-1" style={{ backgroundColor: colors.archive.gray }} />

          <button
            onClick={(e) => { e.stopPropagation(); click(); closeDocument(); }}
            className="px-2 py-0.5 border text-xs hover:border-red-700 transition-colors"
            style={{ borderColor: colors.archive.red, color: colors.archive.red, fontFamily: typography.mono }}
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="relative"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out',
          }}
        >
          {/* Paper */}
          <div
            className="relative p-8 min-w-[400px] max-w-[600px] shadow-2xl"
            style={{
              backgroundColor: showUV ? '#1a1f2e' : `rgba(232, 228, 216, ${conditionOpacity})`,
              color: showUV ? '#4a90d9' : '#1a1a18',
              fontFamily: meta.font,
              fontSize: meta.size,
              lineHeight: activeDocument.type === 'telegram' ? '1.8' : '1.6',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 0 60px rgba(0,0,0,0.03)',
            }}
          >
            {/* Paper texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
                mixBlendMode: 'multiply',
              }}
            />

            {/* Aging gradient */}
            {!showUV && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 40%, rgba(160, 140, 100, ${activeDocument.corruptionLevel * 50 + 10}) 100%)`,
                  mixBlendMode: 'multiply',
                }}
              />
            )}

            {/* Fold marks */}
            {(activeDocument.foldMarks && activeDocument.foldMarks > 0) && !showUV && (
              <>
                <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                {activeDocument.foldMarks > 1 && (
                  <div className="absolute top-0 bottom-0 left-1/2 w-px pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
                )}
              </>
            )}

            {/* Water damage */}
            {activeDocument.waterDamage && !showUV && (
              <div
                className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(100, 90, 70, 0.15), transparent)',
                }}
              />
            )}

            {/* Burn marks */}
            {activeDocument.burnMarks && !showUV && (
              <div
                className="absolute top-4 right-8 w-12 h-12 rounded-full pointer-events-none"
                style={{
                  border: '1px solid rgba(80, 60, 40, 0.2)',
                  boxShadow: 'inset 0 0 12px rgba(80, 60, 40, 0.15)',
                }}
              />
            )}

            {/* Coffee stain */}
            {activeDocument.coffeeStain && !showUV && (
              <div
                className="absolute bottom-8 right-12 w-24 h-24 rounded-full pointer-events-none"
                style={{
                  border: '2px solid rgba(120, 90, 60, 0.15)',
                  boxShadow: 'inset 0 0 8px rgba(120, 90, 60, 0.1)',
                }}
              />
            )}

            {/* Content */}
            <div className="relative z-10 whitespace-pre-wrap">
              {activeDocument.type === 'telegram' ? (
                <div>
                  <div style={{ borderBottom: '1px solid rgba(0,0,0,0.2)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    TELEGRAM
                  </div>
                  <div style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    {displayContent}
                  </div>
                </div>
              ) : activeDocument.type === 'blueprint' ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
                    [TECHNICAL DRAWING — NOT TO SCALE]
                  </div>
                  <div style={{ fontFamily: typography.mono, lineHeight: '1.4' }}>
                    {displayContent}
                  </div>
                </div>
              ) : (
                displayContent
              )}
            </div>

            {/* Annotation (margin note) */}
            <AnimatePresence>
              {showAnnotation && hasAnnotation && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute -right-4 top-12 w-48 p-2 border"
                  style={{
                    borderColor: colors.archive.amber,
                    backgroundColor: 'rgba(255, 250, 230, 0.95)',
                    color: '#5a4a2a',
                    fontFamily: typography.serif,
                    fontSize: '0.75rem',
                    lineHeight: '1.4',
                    boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                    transform: 'rotate(-2deg)',
                  }}
                >
                  <div style={{ color: colors.archive.amber, fontSize: '0.625rem', fontFamily: typography.mono, marginBottom: '0.25rem' }}>
                    MARGINALIA
                  </div>
                  {annotationText}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Provenance footer */}
      <div
        className="shrink-0 px-4 py-2 border-t flex justify-between items-center"
        style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
      >
        <div className="flex gap-4" style={{ fontFamily: typography.mono, fontSize: '0.625rem', color: colors.archive.gray }}>
          <span>COND: {activeDocument.condition.toUpperCase()}</span>
          <span>TIER: {activeDocument.tier}</span>
          <span>VERIFIED: {activeDocument.verificationStatus.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily: typography.mono, fontSize: '0.625rem', color: colors.archive.gray }}>
          RECOVERED: {activeDocument.recoveredBy} / {activeDocument.recoveredAt.split('T')[0]}
        </div>
      </div>
    </motion.div>
  );
};