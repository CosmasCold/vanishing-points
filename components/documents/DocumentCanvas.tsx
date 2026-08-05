'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentArtifact } from '@/types/documents';
import { useDocumentStore } from '@/state/documentStore';
import { colors } from '@/styles/theme';

interface DocumentCanvasProps {
  doc: DocumentArtifact;
  onClose: () => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({ doc, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showCorrupted, setShowCorrupted] = useState(false);
  const { corruptionIntensity } = useDocumentStore();

  const effectiveCorruption = Math.min(1, doc.corruptionLevel + corruptionIntensity * 0.3);
  const content = showCorrupted && doc.corruptedContent ? doc.corruptedContent : doc.content;

  // Mouse-following tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 8, y: -x * 8 }); // Subtle rotation
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const typewriterFonts: Record<string, string> = {
    typewriter: '"Courier New", Courier, monospace',
    ballpoint: '"Georgia", "Times New Roman", serif',
    fountain: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    carbon: '"Courier New", monospace',
    print: '"Times New Roman", Times, serif',
    marker: '"Arial", sans-serif',
  };

  const paperColors: Record<string, string> = {
    bond: '#f5f0e8',
    thermal: '#f0ece0',
    newsprint: '#e8e0d0',
    photographic: '#f8f8f8',
    handmade: '#ede8d8',
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: '#0a0a08',
        backgroundImage: `
          radial-gradient(ellipse at 30% 20%, rgba(40, 30, 20, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(20, 30, 40, 0.3) 0%, transparent 50%)
        `,
        perspective: '1200px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient desk light following mouse */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(255, 245, 230, 0.03) 0%, transparent 60%)`,
        }}
      />

