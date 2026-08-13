"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, microform } from '@/styles/theme';
import { Shield, Sparkles, BookOpen, Cpu, Settings, Eye } from 'lucide-react';

interface ResearchEntry {
  title: string;
  date: string;
  body: string;
}

const RESEARCH_LEDGER: ResearchEntry[] = [
  {
    title: 'DUST: RESIDUAL INFORMATIONAL PARTICULATE',
    date: '1983-10-14',
    body: `Dust is not magic. Dust is not corruption. Dust is not radiation. Dust is the physical residue left behind whenever reality rewrites itself.

Imagine reality as countless layers of paper. Every time history changes, one sheet is quietly removed. Tiny fibers remain. Those fibers are Dust.

Nobody notices them. Except investigators.

Observable Properties:
*  Almost invisible under normal light
*  Glows faintly blue under resonance scanners
*  High concentrations distort light, sound, memory, navigation, electronic equipment, film, and human perception
*  Measurable but never fully understood.`
  },
  {
    title: 'THE OTHER: PHENOMENON 0',
    date: 'CLASSIFIED',
    body: `No investigator has ever observed The Other directly. No photograph has ever captured it. No recording has ever preserved it.

Official designation: Phenomenon 0
Alias: The Other

Not because it came first. Because every other anomaly eventually leads back to it.
The Other is not evil. It has no known desires. It does not hunt, punish, or tempt. It is a condition of existence. Not an antagonist.

Its effects are terrifying because they are completely indifferent.

The Erosion of Certainty: Around The Other, certainty begins dissolving. People remember different histories. Photographs disagree. Coordinates drift. Buildings become impossible to verify.

The Silence: Wherever The Other has influenced a location, there is always silence. Not the absence of sound. The absence of expectation.`
  },
  {
    title: 'OBSERVER STABILITY: FIELD GUIDE',
    date: '1991-03-22',
    body: `Dust measures what the investigator can perceive. Observer Stability measures what they can still trust.

High Stability means memories remain reliable. Low Stability introduces doubt — carefully controlled uncertainty.

Managing Dust:
*  Review verified evidence
*  Listen to authenticated recordings
*  Compare documents against preserved originals
*  Organize the Archive
*  Catalogue discoveries
*  Ground yourself often

The game encourages periods of calm between unsettling discoveries. Players are rewarded for being careful archivists, not fearless adventurers.`
  },
  {
    title: 'WHY INVESTIGATORS DISAPPEAR',
    date: '1978-11-03',
    body: `Investigators rarely die. Instead, their accumulated Dust eventually exceeds what ordinary reality can tolerate.

Some disappear. Some continue existing only inside Archive records. Some become impossible to remember.

The tragedy is that many were extraordinary people. The Archive remembers them when no one else can.
Dust does not make investigators insane. It allows them to perceive more reality than the human mind was designed to process.

Experienced investigators often report:
*  Dreams that feel historical rather than personal
*  Recognizing buildings they've never visited
*  Remembering conversations that officially never occurred
*  Feeling nostalgia for places that no longer exist
*  Occasionally mourning people they cannot prove ever lived.`
  }
];

