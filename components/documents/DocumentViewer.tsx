'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/state/documentStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing, microform } from '@/styles/theme';
import { DocumentArtifact, DocumentType } from '@/types/documents';

const TYPE_META: Record<DocumentType, { label: string; font: string; size: string; leading: string }> = {
  typed_report: { label: 'OFFICIAL REPORT', font: typography.mono, size: '0.8125rem', leading: '1.65' },
  handwritten: { label: 'HANDWRITTEN LETTER', font: typography.serif, size: '0.9375rem', leading: '1.7' },
  blueprint: { label: 'TECHNICAL DRAWING', font: typography.mono, size: '0.75rem', leading: '1.5' },
  telegram: { label: 'TELEGRAM', font: typography.mono, size: '0.875rem', leading: '1.8' },
  form: { label: 'INSTITUTIONAL FORM', font: typography.mono, size: '0.8125rem', leading: '1.6' },
  newspaper: { label: 'PRESS CLIPPING', font: typography.serif, size: '0.9375rem', leading: '1.65' },
  photograph: { label: 'PHOTOGRAPH', font: typography.mono, size: '0.8125rem', leading: '1.6' },
  journal: { label: 'FIELD JOURNAL', font: typography.serif, size: '0.9375rem', leading: '1.75' },
  field_report: { label: 'FIELD REPORT', font: typography.mono, size: '0.8125rem', leading: '1.65' },
  witness_statement: { label: 'WITNESS STATEMENT', font: typography.serif, size: '0.9375rem', leading: '1.7' },
  bunker7_transmission: { label: 'BUNKER_7 TRANSMISSION', font: typography.mono, size: '0.8125rem', leading: '1.65' },
};

