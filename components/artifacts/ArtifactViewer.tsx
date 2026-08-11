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
            // 🌀 1. Fused Solenoid Core (M-11A) Detailed Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              {/* Brass Base Bracket frame */}
              <rect x="25" y="15" width="50" height="70" rx="3" fill="#3a2f1d" stroke="#52432d" strokeWidth="1.5" />
              <rect x="29" y="19" width="42" height="62" rx="1.5" fill="#211a10" stroke="#322a1b" strokeWidth="1" />
              
              {/* Copper spool core posts */}
              <line x1="38" y1="20" x2="38" y2="80" stroke="#120e0a" strokeWidth="4" />
              <line x1="62" y1="20" x2="62" y2="80" stroke="#120e0a" strokeWidth="4" />

              {/* Heavily wrapped copper wire loops block */}
              <g opacity={lampMode === 'magnify' ? 0.95 : 0.85}>
                <rect x="35" y="26" width="30" height="48" rx="1" fill="#78341a" stroke="#4a1a0b" strokeWidth="1" />
                {/* Individual copper coils shine lines */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <line 
                    key={i} 
                    x1="36" 
                    y1={28 + i * 4} 
                    x2="64" 
                    y2={28 + i * 4} 
                    stroke={lampMode === 'magnify' ? '#b45309' : '#854d0e'} 
                    strokeWidth="2.5" 
                  />
                ))}
                {/* Burn marks & melted/fused center spot */}
                <ellipse cx="50" cy="50" rx="12" ry="8" fill="#1c0f0a" opacity="0.82" style={{ mixBlendMode: 'multiply' }} />
                <path d="M 42 48 Q 45 44 48 52 T 58 46" fill="none" stroke="#0a0502" strokeWidth="1.8" />
              </g>

              {/* Screws and terminals */}
              <circle cx="50" cy="20" r="3" fill="#52432d" stroke="#1c160e" strokeWidth="0.8" />
              <line x1="48" y1="20" x2="52" y2="20" stroke="#1c160e" strokeWidth="0.8" />
              <circle cx="50" cy="80" r="3" fill="#52432d" stroke="#1c160e" strokeWidth="0.8" />
              <line x1="48" y1="80" x2="52" y2="80" stroke="#1c160e" strokeWidth="0.8" />

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-75 font-mono" style={{ fontSize: '4.5px' }}>
                  <line x1="20" y1="15" x2="20" y2="85" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="18" y1="15" x2="22" y2="15" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="18" y1="85" x2="22" y2="85" stroke="#34d399" strokeWidth="0.4" />
                  <text x="14" y="52" textAnchor="middle" transform="rotate(-90 14 52)">4.0 cm</text>
                  
                  <line x1="25" y1="90" x2="75" y2="90" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="25" y1="88" x2="25" y2="92" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="75" y1="88" x2="75" y2="92" stroke="#34d399" strokeWidth="0.4" />
                  <text x="50" y="95" textAnchor="middle">2.0 cm</text>
                </g>
              )}

              {/* Glowing Inscriptions under UV Mode */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Glowing vector code directly on the copper wraps */}
                  <rect x="33" y="38" width="34" height="24" fill="none" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="1, 1" />
                  <text x="50" y="47" fill="#818cf8" style={{ fontFamily: typography.mono, fontSize: '3.5px', fontWeight: 'bold' }} textAnchor="middle">38.000° N</text>
                  <text x="50" y="52" fill="#818cf8" style={{ fontFamily: typography.mono, fontSize: '3.5px', fontWeight: 'bold' }} textAnchor="middle">97.000° W</text>
                  <text x="50" y="57" fill="#c084fc" style={{ fontFamily: typography.mono, fontSize: '2.5px' }} textAnchor="middle">SOLSTICE AXIS</text>
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-core' && (
            // 🪨 2. Kola Core Segment (Borehole-12) Detailed Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              {/* Cylindrical Granite core segment */}
              <path d="M 35 15 C 35 10, 65 10, 65 15 L 65 85 C 65 90, 35 90, 35 85 Z" fill="#2d2a26" stroke="#47413c" strokeWidth="1.5" />
              <ellipse cx="50" cy="15" rx="15" ry="5" fill="#3d3731" stroke="#47413c" strokeWidth="0.8" />

              {/* Granite textures and quartz sparkling points */}
              <path d="M 37 25 Q 42 22 47 28 T 57 23 T 63 32" fill="none" stroke="#1d1b18" strokeWidth="0.8" opacity="0.6" />
              <path d="M 36 50 Q 45 46 52 54 T 61 48 T 64 58" fill="none" stroke="#1d1b18" strokeWidth="0.8" opacity="0.6" />
              <path d="M 38 75 Q 43 78 48 72 T 58 76 T 62 70" fill="none" stroke="#1d1b18" strokeWidth="0.8" opacity="0.6" />
              
              {/* Quartz crystalline sparkles (small circles) */}
              <circle cx="43" cy="35" r="1.5" fill="#854d0e" opacity="0.4" />
              <circle cx="58" cy="42" r="1.2" fill="#52525b" opacity="0.6" />
              <circle cx="47" cy="65" r="1.8" fill="#a1a1aa" opacity="0.4" />
              <circle cx="52" cy="78" r="1" fill="#854d0e" opacity="0.5" />

              {/* Stress fracture splits */}
              <path d="M 50 15 L 50 35 L 53 45" fill="none" stroke="#0f0e0c" strokeWidth="1.2" />
              <path d="M 42 55 L 44 68 L 41 85" fill="none" stroke="#0f0e0c" strokeWidth="1.2" />

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-75 font-mono" style={{ fontSize: '4.5px' }}>
                  <line x1="25" y1="15" x2="25" y2="85" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="23" y1="15" x2="27" y2="15" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="23" y1="85" x2="27" y2="85" stroke="#34d399" strokeWidth="0.4" />
                  <text x="19" y="52" textAnchor="middle" transform="rotate(-90 19 52)">12.0 cm</text>
                  
                  <line x1="35" y1="92" x2="65" y2="92" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="35" y1="90" x2="35" y2="94" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="65" y1="90" x2="65" y2="94" stroke="#34d399" strokeWidth="0.4" />
                  <text x="50" y="97" textAnchor="middle">3.0 cm</text>
                </g>
              )}

              {/* UV Mode glowing seismic resonance sine wave */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Perfect sinusoidal wave etched along the granite core */}
                  <path 
                    d={Array.from({ length: 40 }).map((_, i) => {
                      const y = 20 + i * 1.6;
                      const x = 50 + Math.sin(y * 0.4) * 8;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none" 
                    stroke="#22d3ee" 
                    strokeWidth="1.2" 
                    opacity="0.85" 
                  />
                  <text x="50" y="52" fill="#22d3ee" style={{ fontFamily: typography.mono, fontSize: '4.5px', fontWeight: 'bold', textShadow: '0 0 3px #06b6d4' }} textAnchor="middle">4.5 Hz</text>
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-watch' && (
            // 🕰️ 3. Melted Silver Pocketwatch Detailed Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              {/* Outer casing chain bracket */}
              <circle cx="50" cy="12" r="6" fill="none" stroke="#52525b" strokeWidth="1.5" />
              <rect x="47" y="16" width="6" height="6" fill="#3f3f46" stroke="#27272a" strokeWidth="1" />

              {/* Main Circular watch body casing */}
              <circle cx="50" cy="52" r="32" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <circle cx="50" cy="52" r="28" fill="#111113" stroke="#27272a" strokeWidth="1" />
              
              {/* Scorched & warped silver casing outline */}
              <path d="M 22 40 Q 15 52 24 64 T 48 82 T 78 68 T 76 44 T 54 22 Z" fill="#27272a" opacity="0.3" stroke="#52525b" strokeWidth="1.2" />

              {/* Clouded, bubbled melted glass face */}
              <ellipse cx="50" cy="52" rx="25" ry="25" fill="#27272a" opacity="0.25" />
              <circle cx="42" cy="46" r="3" fill="#3f3f46" opacity="0.4" />
              <circle cx="56" cy="58" r="4.5" fill="#3f3f46" opacity="0.3" />

              {/* Charred hands and watch dial lines */}
              <g opacity="0.6" stroke="#09090b" strokeLinecap="round">
                {/* 12-hour dial tick lines */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 50 + Math.cos(angle) * 21;
                  const y1 = 52 + Math.sin(angle) * 21;
                  const x2 = 50 + Math.cos(angle) * 24;
                  const y2 = 52 + Math.sin(angle) * 24;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" />;
                })}
                {/* Melted fused hands locked at 1:23:45 */}
                <line x1="50" y1="52" x2="58" y2="40" strokeWidth="2.2" />
                <line x1="50" y1="52" x2="62" y2="68" strokeWidth="1.6" />
                <path d="M 50 52 Q 44 54 38 48 T 29 52" fill="none" strokeWidth="0.8" />
              </g>

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-75 font-mono" style={{ fontSize: '4.5px' }}>
                  <line x1="14" y1="52" x2="86" y2="52" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="14" y1="49" x2="14" y2="55" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="86" y1="49" x2="86" y2="55" stroke="#34d399" strokeWidth="0.4" />
                  <text x="50" y="46" textAnchor="middle">5.0 cm</text>
                </g>
              )}

              {/* Glowing locked hands under UV mode */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Neon green phosphorus dials and hands glowing in darkness */}
                  <circle cx="50" cy="52" r="26" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="2, 6" opacity="0.65" />
                  {/* Glowing hands locked at exactly 1:23:45 */}
                  <line x1="50" y1="52" x2="58" y2="40" stroke="#4ade80" strokeWidth="2.8" />
                  <line x1="50" y1="52" x2="62" y2="68" stroke="#4ade80" strokeWidth="2.2" />
                  <text x="50" y="32" fill="#4ade80" style={{ fontFamily: typography.mono, fontSize: '4px', fontWeight: 'bold' }} textAnchor="middle">01:23:45 AM</text>
                  <text x="50" y="76" fill="#10b981" style={{ fontFamily: typography.mono, fontSize: '3px' }} textAnchor="middle">REACTOR_4 LOCK</text>
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-asbestos' && (
            // 🧪 4. Wittenoom Blue Crocidolite Fiber (art-asbestos) Detailed Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              {/* Sealed Glass containment jar */}
              <rect x="30" y="20" width="40" height="60" rx="4" fill="rgba(255,255,255,0.03)" stroke="#71717a" strokeWidth="1" />
              {/* Metal Screw Cap */}
              <rect x="36" y="14" width="28" height="6" fill="#3f3f46" stroke="#27272a" strokeWidth="0.8" />
              <line x1="36" y1="17" x2="64" y2="17" stroke="#18181b" strokeWidth="0.5" />

              {/* Bundle of blue fibrous mineral spikes */}
              <g opacity={lampMode === 'magnify' ? 0.95 : 0.75}>
                {/* Spikes branching outwards */}
                <path d="M 50 65 L 52 35 L 53 28" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                <path d="M 50 65 L 42 38 L 38 32" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 50 65 L 58 40 L 63 34" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 50 65 L 34 46" fill="none" stroke="#1d4ed8" strokeWidth="1" strokeLinecap="round" />
                <path d="M 50 65 L 66 48" fill="none" stroke="#2563eb" strokeWidth="1" strokeLinecap="round" />
                {/* Fibrous asbestos texture dust clouds around base */}
                <ellipse cx="50" cy="65" rx="14" ry="7" fill="#1e3a8a" opacity="0.3" filter="blur(1px)" />
              </g>

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-75 font-mono" style={{ fontSize: '4.5px' }}>
                  <line x1="22" y1="20" x2="22" y2="80" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="20" y1="20" x2="24" y2="20" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="20" y1="80" x2="24" y2="80" stroke="#34d399" strokeWidth="0.4" />
                  <text x="17" y="50" textAnchor="middle" transform="rotate(-90 17 50)">6.0 cm</text>
                  
                  <line x1="30" y1="86" x2="70" y2="86" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="30" y1="84" x2="30" y2="88" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="70" y1="84" x2="70" y2="88" stroke="#34d399" strokeWidth="0.4" />
                  <text x="50" y="91" textAnchor="middle">3.0 cm</text>
                </g>
              )}

              {/* UV Mode glowing unredacted declassification stamps */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Glowing neon-blue stamps on jar underside base */}
                  <rect x="32" y="68" width="36" height="10" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1,2" opacity="0.75" />
                  <text x="50" y="73" fill="#38bdf8" style={{ fontFamily: typography.mono, fontSize: '3.2px', fontWeight: 'bold' }} textAnchor="middle">W-22.14 S, 118.33 E</text>
                  <text x="50" y="77" fill="#0284c7" style={{ fontFamily: typography.mono, fontSize: '2.5px', fontWeight: 'bold' }} textAnchor="middle">DEGAZETTED STAMP</text>
                </g>
              )}
            </svg>
          )}

          {activeArtifact.id === 'art-scale' && (
            // ⚖️ 5. Humberstone Brass Organ Weight (art-scale) Detailed Vector
            <svg viewBox="0 0 100 100" className="w-56 h-56">
              {/* Cylindrical weight block */}
              <rect x="30" y="25" width="40" height="50" rx="1.5" fill="#854d0e" stroke="#a16207" strokeWidth="1.5" />
              <ellipse cx="50" cy="25" rx="20" ry="6" fill="#a16207" stroke="#ca8a04" strokeWidth="0.8" />
              
              {/* Round top handle knob */}
              <path d="M 44 25 C 44 14, 56 14, 56 25 Z" fill="#854d0e" stroke="#713f12" strokeWidth="1" />
              <circle cx="50" cy="15" r="4.5" fill="#ca8a04" stroke="#a16207" strokeWidth="0.8" />

              {/* Corrosion pits and oxidized green spots (representing desert morgue dampness) */}
              <g opacity="0.8">
                <circle cx="36" cy="38" r="1.5" fill="#065f46" opacity="0.8" /> {/* Malachite green corrosion */}
                <circle cx="38" cy="39" r="1" fill="#047857" opacity="0.7" />
                <circle cx="63" cy="54" r="1.8" fill="#14532d" opacity="0.7" />
                <circle cx="58" cy="62" r="1.2" fill="#065f46" opacity="0.8" />
                {/* Engraving lines around the perimeter */}
                <line x1="30" y1="45" x2="70" y2="45" stroke="#451a03" strokeWidth="1.2" opacity="0.6" />
                <line x1="30" y1="48" x2="70" y2="48" stroke="#451a03" strokeWidth="0.8" opacity="0.6" />
              </g>

              {/* Measure Overlays */}
              {lampMode === 'measure' && (
                <g className="text-[#34d399] opacity-75 font-mono" style={{ fontSize: '4.5px' }}>
                  <line x1="22" y1="25" x2="22" y2="75" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="20" y1="25" x2="24" y2="25" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="20" y1="75" x2="24" y2="75" stroke="#34d399" strokeWidth="0.4" />
                  <text x="17" y="50" textAnchor="middle" transform="rotate(-90 17 50)">5.0 cm</text>
                  
                  <line x1="30" y1="81" x2="70" y2="81" stroke="#34d399" strokeWidth="0.4" strokeDasharray="1,1" />
                  <line x1="30" y1="79" x2="30" y2="83" stroke="#34d399" strokeWidth="0.4" />
                  <line x1="70" y1="79" x2="70" y2="83" stroke="#34d399" strokeWidth="0.4" />
                  <text x="50" y="86" textAnchor="middle">4.0 cm</text>
                </g>
              )}

              {/* UV Mode glowing coordinate stamp on base edge */}
              {lampMode === 'uv' && (
                <g className="animate-pulse">
                  {/* Glowing green calibration coordinates on lower body */}
                  <rect x="33" y="58" width="34" height="12" fill="none" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="1,1" opacity="0.8" />
                  <text x="50" y="63" fill="#4ade80" style={{ fontFamily: typography.mono, fontSize: '2.8px', fontWeight: 'bold' }} textAnchor="middle">-20.2085 S</text>
                  <text x="50" y="67" fill="#4ade80" style={{ fontFamily: typography.mono, fontSize: '2.8px', fontWeight: 'bold' }} textAnchor="middle">-69.7945 W</text>
                  <text x="50" y="72" fill="#10b981" style={{ fontFamily: typography.mono, fontSize: '2px', fontWeight: 'bold' }} textAnchor="middle">HUMBERSTONE</text>
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
