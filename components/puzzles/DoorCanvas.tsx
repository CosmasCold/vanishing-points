// components/puzzles/DoorCanvas.tsx
'use client';

import React, { useState, useRef } from 'react';

interface DoorCanvasProps {
  onUnlock: () => void;
  onClose: () => void;
}

export default function DoorCanvas({ onUnlock, onClose }: DoorCanvasProps) {
  const [phase, setPhase] = useState<'locked' | 'turning' | 'open'>('locked');
  const [angle, setAngle] = useState(0);
  const [input, setInput] = useState('');
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    if (phase !== 'locked') return;
    isDragging.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angleMouse = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const deg = ((angleMouse * 180) / Math.PI + 360) % 360;
    setAngle(deg);
  };
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleUnlock = () => {
    if (input.toUpperCase().trim() === 'INWARD') {
      setPhase('open');
      onUnlock();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0c0a08] border border-[#9a8a72]/40 p-6 rounded-lg max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#9a8a72] mb-4">
          The Door
        </h3>
        <div
          className="relative w-48 h-48 mx-auto cursor-grab"
          ref={wheelRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute inset-0 rounded-full border-4 border-[#5a4e42] flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-[#9a8a72]/30 flex items-center justify-center text-[8px] font-mono text-[#ddd0bc]">
              {phase === 'locked' && (
                <div className="w-full h-full relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-[#c4785a]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c4785a]" />
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-[#c4785a]"
                    style={{ transform: `rotate(${angle}deg)` }}
                  />
                </div>
              )}
              {phase === 'open' && (
                <span className="text-[#7a9a6a] text-xs">OPEN</span>
              )}
            </div>
          </div>
        </div>
        {phase === 'locked' && (
          <div className="mt-4 space-y-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter code..."
              className="w-full bg-[#1a1612] border border-[#9a8a72]/20 px-3 py-1.5 text-[11px] font-mono text-[#ddd0bc] outline-none rounded"
            />
            <button
              onClick={handleUnlock}
              className="w-full border border-[#c4785a]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#c4785a] hover:bg-[#c4785a]/10 transition rounded"
            >
              Unlock
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full border border-[#9a8a72]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#ddd0bc] hover:bg-[#9a8a72]/10 transition rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}