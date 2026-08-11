"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArtifactStore } from '@/state/artifactStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing, microform } from '@/styles/theme';
import { 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Lightbulb, 
  Sparkles, 
  Cylinder,
  Ruler, 
  Scale, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  X,
  AlertTriangle
} from 'lucide-react';

export const ArtifactViewer: React.FC = () => {
  const {
    activeArtifact,
    rotation,
    zoom,
    lampMode,
    activeMarking,
    closeArtifact,
    rotate,
    setZoom,
    adjustZoom,
    setLampMode,
    inspectMarking,
  } = useArtifactStore();
  
  const am = activeMarking as any;
  
  const { click, play } = useAudioStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!activeArtifact) return;
      e.preventDefault();
      adjustZoom(e.deltaY > 0 ? -0.12 : 0.12);
    };
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [activeArtifact, adjustZoom]);

  if (!activeArtifact) return null;

  // Determine lamp indicator styling
  const getLampLabel = () => {
    switch (lampMode) {
      case 'uv':
        return 'ULTRAVIOLET CO-AXIAL FLUX';
      case 'magnify':
        return 'MICROSCOPIC FOCUSING LENS';
      case 'measure':
        return 'GEODETIC CALIPER SPEC';
      default:
        return 'STANDARD RADIAL ILLUMINATION';
    }
  };

  const getLampColor = () => {
    switch (lampMode) {
      case 'uv':
        return '#818cf8'; // Neon purple/blue glow
      case 'magnify':
        return '#fef08a'; // Focused warm light
      case 'measure':
        return '#34d399'; // Green laser lines
      default:
        return '#ffaa55'; // Standard Halogen
    }
  };

  // Helper to determine if a marking's physical alignment is currently locked
  const getMarkingLockStatus = (m: any) => {
    const rot = rotation % 360;
    const normRot = rot < 0 ? rot + 360 : rot;
    
    if (m.id === 'mark-coils') {
      const rotOk = normRot >= 165 && normRot <= 195;
      const zoomOk = zoom >= 1.5;
      return { ok: rotOk && zoomOk, targetRot: 180, targetZoom: 1.5 };
    }
    if (m.id === 'mark-fractures') {
      const rotOk = normRot >= 75 && normRot <= 105;
      const zoomOk = zoom >= 1.8;
      return { ok: rotOk && zoomOk, targetRot: 90, targetZoom: 1.8 };
    }
    if (m.id === 'mark-hands') {
      const rotOk = normRot >= 255 && normRot <= 285;
      const zoomOk = zoom >= 2.0;
      return { ok: rotOk && zoomOk, targetRot: 270, targetZoom: 2.0 };
    }
    if (m.id === 'mark-fibers') {
      const rotOk = normRot >= 345 || normRot <= 15;
      const zoomOk = zoom >= 1.8;
      return { ok: rotOk && zoomOk, targetRot: 0, targetZoom: 1.8 };
    }
    if (m.id === 'mark-weights') {
      const rotOk = normRot >= 105 && normRot <= 135;
      const zoomOk = zoom >= 2.0;
      return { ok: rotOk && zoomOk, targetRot: 120, targetZoom: 2.0 };
    }
    return { ok: true, targetRot: 0, targetZoom: 1.0 };
  };

  // Render our gorgeous procedurally animated vector-SVGs of actual artifacts!
  const renderArtifactGraphic = () => {
    const scaleFactor = zoom;
    const rotateAngle = rotation;

    return (
      <div 
        className="relative w-72 h-72 flex items-center justify-center border border-stone-900 bg-[#070503]"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.95)',
        }}
      >
        {/* Dynamic Halogen/UV Lens beam overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            background: lampMode === 'uv' 
              ? 'radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 100%)'
              : lampMode === 'magnify'
              ? 'radial-gradient(circle at center, rgba(254, 240, 138, 0.05) 0%, transparent 70%)'
              : 'none'
          }}
        />

        <motion.div
          animate={{ rotate: rotateAngle }}
          transition={{ type: "spring", stiffness: 85, damping: 14 }}
          style={{ scale: scaleFactor }}
          className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {activeArtifact.id === 'art-solenoid' && (
            // 🌀 1. Fused Solenoid Core (M-11A) High-Fidelity Realistic Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              <defs>
                <linearGradient id="brass-bracket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2e2417" />
                  <stop offset="35%" stopColor="#4f3f26" />
                  <stop offset="50%" stopColor="#a3804e" />
                  <stop offset="65%" stopColor="#4f3f26" />
                  <stop offset="100%" stopColor="#1e160a" />
                </linearGradient>
                <linearGradient id="brass-cap-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e160a" />
                  <stop offset="50%" stopColor="#a3804e" />
                  <stop offset="100%" stopColor="#1e160a" />
                </linearGradient>
                <linearGradient id="copper-winding-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#421a0c" />
                  <stop offset="25%" stopColor="#873516" />
                  <stop offset="50%" stopColor="#d95d32" />
                  <stop offset="75%" stopColor="#873516" />
                  <stop offset="100%" stopColor="#2d0e04" />
                </linearGradient>
                <radialGradient id="burn-center-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#050302" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#1b120c" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#3d2a1c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Brass Base Bracket frame with metallic sheen */}
              <rect x="23" y="13" width="54" height="74" rx="4" fill="url(#brass-bracket-grad)" stroke="#1a140b" strokeWidth="1.8" />
              <rect x="28" y="18" width="44" height="64" rx="2" fill="#0f0b07" stroke="#2c1e13" strokeWidth="1.2" />

              {/* Core steel cylinders */}
              <rect x="36" y="20" width="6" height="60" fill="url(#brass-cap-grad)" stroke="#111" />
              <rect x="58" y="20" width="6" height="60" fill="url(#brass-cap-grad)" stroke="#111" />

              {/* Copper spool core - multi-layered coils */}
              <g opacity={lampMode === 'magnify' ? 0.98 : 0.88}>
                {/* Spool backing body */}
                <rect x="33" y="24" width="34" height="52" rx="1.5" fill="#2d130a" stroke="#120603" strokeWidth="1" />
                
                {/* Individual Copper Coils - Draw 18 thin loops with individual lighting */}
                {Array.from({ length: 18 }).map((_, i) => {
                  const yPos = 26 + i * 2.7;
                  return (
                    <g key={`wire-${i}`}>
                      <rect 
                        x="34" 
                        y={yPos} 
                        width="32" 
                        height="2.3" 
                        rx="0.4"
                        fill="url(#copper-winding-grad)" 
                        stroke="#1a0a04" 
                        strokeWidth="0.3" 
                      />
                      {/* High-voltage electrical scorching overlay on individual wires */}
                      {i >= 7 && i <= 12 && (
                        <rect x="34" y={yPos} width="32" height="2.3" fill="#120602" opacity="0.45" style={{ mixBlendMode: 'multiply' }} />
                      )}
                    </g>
                  );
                })}

                {/* Major High-Voltage Arc Burn Center Blast */}
                <ellipse cx="50" cy="52" rx="15" ry="11" fill="url(#burn-center-grad)" />
                {/* Fractured/Melted center terminal bridge */}
                <path d="M 40 50 C 43 47, 47 55, 52 49 S 57 53, 60 51" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 40 50 C 43 47, 47 55, 52 49 S 57 53, 60 51" fill="none" stroke="#22d3ee" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" className="animate-pulse" />
              </g>

              {/* Heavy machine terminal screws & solder contacts */}
              <circle cx="50" cy="18" r="4.5" fill="url(#brass-cap-grad)" stroke="#150f09" strokeWidth="1" />
              <line x1="47" y1="18" x2="53" y2="18" stroke="#111" strokeWidth="1.2" />
              
              <circle cx="50" cy="82" r="4.5" fill="url(#brass-cap-grad)" stroke="#150f09" strokeWidth="1" />
              <line x1="47" y1="82" x2="53" y2="82" stroke="#111" strokeWidth="1.2" />

              {/* Caliper Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-80 font-mono animate-pulse" style={{ fontSize: '4.5px' }}>
                  <line x1="16" y1="13" x2="16" y2="87" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="13" y1="13" x2="19" y2="13" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="13" y1="87" x2="19" y2="87" stroke="#34d399" strokeWidth="0.6" />
                  <text x="11" y="50" textAnchor="middle" transform="rotate(-90 11 50)" fill="#34d399" fontWeight="bold">4.0 cm</text>
                  
                  <line x1="23" y1="92" x2="77" y2="92" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="23" y1="89" x2="23" y2="95" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="77" y1="89" x2="77" y2="95" stroke="#34d399" strokeWidth="0.6" />
                  <text x="50" y="97" textAnchor="middle" fill="#34d399" fontWeight="bold">2.0 cm</text>
                </g>
              )}

              {/* Glowing Coordinates under UV Mode */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  <rect x="31" y="36" width="38" height="28" fill="none" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="1, 2" opacity="0.65" />
                  <text x="50" y="44" fill="#818cf8" style={{ fontFamily: typography.mono, fontSize: '3.6px', fontWeight: 'bold', textShadow: '0 0 3px #6366f1' }} textAnchor="middle">38.000° N</text>
                  <text x="50" y="50" fill="#818cf8" style={{ fontFamily: typography.mono, fontSize: '3.6px', fontWeight: 'bold', textShadow: '0 0 3px #6366f1' }} textAnchor="middle">97.000° W</text>
                  <text x="50" y="56" fill="#c084fc" style={{ fontFamily: typography.mono, fontSize: '2.5px', fontWeight: 'bold' }} textAnchor="middle">SOLSTICE CENTROID</text>
                  <circle cx="50" cy="50" r="1" fill="#f43f5e" />
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-core' && (
            // 🪨 2. Kola Core Segment (Borehole-12) Ultra-Realistic Granular Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              <defs>
                <filter id="granite-noise" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" result="noise" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.15  0 0 0 0 0.15  0.85 0 0 0 0" in="noise" result="coloredNoise" />
                  <feComposite operator="in" in2="SourceGraphic" result="composite" />
                  <feBlend mode="multiply" in="SourceGraphic" in2="composite" />
                </filter>
                <linearGradient id="granite-shading" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#181614" />
                  <stop offset="30%" stopColor="#3d3730" />
                  <stop offset="65%" stopColor="#544c43" />
                  <stop offset="85%" stopColor="#3d3730" />
                  <stop offset="100%" stopColor="#151311" />
                </linearGradient>
              </defs>

              {/* Cylindrical Granite core segment with granular noise filter */}
              <g filter="url(#granite-noise)">
                <path d="M 33 16 C 33 11, 67 10, 67 16 L 67 84 C 67 89, 33 89, 33 84 Z" fill="url(#granite-shading)" stroke="#221e1b" strokeWidth="1.8" />
                <ellipse cx="50" cy="16" rx="17" ry="5.5" fill="#4d443c" stroke="#221e1b" strokeWidth="0.8" />
              </g>

              {/* Jagged, deep stress fracture splits with offset specular highlights */}
              <g stroke="#090807" strokeLinecap="round" fill="none">
                <path d="M 50 16 L 48 30 L 53 44 L 51 52" strokeWidth="1.5" />
                <path d="M 48 16 L 44 26 L 41 33" strokeWidth="1" opacity="0.75" />
                <path d="M 41 58 L 45 68 L 42 78 L 43 85" strokeWidth="1.5" />
                <path d="M 60 40 L 56 48 L 59 62" strokeWidth="1.1" opacity="0.85" />
              </g>
              {/* SPECULAR HIGHLIGHTS ON CRACKS FOR 3D DEPTH */}
              <g stroke="rgba(255,255,255,0.08)" strokeLinecap="round" fill="none" transform="translate(0.5, 0.5)">
                <path d="M 50 16 L 48 30 L 53 44 L 51 52" strokeWidth="0.5" />
                <path d="M 41 58 L 45 68 L 42 78 L 43 85" strokeWidth="0.5" />
              </g>

              {/* Quartz crystalline sparkles (four-point glowing stars) */}
              <g fill="#fff" opacity="0.7" className="animate-pulse">
                {/* Star 1 */}
                <path d="M 42 28 Q 42 30 44 30 Q 42 30 42 32 Q 42 30 40 30 Q 42 30 42 28 Z" fill="#edd0a4" />
                {/* Star 2 */}
                <path d="M 58 42 Q 58 44 60 44 Q 58 44 58 46 Q 58 44 56 44 Q 58 44 58 42 Z" fill="#dfd0ca" />
                {/* Star 3 */}
                <path d="M 38 68 Q 38 70 40 70 Q 38 70 38 72 Q 38 70 36 70 Q 38 70 38 68 Z" fill="#edd0a4" />
                {/* Star 4 */}
                <path d="M 54 75 Q 54 77 56 77 Q 54 77 54 79 Q 54 77 52 77 Q 54 77 54 75 Z" fill="#dfd0ca" />
              </g>

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-80 font-mono animate-pulse" style={{ fontSize: '4.5px' }}>
                  <line x1="23" y1="16" x2="23" y2="84" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="20" y1="16" x2="26" y2="16" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="20" y1="84" x2="26" y2="84" stroke="#34d399" strokeWidth="0.6" />
                  <text x="18" y="50" textAnchor="middle" transform="rotate(-90 18 50)" fill="#34d399" fontWeight="bold">12.0 cm</text>
                  
                  <line x1="33" y1="91" x2="67" y2="91" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="33" y1="88" x2="33" y2="94" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="67" y1="88" x2="67" y2="94" stroke="#34d399" strokeWidth="0.6" />
                  <text x="50" y="96" textAnchor="middle" fill="#34d399" fontWeight="bold">3.0 cm</text>
                </g>
              )}

              {/* UV Mode glowing seismic resonance sine wave */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Glowing, neon cyan seismic resonance loops directly along the granite axis */}
                  <path 
                    d={Array.from({ length: 44 }).map((_, i) => {
                      const y = 18 + i * 1.5;
                      const x = 50 + Math.sin(y * 0.45) * 7.5;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none" 
                    stroke="#22d3ee" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 3px #06b6d4)' }}
                  />
                  <text x="50" y="52" fill="#22d3ee" style={{ fontFamily: typography.mono, fontSize: '4.6px', fontWeight: 'bold', textShadow: '0 0 4px #06b6d4' }} textAnchor="middle">4.5 Hz</text>
                  <text x="50" y="57" fill="#0891b2" style={{ fontFamily: typography.mono, fontSize: '2.5px', fontWeight: 'bold' }} textAnchor="middle">KOLA ANOMALY // 12,262 M</text>
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-watch' && (
            // 🕰️ 3. Melted Silver Pocketwatch Detailed 3D Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              <defs>
                <linearGradient id="silver-case-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4b5563" />
                  <stop offset="30%" stopColor="#9ca3af" />
                  <stop offset="50%" stopColor="#f3f4f6" />
                  <stop offset="70%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#374151" />
                </linearGradient>
                <radialGradient id="scorched-glass" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                  <stop offset="45%" stopColor="rgba(245,158,11,0.05)" stopOpacity="0.1" />
                  <stop offset="85%" stopColor="#180f0a" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#050302" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              {/* Outer casing chain bracket */}
              <circle cx="50" cy="11" r="7" fill="none" stroke="url(#silver-case-grad)" strokeWidth="1.8" />
              <rect x="46" y="16" width="8" height="6" fill="#4b5563" stroke="#1f2937" strokeWidth="1.1" />

              {/* Main Watch Casing - Blistered, warped silhouette (non-symmetrical path) */}
              <path 
                d="M 50 19 C 71 19, 83 31, 81 52 C 79 73, 67 85, 48 83 C 29 81, 17 69, 19 48 C 21 27, 29 19, 50 19 Z" 
                fill="url(#silver-case-grad)" 
                stroke="#111827" 
                strokeWidth="2.2" 
                style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.8))' }}
              />

              {/* Bubbled, melted inner bezel dial */}
              <circle cx="50" cy="51" r="27" fill="#0c0a09" stroke="#1f2937" strokeWidth="1.2" />

              {/* Roman indices & ticks - charred soot overlay */}
              <g opacity="0.65" stroke="#111" strokeWidth="0.8" strokeLinecap="round">
                {/* 12-hour dial tick lines */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 50 + Math.cos(angle) * 20;
                  const y1 = 51 + Math.sin(angle) * 20;
                  const x2 = 50 + Math.cos(angle) * 23;
                  const y2 = 51 + Math.sin(angle) * 23;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
                })}
                {/* Warped melted hands locked at 1:23:45 */}
                {/* Hour Hand */}
                <line x1="50" y1="51" x2="59" y2="38" strokeWidth="2.5" stroke="#000" />
                {/* Minute Hand */}
                <line x1="50" y1="51" x2="63" y2="67" strokeWidth="1.8" stroke="#000" />
                {/* Second Hand */}
                <path d="M 50 51 Q 45 54, 39 46 T 27 50" fill="none" strokeWidth="1.0" stroke="#000" />
              </g>

              {/* Clouded, bubbled melted glass dome layer */}
              <path 
                d="M 50 24 C 67 24, 76 34, 76 51 C 76 68, 67 78, 50 78 C 33 78, 24 68, 24 51 C 24 34, 33 24, 50 24 Z" 
                fill="url(#scorched-glass)" 
                style={{ mixBlendMode: 'screen' }} 
              />
              <circle cx="39" cy="42" r="4.5" fill="rgba(255,255,255,0.18)" opacity="0.5" filter="blur(0.8px)" />
              <ellipse cx="61" cy="62" rx="6" ry="3" transform="rotate(-30 61 62)" fill="rgba(255,255,255,0.12)" opacity="0.4" />

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-80 font-mono animate-pulse" style={{ fontSize: '4.5px' }}>
                  <line x1="12" y1="51" x2="88" y2="51" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="12" y1="48" x2="12" y2="54" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="88" y1="48" x2="88" y2="54" stroke="#34d399" strokeWidth="0.6" />
                  <text x="50" y="45" textAnchor="middle" fill="#34d399" fontWeight="bold">5.0 cm</text>
                </g>
              )}

              {/* Glowing locked hands under UV mode */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Neon green phosphorus dials and hands glowing in darkness */}
                  <circle cx="50" cy="51" r="25" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="2, 5" opacity="0.75" />
                  {/* Glowing hands locked at exactly 1:23:45 */}
                  <line x1="50" y1="51" x2="59" y2="38" stroke="#4ade80" strokeWidth="2.8" style={{ filter: 'drop-shadow(0 0 3px #22c55e)' }} />
                  <line x1="50" y1="51" x2="63" y2="67" stroke="#4ade80" strokeWidth="2.2" style={{ filter: 'drop-shadow(0 0 3px #22c55e)' }} />
                  <text x="50" y="32" fill="#4ade80" style={{ fontFamily: typography.mono, fontSize: '4.2px', fontWeight: 'bold', textShadow: '0 0 4px #22c55e' }} textAnchor="middle">01:23:45 AM</text>
                  <text x="50" y="74" fill="#10b981" style={{ fontFamily: typography.mono, fontSize: '3px', fontWeight: 'bold' }} textAnchor="middle">REACTOR_4 CRITICAL_LOCK</text>
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-asbestos' && (
            // 🧪 4. Wittenoom Blue Crocidolite Fiber (art-asbestos) High-Performance Real Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              <defs>
                <linearGradient id="metal-cap-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="35%" stopColor="#6b7280" />
                  <stop offset="50%" stopColor="#d1d5db" />
                  <stop offset="75%" stopColor="#4b5563" />
                  <stop offset="100%" stopColor="#1f2937" />
                </linearGradient>
                <linearGradient id="jar-body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                  <stop offset="15%" stopColor="rgba(255,255,255,0.01)" />
                  <stop offset="85%" stopColor="rgba(255,255,255,0.01)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
                </linearGradient>
              </defs>

              {/* Sealed Glass containment jar - thick walls */}
              <rect x="28" y="19" width="44" height="62" rx="5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.8" />
              <rect x="30" y="21" width="40" height="58" rx="4" fill="url(#jar-body-grad)" stroke="#4b5563" strokeWidth="0.8" />
              {/* Metal Screw Cap with threads */}
              <rect x="35" y="13" width="30" height="7" rx="1" fill="url(#metal-cap-grad)" stroke="#111827" strokeWidth="1" />
              <line x1="35" y1="16.5" x2="65" y2="16.5" stroke="#1f2937" strokeWidth="0.8" />

              {/* Dense, organic branches of cobalt-blue crocidolite needle fibers */}
              <g opacity={lampMode === 'magnify' ? 0.98 : 0.8}>
                {/* Microscopic fiber threads - dozens of fine lines radiating from center */}
                {Array.from({ length: 32 }).map((_, i) => {
                  const angle = ((i * 11.25) * Math.PI) / 180;
                  const length = 15 + (i % 3) * 6;
                  const x2 = 50 + Math.cos(angle) * length;
                  const y2 = 56 + Math.sin(angle) * length;
                  return (
                    <line 
                      key={`fiber-${i}`}
                      x1="50" 
                      y1="56" 
                      x2={x2} 
                      y2={y2} 
                      stroke={i % 2 === 0 ? "#3b82f6" : "#1d4ed8"} 
                      strokeWidth={i % 3 === 0 ? "1.2" : "0.6"} 
                      strokeLinecap="round"
                    />
                  );
                })}
                {/* Fibrous blue particulate cloud around base */}
                <ellipse cx="50" cy="56" rx="16" ry="8" fill="#1e40af" opacity="0.4" filter="blur(1.5px)" />
              </g>

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-80 font-mono animate-pulse" style={{ fontSize: '4.5px' }}>
                  <line x1="21" y1="19" x2="21" y2="81" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="18" y1="19" x2="24" y2="19" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="18" y1="81" x2="24" y2="81" stroke="#34d399" strokeWidth="0.6" />
                  <text x="16" y="50" textAnchor="middle" transform="rotate(-90 16 50)" fill="#34d399" fontWeight="bold">6.0 cm</text>
                  
                  <line x1="28" y1="86" x2="72" y2="86" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="28" y1="83" x2="28" y2="89" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="72" y1="83" x2="72" y2="89" stroke="#34d399" strokeWidth="0.6" />
                  <text x="50" y="91" textAnchor="middle" fill="#34d399" fontWeight="bold">3.0 cm</text>
                </g>
              )}

              {/* UV Mode glowing unredacted declassification stamps */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  <rect x="32" y="66" width="36" height="11" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1,1" opacity="0.8" />
                  <text x="50" y="71" fill="#38bdf8" style={{ fontFamily: typography.mono, fontSize: '3.0px', fontWeight: 'bold', textShadow: '0 0 3px #0284c7' }} textAnchor="middle">W-22.14 S, 118.33 E</text>
                  <text x="50" y="75" fill="#0284c7" style={{ fontFamily: typography.mono, fontSize: '2.5px', fontWeight: 'bold' }} textAnchor="middle">DEGAZETTED UNWRITTEN</text>
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-scale' && (
            // ⚖️ 5. Humberstone Brass Organ Weight (art-scale) Professional Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              <defs>
                <linearGradient id="oxidized-brass" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#451a03" />
                  <stop offset="25%" stopColor="#713f12" />
                  <stop offset="50%" stopColor="#ca8a04" />
                  <stop offset="75%" stopColor="#854d0e" />
                  <stop offset="100%" stopColor="#2c1a04" />
                </linearGradient>
                <linearGradient id="verdigris-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#065f46" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Cylindrical Weight block with oxidized metallic gradients */}
              <rect x="29" y="24" width="42" height="52" rx="2" fill="url(#oxidized-brass)" stroke="#451a03" strokeWidth="1.8" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.7))' }} />
              <ellipse cx="50" cy="24" rx="21" ry="6.5" fill="#a16207" stroke="#ca8a04" strokeWidth="0.8" />
              
              {/* Molded top grip handle knob */}
              <path d="M 43 24 C 43 13, 57 13, 57 24 Z" fill="url(#oxidized-brass)" stroke="#451a03" strokeWidth="1.2" />
              <circle cx="50" cy="14" r="5" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.8" />

              {/* Advanced Verdigris Patina Bloits & Pits */}
              <g opacity="0.85">
                {/* Scattered green copper-carbonate corrosion growths */}
                <circle cx="34" cy="38" r="2.2" fill="url(#verdigris-grad)" stroke="#022c22" strokeWidth="0.3" />
                <circle cx="36" cy="39" r="1.2" fill="#047857" />
                <circle cx="64" cy="52" r="2.6" fill="url(#verdigris-grad)" stroke="#022c22" strokeWidth="0.3" />
                <circle cx="62" cy="51" r="1.5" fill="#059669" />
                <circle cx="58" cy="65" r="1.8" fill="url(#verdigris-grad)" />
                <circle cx="38" cy="68" r="1.5" fill="#047857" />
                
                {/* Horizontal weight calibration ring grooves */}
                <line x1="29" y1="44" x2="71" y2="44" stroke="#2c1a04" strokeWidth="1.5" opacity="0.75" />
                <line x1="29" y1="47" x2="71" y2="47" stroke="#2c1a04" strokeWidth="0.8" opacity="0.75" />
              </g>

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-80 font-mono animate-pulse" style={{ fontSize: '4.5px' }}>
                  <line x1="21" y1="24" x2="21" y2="76" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="18" y1="24" x2="24" y2="24" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="18" y1="76" x2="24" y2="76" stroke="#34d399" strokeWidth="0.6" />
                  <text x="16" y="50" textAnchor="middle" transform="rotate(-90 16 50)" fill="#34d399" fontWeight="bold">5.0 cm</text>
                  
                  <line x1="29" y1="81" x2="71" y2="81" stroke="#34d399" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
                  <line x1="29" y1="78" x2="29" y2="84" stroke="#34d399" strokeWidth="0.6" />
                  <line x1="71" y1="78" x2="71" y2="84" stroke="#34d399" strokeWidth="0.6" />
                  <text x="50" y="86" textAnchor="middle" fill="#34d399" fontWeight="bold">4.0 cm</text>
                </g>
              )}

              {/* UV Mode glowing coordinate stamp on base edge */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Glowing green calibration coordinates on lower body */}
                  <rect x="33" y="58" width="34" height="12" fill="none" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="1,1" opacity="0.8" />
                  <text x="50" y="63" fill="#4ade80" style={{ fontFamily: typography.mono, fontSize: '2.8px', fontWeight: 'bold' }} textAnchor="middle">-20.2085 S</text>
                  <text x="50" y="67" fill="#4ade80" style={{ fontFamily: typography.mono, fontSize: '2.8px', fontWeight: 'bold' }} textAnchor="middle">-69.7945 W</text>
                  <text x="50" y="72" fill="#10b981" style={{ fontFamily: typography.mono, fontSize: '2px', fontWeight: 'bold' }} textAnchor="middle">HUMBERSTONE CAL_STAMP</text>
                </g>
              )}
            </svg>
          )}
        </motion.div>
        
        {/* Dynamic active marking anchor bullseye */}
        {activeArtifact.markings.map((m: any) => {
          const isSelected = activeMarking?.id === m.id;
          const isLampOk = !m.requiresUV || lampMode === 'uv';
          const { ok: isAlignmentOk } = getMarkingLockStatus(m);

          // Only show the interactive bullseye if both lamp and physical alignment constraints are met!
          if (!isLampOk || !isAlignmentOk) return null;

          return (
            <div
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                click();
                inspectMarking(isSelected ? null : m);
              }}
              className="absolute w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300"
              style={{
                left: `calc(${m.coordinates.x}% - 8px)`,
                top: `calc(${m.coordinates.y}% - 8px)`,
                border: `1.2px solid ${isSelected ? getLampColor() : 'rgba(255,255,255,0.22)'}`,
                backgroundColor: isSelected ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
                boxShadow: isSelected ? `0 0 8px ${getLampColor()}` : 'none',
              }}
            >
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: isSelected ? getLampColor() : 'rgba(255,255,255,0.45)' }} 
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex flex-col font-mono text-xs select-none"
        style={{
          marginLeft: spacing.rail,
          marginBottom: spacing.statusBar,
          backgroundColor: "rgba(10, 8, 6, 0.96)",
        }}
        onClick={closeArtifact}
      >
        {/* Top Header toolbar */}
        <div 
          className="flex items-center justify-between px-6 h-12 border-b shrink-0" 
          style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <Cylinder size={14} style={{ color: colors.archive.amber }} />
            <div>
              <div className="text-[8.5px] uppercase tracking-widest" style={{ color: colors.archive.gray }}>Anomalous Object Inspection Suite</div>
              <div className="text-sm font-bold text-white tracking-wide">{activeArtifact.name.toUpperCase()}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Lamp Mode Display Badge */}
            <div className="flex items-center gap-2 border px-3 py-1 bg-void" style={{ borderColor: colors.archive.grayDark }}>
              <Lightbulb size={11} style={{ color: getLampColor() }} />
              <span className="text-[9px] font-bold" style={{ color: getLampColor() }}>{getLampLabel()}</span>
            </div>

            <button
              onClick={() => {
                click();
                closeArtifact();
              }}
              className="px-3 py-1.5 border hover:border-stone-700 transition-colors"
              style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray }}
            >
              × CLOSE WARD
            </button>
          </div>
        </div>

        {/* Main Content Splits */}
        <div className="flex-1 flex min-h-0 divide-x" style={{ borderColor: colors.archive.grayDark }} onClick={(e) => e.stopPropagation()}>
          
          {/* LEFT COLUMN: Visual Magnifier Table */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-[#050403] relative">
            
            {/* Grid Coordinates backdrop */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: 'radial-gradient(ellipse at center, transparent 20%, #1c1917 100%), repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 19px, #fff 20px)',
                backgroundSize: '100% 100%, 20px 20px, 20px 20px',
              }}
            />

            {/* Main Interactive render */}
            {renderArtifactGraphic()}

            {/* Rotator and Zoom Controls bar */}
            <div className="flex items-center gap-2.5 z-10">
              <button
                onClick={() => { click(); rotate(-15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Rotate Counter-Clockwise"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => { click(); rotate(15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Rotate Clockwise"
              >
                <RotateCw size={14} />
              </button>
              <div className="w-px h-6 bg-stone-900 mx-1" />
              <button
                onClick={() => { click(); adjustZoom(0.15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => { click(); adjustZoom(-0.15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Diagnostic Controls & Markings Readout */}
          <div className="w-80 flex flex-col p-6 overflow-y-auto gap-4 bg-[#0a0806]">
            
            {/* Spectral Lamp Mode Selectors */}
            <div className="space-y-2 shrink-0">
              <div className="text-[9px] tracking-[0.15em] font-bold text-stone-500 uppercase">Analyzer Lamp Mode</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'standard', label: 'STANDARD', icon: Eye },
                  { id: 'magnify', label: 'MAGNIFY', icon: ZoomIn },
                  { id: 'uv', label: 'UV BLACKLIGHT', icon: Sparkles },
                  { id: 'measure', label: 'MEASURE', icon: Ruler },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = lampMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        play('click');
                        setLampMode(mode.id as any);
                      }}
                      className="p-2.5 border text-left rounded-[1px] flex flex-col gap-1 transition-all active:scale-98"
                      style={{
                        borderColor: isSelected ? getLampColor() : colors.archive.grayDark,
                        backgroundColor: isSelected ? 'rgba(20, 18, 16, 0.4)' : colors.archive.black,
                      }}
                    >
                      <Icon size={12} style={{ color: isSelected ? getLampColor() : colors.archive.gray }} />
                      <span className="text-[8.5px] font-bold" style={{ color: isSelected ? colors.archive.white : colors.archive.grayLight }}>
                        {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Artifact Dossier Spec sheet */}
            <div className="space-y-2 border-t pt-4 border-stone-900 shrink-0 text-left">
              <div className="text-[9px] tracking-[0.15em] font-bold text-stone-500 uppercase flex items-center gap-1.5">
                <Info size={11} style={{ color: colors.archive.amber }} />
                <span>Object Specifications</span>
              </div>
              <div className="p-3 border space-y-1.5 text-[9.5px] leading-relaxed text-stone-400 bg-void rounded-[1px]" style={{ borderColor: colors.archive.grayDark }}>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">CONDITION</span>
                  <span className="font-bold text-white uppercase">{activeArtifact.condition}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">STRUCTURE</span>
                  <span className="font-bold text-white uppercase">{activeArtifact.material}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">TOTAL MASS</span>
                  <span className="font-bold text-white">{activeArtifact.weight}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">DIMENSIONS</span>
                  <span className="font-bold text-white">{activeArtifact.dimensions}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">RECOVERY DATE</span>
                  <span className="font-bold text-white">{activeArtifact.dateRecovered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">SOURCE SITE</span>
                  <span className="font-bold text-white truncate max-w-[130px]" title={activeArtifact.origin}>{activeArtifact.origin}</span>
                </div>
              </div>
            </div>

            {/* Interactive Markings Readout panel */}
            <div className="flex-1 flex flex-col gap-2 border-t pt-4 border-stone-900 text-left">
              <div className="text-[9px] tracking-[0.15em] font-bold text-stone-500 uppercase">Micro-Inscription Analysis</div>
              
              <div 
                className="flex-1 border p-4 bg-void max-h-48 overflow-y-auto flex flex-col justify-center rounded-[1px]"
                style={{ borderColor: colors.archive.grayDark }}
              >
                {activeMarking ? (
                  <motion.div
                    key={activeMarking.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 text-[10.5px] leading-relaxed"
                  >
                    <div className="flex justify-between items-baseline border-b pb-1 border-stone-900">
                      <span className="font-bold text-white uppercase">{am.label}</span>
                      <span className="text-[8px] px-1 bg-[#1a1613] text-[#bf9f62] uppercase rounded-[1px] font-bold">
                        {activeMarking.location}
                      </span>
                    </div>
                    <p style={{ color: colors.archive.grayLight }}>{activeMarking.description}</p>
                    
                    {/* Clue transcription block */}
                    <div className="p-2 border border-amber-900/25 bg-amber-950/5 text-[#bf9f62] rounded-[1px] font-mono text-[9px] leading-normal border-t mt-2">
                      <div className="font-bold text-[7.5px] uppercase opacity-65 mb-1">Decoded Transcript:</div>
                      {am.clueText}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col justify-start gap-2.5 py-2">
                    {/* List each marking as either locked or resolved */}
                    {activeArtifact.markings.map((m: any) => {
                      const { ok: isAligned, targetRot, targetZoom } = getMarkingLockStatus(m);
                      const isLampOk = !m.requiresUV || lampMode === 'uv';

                      if (isAligned && isLampOk) {
                        return (
                          <div key={`hint-${m.id}`} className="p-2 border border-green-900/30 bg-green-950/5 text-green-500 rounded-[1px] text-[10px]">
                            <div className="font-bold uppercase mb-0.5">● MARKING ALIGNED</div>
                            <div>Click the glowing indicator on the artifact to decode.</div>
                          </div>
                        );
                      }

                      return (
                        <div key={`hint-${m.id}`} className="p-2.5 border border-red-950/40 bg-red-950/5 text-stone-400 rounded-[1px] text-[10px] space-y-1">
                          <div className="font-bold text-red-500 uppercase flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>ANOMALY DETECTED but UNRESOLVED</span>
                          </div>
                          <p className="text-stone-500 text-[9px] leading-normal">
                            Object scanning matrices indicate a micro-marking is buried here. You must calibrate alignment parameters to resolve:
                          </p>
                          <div className="font-mono text-[8.5px] text-amber-600/70 pl-2 space-y-0.5 border-l border-amber-900/30">
                            <div>• ROTATION TARGET: {targetRot}° (Current: {Math.round(rotation % 360)}°)</div>
                            <div>• RESOLUTION: {targetZoom}x (Current: {zoom.toFixed(2)}x)</div>
                            <div>• LIGHTING: {m.requiresUV ? "UV BLACKLIGHT" : "ANY"} (Current: {lampMode.toUpperCase()})</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArtifactViewer;