export const ResearchPanel: React.FC = () => {
  const { status } = useUIStore();
  const { click, play } = useAudioStore();
  const [activeTab, setActiveTab] = useState<'ledger' | 'spectrometer' | 'convergence'>('ledger');
  
  // Spectrometer state
  const [frequency, setFrequency] = useState(4.5); // Baseline infrasonic
  const [amplitude, setAmplitude] = useState(25);
  const [lockAligned, setLockAligned] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const dust = status.dustIndex;
  const stability = status.observerStability;

  const dustLevel = dust >= DUST_THRESHOLDS.EXTREME ? 'EXTREME' : dust >= DUST_THRESHOLDS.HIGH ? 'HIGH' : dust >= DUST_THRESHOLDS.MODERATE ? 'MODERATE' : dust >= DUST_THRESHOLDS.LOW ? 'LOW' : 'NOMINAL';
  const stabilityLevel = stability >= STABILITY_THRESHOLDS.NOMINAL ? 'NOMINAL' : stability >= STABILITY_THRESHOLDS.STABLE ? 'STABLE' : stability >= STABILITY_THRESHOLDS.DEGRADED ? 'DEGRADED' : stability >= STABILITY_THRESHOLDS.CRITICAL ? 'CRITICAL' : 'UNSTABLE';

  // 1. Interactive Spectrometer Canvas Animation Loop
  const stateRef = useRef({ frequency, amplitude, dust });
  useEffect(() => {
    stateRef.current = { frequency, amplitude, dust };
  }, [frequency, amplitude, dust]);

  useEffect(() => {
    if (activeTab !== 'spectrometer') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number; y: number; speed: number; size: number; phase: number }[] = [];
    const pCount = 50 + stateRef.current.dust * 2; // Particle density based on initial Dust

    for (let i = 0; i < pCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.25 + Math.random() * 0.8,
        size: 0.5 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let cycle = 0;
    const render = () => {
      const current = stateRef.current;
      const freq = current.frequency;
      const amp = current.amplitude;

      // Check lock-on requirements in real-time inside the render loop!
      const isTuned = Math.abs(freq - 4.5) < 0.2;
      const isAmpOk = amp >= 40 && amp <= 70;
      const locked = isTuned && isAmpOk;
      setLockAligned(locked);

      cycle += 0.05 * (freq / 4.5);
      
      ctx.fillStyle = 'rgba(7, 5, 3, 0.15)'; // Decay tail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render static grids
      ctx.strokeStyle = 'rgba(201, 169, 110, 0.03)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw central scanning laser beam
      const laserY = canvas.height / 2 + Math.sin(cycle) * (canvas.height / 4) * (amp / 40);
      ctx.strokeStyle = locked ? 'rgba(99, 102, 241, 0.22)' : 'rgba(201, 169, 110, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, laserY);
      ctx.lineTo(canvas.width, laserY);
      ctx.stroke();

      // Render active dust particles
      particles.forEach((p) => {
        p.y -= p.speed * (freq / 3.0);
        p.x += Math.sin(cycle + p.phase) * 0.15;

        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        // Particles glow neon-blue under UV/locked-on conditions, else warm sepia
        ctx.fillStyle = locked 
          ? 'rgba(129, 140, 248, 0.65)' 
          : 'rgba(201, 169, 110, 0.25)';

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Under high radiation overlap, highlight aligned particles
        if (locked && Math.abs(p.y - laserY) < 12) {
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Target central scan ring
      if (locked) {
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 40 + Math.sin(cycle) * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeTab]);

  const handleTabChange = (tab: any) => {
    click();
    if (tab === 'spectrometer' && dust < 25) {
      if (typeof play === 'function') play('error');
      return;
    }
    if (tab === 'convergence' && dust < 65) {
      if (typeof play === 'function') play('error');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="h-full flex flex-col p-4 select-none font-mono text-xs text-stone-400">
      
      {/* Dynamic Submodule Tabs */}
      <div className="shrink-0 flex border-b mb-4" style={{ borderColor: colors.archive.grayDark }}>
        {[
          { id: 'ledger', label: 'CLASSIFIED RESEARCH', icon: BookOpen },
          { id: 'spectrometer', label: 'DUST SPECTROMETER', icon: Sparkles },
          { id: 'convergence', label: 'SOLSTICE GRID', icon: Cpu }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className="px-4 py-2.5 transition-colors flex items-center gap-1.5 border-b-2"
              style={{
                color: isSelected ? colors.archive.amber : colors.archive.gray,
                borderColor: isSelected ? colors.archive.amber : 'transparent',
              }}
            >
              <Icon size={11} />
              <span className="tracking-wider uppercase">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden">
        
        {/* PANEL 1: CLASSIFIED RESEARCH LEDGER */}
        {activeTab === 'ledger' && (
          <div className="h-full flex flex-col gap-4 overflow-y-auto pr-1">
            {RESEARCH_LEDGER.map((entry, idx) => (
              <div 
                key={idx} 
                className="p-4 border rounded-[1px] bg-stone-950/40"
                style={{ borderColor: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex justify-between items-baseline border-b pb-1.5 mb-2.5 border-stone-900">
                  <h3 className="font-bold text-white tracking-wide text-[10.5px]">{entry.title}</h3>
                  <span className="text-[8.5px] font-bold" style={{ color: colors.archive.gray }}>{entry.date}</span>
                </div>
                <p 
                  className="text-[11.5px] leading-relaxed font-serif whitespace-pre-wrap"
                  style={{ color: colors.archive.grayLight, fontFamily: typography.serif }}
                >
                  {entry.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* PANEL 2: INTERACTIVE DUST SPECTROMETER */}
        {activeTab === 'spectrometer' && (
          <div className="h-full flex flex-col gap-4">
            
            {/* Visual Particle Spectrograph Canvas */}
            <div className="relative flex-1 border border-stone-900 rounded-[2px] bg-[#070503] overflow-hidden min-h-[160px]">
              <canvas 
                ref={canvasRef} 
                width={320} 
                height={200} 
                className="w-full h-full block" 
              />
              {/* Overlay CRT scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-repeat" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 3px)', backgroundSize: '100% 3px' }} />
              
              {/* Scan target details overlay */}
              <div className="absolute top-3 left-3 bg-black/80 border p-2 text-[8px] leading-relaxed font-mono" style={{ borderColor: colors.archive.grayDark }}>
                <div className="flex justify-between gap-4">
                  <span className="text-stone-600">DUST DENSITY</span>
                  <span style={{ color: colors.archive.amber }}>{50 + dust * 2} PPM</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone-600">ION HARMONIC</span>
                  <span style={{ color: colors.archive.amber }}>{(frequency * 1.34).toFixed(2)} MHz</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone-600">SYSTEM STATE</span>
                  <span className="font-bold" style={{ color: lockAligned ? colors.archive.blueBright : colors.archive.red }}>
                    {lockAligned ? 'COAXIAL LOCK ACQUIRED' : 'GRID MISALIGNED'}
                  </span>
                </div>
              </div>

              {/* Glowing declassified message inside canvas on successful lock */}
              {lockAligned && (
                <div className="absolute bottom-4 left-4 right-4 bg-indigo-950/90 border border-indigo-500/30 p-2.5 rounded-[1px] text-[10px] leading-relaxed animate-fade-in text-indigo-200 shadow-md">
                  <div className="font-bold text-indigo-400 uppercase mb-0.5 flex items-center gap-1">
                    <Shield size={10} />
                    <span>Declassified Intercept M-11Δ Unlocked</span>
                  </div>
                  <p className="opacity-80">
                    "The dust accumulating inside Carrel #7-B carries a geodetic spatial drift. 4.5 Hz frequency represents the synchronized respiration rate of the three military bunkers."
                  </p>
                </div>
              )}
            </div>

            {/* Spectrometer tuning sliders */}
            <div className="p-3 border space-y-3 bg-stone-950/20" style={{ borderColor: colors.archive.grayDark }}>
              
              {/* 1. Frequency slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-[9px]">
                  <span className="text-stone-500">TUNE FREQUENCY</span>
                  <span className="font-bold" style={{ color: Math.abs(frequency - 4.5) < 0.2 ? colors.archive.green : colors.archive.amber }}>
                    {frequency.toFixed(1)} Hz (Target: 4.5 Hz)
                  </span>
                </div>
                <input 
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={frequency}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFrequency(val);
                    if (Math.random() > 0.8) play('tape');
                  }}
                  className="w-full accent-amber-500 h-1 bg-stone-900 rounded-lg cursor-pointer"
                />
              </div>

              {/* 2. Laser Amplitude slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-[9px]">
                  <span className="text-stone-500">LASER AMP SPECTRAL</span>
                  <span className="font-bold" style={{ color: amplitude >= 40 && amplitude <= 70 ? colors.archive.green : colors.archive.amber }}>
                    {amplitude}% (Target: 40% - 70%)
                  </span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={amplitude}
                  onChange={(e) => {
                    setAmplitude(parseInt(e.target.value));
                    if (Math.random() > 0.8) play('crt');
                  }}
                  className="w-full accent-amber-500 h-1 bg-stone-900 rounded-lg cursor-pointer"
                />
              </div>

            </div>

          </div>
        )}

        {/* PANEL 3: SOLSTICE CONVERGENCE RADAR GRID */}
        {activeTab === 'convergence' && (
          <div className="h-full flex flex-col gap-4">
            
            {/* animated SVG Triangulation map */}
            <div className="relative flex-1 border border-stone-900 rounded-[2px] bg-[#070503] flex items-center justify-center min-h-[160px]">
              
              <svg viewBox="0 0 100 100" className="w-48 h-48">
                {/* Outer radial scope grid */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(201,169,110,0.06)" strokeWidth="1" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(201,169,110,0.04)" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(201,169,110,0.04)" strokeWidth="0.8" />
                
                {/* Horizontal & Vertical Axis lines */}
                <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(201,169,110,0.05)" strokeWidth="0.6" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(201,169,110,0.05)" strokeWidth="0.6" />

                {/* 3 Pillars of Triangulation nodes */}
                {/* Node 1: Mount Weather (VA) [Coordinates: -77.89, 39.06] mapped to top right */}
                <circle cx="78" cy="28" r="2.5" fill={colors.archive.amber} stroke="#1a1510" strokeWidth="0.8" />
                <text x="83" y="26" fill="rgba(201,169,110,0.5)" style={{ fontSize: '3px' }}>MT_WEATHER</text>

                {/* Node 2: Cheyenne Mountain (CO) [-104.84, 38.74] mapped to left */}
                <circle cx="22" cy="48" r="2.5" fill={colors.archive.amber} stroke="#1a1510" strokeWidth="0.8" />
                <text x="14" y="44" fill="rgba(201,169,110,0.5)" style={{ fontSize: '3px' }}>CHEYENNE_MT</text>

                {/* Node 3: Raven Rock (PA) [-77.42, 39.73] mapped to top-ish right */}
                <circle cx="70" cy="38" r="2.5" fill={colors.archive.amber} stroke="#1a1510" strokeWidth="0.8" />
                <text x="75" y="43" fill="rgba(201,169,110,0.5)" style={{ fontSize: '3px' }}>RAVEN_ROCK</text>

                {/* Faint triangulation cords connection lines */}
                <polygon points="78,28 22,48 70,38" fill="rgba(201, 169, 110, 0.02)" stroke="rgba(201, 169, 110, 0.12)" strokeWidth="0.6" strokeDasharray="1,1" />

                {/* Centroid intersection pointer (Lebanon, Kansas) [-97.00, 38.00] */}
                {dust >= 30 ? (
                  <g className="animate-pulse">
                    <line x1="56" y1="38" x2="50" y2="44" stroke={colors.archive.blueBright} strokeWidth="0.6" />
                    {/* Centroid Bullseye */}
                    <circle cx="56" cy="38" r="3.2" fill="none" stroke={colors.archive.blueBright} strokeWidth="0.8" />
                    <circle cx="56" cy="38" r="0.8" fill={colors.archive.blueBright} />
                    <text x="56" y="33" fill={colors.archive.blueBright} style={{ fontSize: '3.5px', fontWeight: 'bold' }} textAnchor="middle">GRID_NULL_POINT</text>
                  </g>
                ) : (
                  <g opacity="0.3">
                    <circle cx="56" cy="38" r="2" fill="none" stroke={colors.archive.gray} strokeWidth="0.6" strokeDasharray="1,1" />
                    <text x="56" y="34" fill={colors.archive.gray} style={{ fontSize: '2.5px' }} textAnchor="middle">UNRESOLVED</text>
                  </g>
                )}
              </svg>

              {/* Spectrograph readout overlay */}
              <div className="absolute bottom-3 right-3 text-right text-[8px] text-stone-600 font-mono">
                <div>SOLSTICE CO-AXIAL SWEEP // SYS-7B</div>
                <div>PRECESSION AXIS: -15.00° / YEAR</div>
                <div style={{ color: colors.archive.amber }}>TERMINUS PREDICTED: JUN 2047</div>
              </div>
            </div>

            {/* Spec readout on convergence maths */}
            <div className="p-3.5 border rounded-[1px] text-[10.5px] leading-relaxed text-stone-400 text-left bg-stone-950/20" style={{ borderColor: colors.archive.grayDark }}>
              <div className="font-bold text-white uppercase mb-1">Geodetic Centroid Triangulation</div>
              <p style={{ color: colors.archive.grayLight, fontSize: '10px' }}>
                Connecting the three secure military complexes on the Evidence Board aligns the sub-audible 4.5 Hz waves, unlocking the precise centroid in Lebanon, Kansas.
              </p>
              <div className="mt-2.5 flex justify-between border-t pt-2 border-stone-900 text-[8.5px] text-stone-500 font-mono">
                <span>OBSERVER STABILITY: {stabilityLevel}</span>
                <span>DUST LOAD: {dustLevel}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ResearchPanel;