      {/* The Paper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotateX: tilt.x,
          rotateY: tilt.y,
          y: Math.sin(Date.now() / 2000) * 2, // Subtle hover
        }}
        exit={{ opacity: 0, scale: 0.9, rotateX: 15 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 shadow-2xl"
        style={{
          width: 'min(700px, 90vw)',
          maxHeight: '85vh',
          backgroundColor: paperColors[doc.paperType] || paperColors.bond,
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 20px 60px rgba(0,0,0,0.8),
            0 2px 8px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.3)
          `,
        }}
      >
        {/* Paper grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Fold marks */}
        {doc.foldMarks && (
          <div className="pointer-events-none absolute inset-0 z-10">
            {Array.from({ length: doc.foldMarks }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0"
                style={{
                  top: `${((i + 1) / (doc.foldMarks! + 1)) * 100}%`,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.06) 80%, transparent 95%)',
                }}
              />
            ))}
          </div>
        )}

        {/* Coffee stain */}
        {doc.coffeeStain && (
          <div
            className="pointer-events-none absolute z-10"
            style={{
              top: '8%',
              right: '10%',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(101,67,33,0.08) 0%, rgba(101,67,33,0.04) 40%, transparent 70%)',
              border: '1px solid rgba(101,67,33,0.1)',
              filter: 'blur(0.5px)',
            }}
          />
        )}

        {/* Burn marks */}
        {doc.burnMarks && (
          <div className="pointer-events-none absolute inset-0 z-10">
            {Array.from({ length: Math.floor(effectiveCorruption * 5) }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${10 + Math.random() * 80}%`,
                  width: `${20 + Math.random() * 40}px`,
                  height: `${20 + Math.random() * 40}px`,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(30,20,10,0.15) 0%, transparent 70%)',
                  filter: 'blur(2px)',
                }}
              />
            ))}
          </div>
        )}

        {/* Edge erosion (corruption) */}
        {effectiveCorruption > 0.2 && (
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1)',
              maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cfilter id='rough'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${0.01 + effectiveCorruption * 0.02}' numOctaves='3' result='noise'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='noise' scale='${effectiveCorruption * 8}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='black' filter='url(%23rough)'/%3E%3C/svg%3E")`,
              WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cfilter id='rough'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${0.01 + effectiveCorruption * 0.02}' numOctaves='3' result='noise'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='noise' scale='${effectiveCorruption * 8}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='black' filter='url(%23rough)'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        {/* Chromatic aberration on corruption */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            opacity: effectiveCorruption * 0.3,
            background: 'linear-gradient(90deg, rgba(255,0,0,0.03) 0%, transparent 33%, transparent 66%, rgba(0,0,255,0.03) 100%)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Content */}
        <div
          className="relative z-30 h-full overflow-y-auto"
          style={{
            padding: 'clamp(24px, 5vw, 48px) clamp(28px, 6vw, 56px)',
            fontFamily: typewriterFonts[doc.inkType] || typewriterFonts.typewriter,
            fontSize: 'clamp(11px, 1.2vw, 14px)',
            lineHeight: 1.7,
            color: '#2a2520',
          }}
        >
          {/* Header */}
          <div
            className="mb-6 pb-3"
            style={{ borderBottom: '1px solid rgba(139, 115, 85, 0.3)' }}
          >
            <div
              className="uppercase tracking-widest mb-1"
              style={{ fontSize: '0.65rem', color: '#8b7355', letterSpacing: '0.15em' }}
            >
              {doc.source.replace('_', ' ')} — {doc.type.replace('_', ' ')}
            </div>
            <h1
              className="font-bold mb-1"
              style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#1a1510', lineHeight: 1.3 }}
            >
              {doc.title}
            </h1>
            <div className="flex flex-wrap gap-3" style={{ fontSize: '0.65rem', color: '#8b7355' }}>
              <span>{doc.date}</span>
              <span>|</span>
              <span style={{ color: effectiveCorruption > 0.5 ? '#8b0000' : '#8b7355' }}>
                {doc.condition.toUpperCase()}
              </span>
              <span>|</span>
              <span>{doc.pages} PAGE{doc.pages > 1 ? 'S' : ''}</span>
              {doc.author && (
                <>
                  <span>|</span>
                  <span>{doc.author}</span>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div
            className="space-y-4"
            style={{ textAlign: 'justify', hyphens: 'auto' }}
          >
            {content.split('\n\n').map((paragraph, i) => (
              <p
                key={i}
                className="first-letter:text-lg first-letter:font-bold"
                style={{ textIndent: '1.5em' }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Corruption flicker effect */}
          {effectiveCorruption > 0.5 && (
            <div
              className="pointer-events-none absolute inset-0 z-40 animate-pulse"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(139,0,0,0.02) 50%, transparent 100%)',
                backgroundSize: '100% 200%',
                animation: 'corruptionFlicker 4s ease-in-out infinite',
              }}
            />
          )}

          {/* Footer */}
          <div
            className="mt-8 pt-3 flex justify-between items-end"
            style={{ borderTop: '1px solid rgba(139, 115, 85, 0.2)', fontSize: '0.6rem', color: '#8b7355' }}
          >
            <div>
              <div>RECOVERED: {doc.recoveredAt.split('T')[0]}</div>
              <div>VERIFICATION: {doc.verificationStatus.toUpperCase()}</div>
            </div>
            <div style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              ARCHIVE ID: {doc.id}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {doc.corruptedContent && (
            <button
              onClick={() => setShowCorrupted(!showCorrupted)}
              className="px-3 py-1.5 text-xs border transition-all hover:scale-105"
              style={{
                borderColor: showCorrupted ? '#8b0000' : 'rgba(139, 115, 85, 0.4)',
                color: showCorrupted ? '#8b0000' : '#8b7355',
                backgroundColor: showCorrupted ? 'rgba(139, 0, 0, 0.05)' : 'rgba(245, 240, 232, 0.8)',
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                backdropFilter: 'blur(4px)',
              }}
            >
              {showCorrupted ? 'SHOW OFFICIAL' : 'SHOW CORRUPTED'}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border transition-all hover:scale-110"
            style={{
              borderColor: 'rgba(139, 115, 85, 0.4)',
              color: '#8b7355',
              backgroundColor: 'rgba(245, 240, 232, 0.8)',
              fontSize: '18px',
              backdropFilter: 'blur(4px)',
            }}
          >
            ×
          </button>
        </div>
      </motion.div>

      {/* Global corruption flicker keyframes */}
      <style jsx global>{`
        @keyframes corruptionFlicker {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
          75% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};