const CONDITION_OPACITY: Record<string, number> = {
  pristine: 1,
  aged: 0.9,
  damaged: 0.78,
  corrupted: 0.7,
  fragment: 0.6,
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
        backgroundColor: 'rgba(12, 10, 8, 0.97)',
      }}
      onClick={closeDocument}
    >
      {/* Toolbar — iron/mahogany chassis */}
      <div
        className="flex items-center justify-between px-4 h-10 shrink-0"
        style={{
          background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
          borderBottom: `1px solid ${microform.iron}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div className="flex items-center gap-4" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
          <span style={{ color: microform.halogen, textShadow: microform.halogenText }}>
            {meta.label}
          </span>
          <span style={{ color: colors.archive.gray, opacity: 0.4 }}>|</span>
          <span style={{ color: colors.archive.gray }}>{activeDocument.date}</span>
          <span style={{ color: colors.archive.gray, opacity: 0.4 }}>|</span>
          <span style={{ color: colors.archive.gray }}>{activeDocument.author}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); click(); adjustZoom(0.25); }}
            className="px-2 py-0.5 text-xs transition-colors hover:opacity-70"
            style={{
              border: `1px solid ${microform.mahoganyLight}`,
              color: colors.archive.white,
              fontFamily: typography.mono,
              background: microform.iron,
            }}
          >
            +
          </button>
          <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, minWidth: '3rem', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); click(); adjustZoom(-0.25); }}
            className="px-2 py-0.5 text-xs transition-colors hover:opacity-70"
            style={{
              border: `1px solid ${microform.mahoganyLight}`,
              color: colors.archive.white,
              fontFamily: typography.mono,
              background: microform.iron,
            }}
          >
            -
          </button>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: microform.mahoganyLight }} />

          <button
            onClick={(e) => { e.stopPropagation(); click(); setRotation(rotation === 0 ? 90 : 0); }}
            className="px-2 py-0.5 text-xs transition-colors hover:opacity-70"
            style={{
              border: `1px solid ${microform.mahoganyLight}`,
              color: colors.archive.white,
              fontFamily: typography.mono,
              background: microform.iron,
            }}
          >
            ROT
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); click(); toggleUV(); }}
            className="px-2 py-0.5 text-xs transition-colors hover:opacity-70"
            style={{
              border: `1px solid ${showUV ? colors.archive.blue : microform.mahoganyLight}`,
              color: showUV ? colors.archive.blue : colors.archive.white,
              fontFamily: typography.mono,
              background: microform.iron,
            }}
          >
            UV
          </button>

          {hasAnnotation && (
            <button
              onClick={(e) => { e.stopPropagation(); click(); toggleAnnotation(); }}
              className="px-2 py-0.5 text-xs transition-colors hover:opacity-70"
              style={{
                border: `1px solid ${showAnnotation ? colors.archive.amber : microform.mahoganyLight}`,
                color: showAnnotation ? colors.archive.amber : colors.archive.white,
                fontFamily: typography.mono,
                background: microform.iron,
              }}
            >
              NOTE
            </button>
          )}

          {activeDocument.corruptedContent && (
            <button
              onClick={(e) => { e.stopPropagation(); click(); setShowCorrupted(!showCorrupted); }}
              className="px-2 py-0.5 text-xs transition-colors hover:opacity-70"
              style={{
                border: `1px solid ${showCorrupted ? colors.archive.red : microform.mahoganyLight}`,
                color: showCorrupted ? colors.archive.red : colors.archive.white,
                fontFamily: typography.mono,
                background: microform.iron,
              }}
            >
              {showCorrupted ? 'ORIGINAL' : 'CORRUPTED'}
            </button>
          )}

          <div className="w-px h-5 mx-1" style={{ backgroundColor: microform.mahoganyLight }} />

          <button
            onClick={(e) => { e.stopPropagation(); click(); closeDocument(); }}
            className="px-3 py-0.5 text-xs transition-colors hover:opacity-70"
            style={{
              border: `1px solid ${colors.archive.red}`,
              color: colors.archive.red,
              fontFamily: typography.mono,
              background: microform.iron,
            }}
          >
            × CLOSE
          </button>
        </div>
      </div>

      {/* Document workspace */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative flex items-start justify-center py-12"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 20%, rgba(255, 170, 85, 0.025) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 50%, rgba(20, 18, 14, 0.5) 0%, transparent 100%)
          `,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-8 items-start">
          {/* Main document page */}
          <motion.div
            className="relative shrink-0"
            style={{
              width: '34rem',
              minHeight: '44rem',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center top',
            }}
          >
            {/* Paper sheet */}
            <div
              className="relative w-full min-h-[44rem] p-10"
              style={{
                backgroundColor: microform.paperWarm,
                backgroundImage: `
                  linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 10%),
                  linear-gradient(0deg, rgba(0,0,0,0.03) 0%, transparent 10%)
                `,
                boxShadow: `
                  0 1px 2px rgba(0,0,0,0.15),
                  0 4px 12px rgba(0,0,0,0.2),
                  0 12px 32px rgba(0,0,0,0.25),
                  inset 0 0 60px rgba(139, 119, 89, 0.04)
                `,
                opacity: conditionOpacity,
                fontFamily: meta.font,
                fontSize: meta.size,
                lineHeight: meta.leading,
                color: '#2a2620',
              }}
            >
              {/* Fold marks */}
              {activeDocument.foldMarks && activeDocument.foldMarks > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: activeDocument.foldMarks }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0"
                      style={{
                        top: `${(i + 1) * (100 / (activeDocument.foldMarks! + 1))}%`,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent 2%, rgba(80,70,50,0.15) 10%, rgba(80,70,50,0.25) 50%, rgba(80,70,50,0.15) 90%, transparent 98%)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.3)',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Coffee stain */}
              {activeDocument.coffeeStain && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: 90,
                    height: 90,
                    right: 30,
                    bottom: 60,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(120, 90, 60, 0.12) 0%, rgba(120, 90, 60, 0.06) 40%, transparent 70%)',
                    filter: 'blur(1px)',
                    transform: 'scale(1.2, 1)',
                  }}
                />
              )}

              {/* Water damage */}
              {activeDocument.waterDamage && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(100, 120, 140, 0.06) 0%, transparent 30%, transparent 70%, rgba(100, 120, 140, 0.08) 100%)',
                    mixBlendMode: 'multiply',
                  }}
                />
              )}

              {/* Burn marks */}
              {activeDocument.burnMarks && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    inset: -2,
                    borderRadius: 1,
                    boxShadow: 'inset 0 0 30px rgba(40, 20, 10, 0.25), inset 0 0 80px rgba(40, 20, 10, 0.1)',
                  }}
                />
              )}

              {/* UV overlay */}
              {showUV && (
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: 'rgba(60, 20, 120, 0.08)',
                    mixBlendMode: 'color-dodge',
                  }}
                />
              )}

              {/* Header stamp */}
              <div
                className="mb-8 pb-4"
                style={{
                  borderBottom: '1px solid rgba(80, 70, 50, 0.2)',
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  color: '#5a5040',
                  letterSpacing: '0.04em',
                }}
              >
                <div className="flex justify-between items-baseline">
                  <span>REF: {activeDocument.id.toUpperCase()}</span>
                  <span
                    style={{
                      color: activeDocument.verificationStatus === 'verified' ? '#5a7a5a' : activeDocument.verificationStatus === 'forged' ? '#a85d5d' : '#8a7a5a',
                      border: `1px solid ${activeDocument.verificationStatus === 'verified' ? '#5a7a5a' : activeDocument.verificationStatus === 'forged' ? '#a85d5d' : '#8a7a5a'}`,
                      padding: '1px 6px',
                    }}
                  >
                    {activeDocument.verificationStatus.toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 flex gap-4">
                  <span>SOURCE: {activeDocument.source.toUpperCase()}</span>
                  <span>PAGES: {activeDocument.pages}</span>
                  <span>INK: {activeDocument.inkType.toUpperCase()}</span>
                </div>
              </div>

              {/* Title */}
              <h2
                className="mb-6"
                style={{
                  fontFamily: typography.serif,
                  fontSize: typography.sizes.lg,
                  color: '#1a1814',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                {activeDocument.title}
              </h2>

              {/* Body content */}
              <div
                className="whitespace-pre-wrap"
                style={{
                  textShadow: showUV ? '0 0 1px rgba(80, 60, 180, 0.3)' : 'none',
                }}
              >
                {displayContent.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Corruption overlay text */}
              {activeDocument.corruptionLevel > 0.3 && !showCorrupted && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  style={{
                    background: 'rgba(20, 18, 14, 0.03)',
                    mixBlendMode: 'multiply',
                  }}
                >
                  <div
                    className="text-center rotate-[-12deg]"
                    style={{
                      fontFamily: typography.mono,
                      fontSize: '4rem',
                      color: 'rgba(160, 40, 40, 0.04)',
                      letterSpacing: '0.3em',
                      fontWeight: 700,
                    }}
                  >
                    CORRUPTED
                  </div>
                </div>
              )}

              {/* Footer metadata */}
              <div
                className="mt-12 pt-4"
                style={{
                  borderTop: '1px solid rgba(80, 70, 50, 0.2)',
                  fontFamily: typography.mono,
                  fontSize: '0.6875rem',
                  color: '#8a8070',
                }}
              >
                <div className="flex justify-between">
                  <span>RECOVERED: {new Date(activeDocument.recoveredAt).toLocaleDateString()}</span>
                  <span>BY: {activeDocument.recoveredBy.toUpperCase()}</span>
                </div>
                {activeDocument.relatedDocuments.length > 0 && (
                  <div className="mt-1">
                    SEE ALSO: {activeDocument.relatedDocuments.join(', ').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Annotation sidebar */}
          <AnimatePresence>
            {showAnnotation && hasAnnotation && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-64 shrink-0"
                style={{
                  background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
                  border: `1px solid ${microform.iron}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
              >
                <div
                  className="px-4 py-3"
                  style={{
                    borderBottom: `1px solid ${microform.iron}`,
                    fontFamily: typography.mono,
                    fontSize: typography.sizes.xs,
                    color: microform.halogen,
                    textShadow: microform.halogenText,
                    letterSpacing: '0.08em',
                  }}
                >
                  MARGINALIA
                </div>
                <div
                  className="p-4 whitespace-pre-wrap"
                  style={{
                    fontFamily: typography.serif,
                    fontSize: typography.sizes.sm,
                    color: colors.archive.white,
                    lineHeight: 1.7,
                    opacity: 0.85,
                  }}
                >
                  {annotationText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};