// components/puzzles/CaesarWheel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CaesarWheelProps {
  onDecode: (shift: number, decoded: string) => void;
  onClose: () => void;
}

export default function CaesarWheel({ onDecode, onClose }: CaesarWheelProps) {
  const [shift, setShift] = useState(0);
  const [input, setInput] = useState('GUR QBBE BCRAF VAJNEQ');
  const [decoded, setDecoded] = useState('');
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const decode = (text: string, s: number) => {
      return text
        .split('')
        .map((c) => {
          if (c >= 'A' && c <= 'Z') {
            const code = c.charCodeAt(0) - 65;
            const newCode = (code - s + 26) % 26;
            return String.fromCharCode(newCode + 65);
          }
          return c;
        })
        .join('');
    };
    setDecoded(decode(input, shift));
  }, [shift, input]);

  const handleMouseDown = () => {
    isDragging.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const deg = ((angle * 180) / Math.PI + 360) % 360;
    const newShift = Math.round(deg / 26);
    setShift(newShift % 26);
  };
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0c0a08] border border-[#9a8a72]/30 p-6 rounded-lg max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#9a8a72] mb-4">
          Caesar Decoder
        </h3>
        <div
          className="relative w-48 h-48 mx-auto cursor-grab"
          ref={wheelRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute inset-0 rounded-full border border-[#9a8a72]/20 flex items-center justify-center text-[8px] font-mono text-[#ddd0bc]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full relative">
                {Array.from({ length: 26 }, (_, i) => {
                  const angle = (i * 360) / 26 - shift * (360 / 26);
                  const rad = (angle * Math.PI) / 180;
                  const x = 50 + 40 * Math.cos(rad);
                  const y = 50 + 40 * Math.sin(rad);
                  return (
                    <div
                      key={i}
                      className="absolute w-4 h-4 flex items-center justify-center text-[8px] font-mono"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute inset-0 border-2 border-[#c4785a]/40 rounded-full pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#c4785a]" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              className="flex-1 bg-[#1a1612] border border-[#9a8a72]/20 px-3 py-1.5 text-[11px] font-mono text-[#ddd0bc] outline-none rounded"
              spellCheck={false}
            />
          </div>
          <div className="text-center text-[13px] font-mono text-[#e8dcc8]">{decoded}</div>
          <button
            onClick={() => {
              onDecode(shift, decoded);
              onClose();
            }}
            className="w-full border border-[#9a8a72]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#ddd0bc] hover:bg-[#9a8a72]/10 transition rounded"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}