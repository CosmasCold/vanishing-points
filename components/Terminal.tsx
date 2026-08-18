'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminalStore } from '@/state/terminalStore';
import { useUIStore, BUNKER7_THRESHOLDS } from '@/state/uiStore';
import { useProgressionStore } from '@/state/progressionStore';
import { useAudioStore } from '@/state/audioStore';
import { registry } from '@/logic/commandRegistry';
import { colors, typography, microform } from '@/styles/theme';

const getOutputColor = (type: string) => {
  switch (type) {
    case 'error': return colors.archive.red;
    case 'warning': return colors.archive.amber;
    case 'success': return colors.archive.green;
    case 'signal': return colors.archive.blue;
    case 'system': return colors.archive.grayLight;
    default: return colors.archive.white;
  }
};

export const Terminal: React.FC = () => {
  const { terminalOpen, setTerminalOpen } = useUIStore();
  const dustIndex = useProgressionStore((state) => state.dustIndex);
  const { history, addCommand, clearHistory } = useTerminalStore();
  const { play, init } = useAudioStore();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  const shouldJitter = dustIndex >= BUNKER7_THRESHOLDS.STABLE;

  useEffect(() => {
    init();
    const handleFirstClick = () => {
      useAudioStore.getState().startAmbient();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [init]);

  useEffect(() => {
    if (terminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalOpen]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;
    play('return');
    const cmd = input.trim();
    setInput('');
    setSuggestions([]);

    const result = await registry.execute(cmd);
    if (result.clear) {
      clearHistory();
    } else {
      addCommand({
        id: `cmd-${Date.now()}`,
        input: cmd,
        output: result.output,
        timestamp: Date.now(),
        type: result.type,
      });
    }
  }, [input, addCommand, clearHistory, play]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const matches = registry.complete(input.split(' ').pop() || '');
      if (matches.length === 1) {
        const words = input.split(' ');
        words[words.length - 1] = matches[0];
        setInput(words.join(' ') + ' ');
        play('click');
      } else if (matches.length > 1) {
        setSuggestions(matches);
        play('click');
      }
    } else if (e.key === 'Escape') {
      setTerminalOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.length > input.length) {
      play('type');
    }
    setSuggestions([]);
  };

  return (
    <AnimatePresence>
      {terminalOpen && (
        <>
          {/* Backdrop: heavy velvet darkness */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(10, 8, 6, 0.88)' }}
            onClick={() => setTerminalOpen(false)}
          />

          {/* Terminal Chassis */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 top-16 bottom-16 z-50 mx-auto max-w-4xl flex flex-col"
            style={{
              /* Heavy iron/mahogany bezel */
              border: `1px solid ${microform.iron}`,
              boxShadow: `
                0 0 0 2px ${microform.mahogany},
                0 0 0 3px ${microform.iron},
                0 12px 40px rgba(0,0,0,0.6),
                inset 0 1px 0 rgba(255,255,255,0.04)
              `,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer chassis frame */}
            <div
              className="flex flex-col h-full"
              style={{
                background: microform.mahogany,
                padding: '3px',
              }}
            >
              {/* Inner iron bezel */}
              <div
                className="flex flex-col h-full"
                style={{
                  border: `1px solid ${microform.iron}`,
                  boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)',
                }}
              >
                {/* Header: stamped metal plate */}
                <div
                  className="flex items-center justify-between px-4 h-10 shrink-0"
                  style={{
                    background: `linear-gradient(180deg, ${microform.mahoganyLight} 0%, ${microform.mahogany} 100%)`,
                    borderBottom: `1px solid ${microform.iron}`,
                    boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="flex items-center gap-3" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                    <span style={{ color: microform.halogen, textShadow: microform.halogenText }}>
                      BUNKER_7 TERMINAL
                    </span>
                    <span style={{ color: colors.archive.gray, opacity: 0.5 }}>|</span>
                    <span style={{ color: colors.archive.gray, opacity: 0.5 }}>v2.4.1</span>
                  </div>
                  <button
                    onClick={() => { play('click'); setTerminalOpen(false); }}
                    className="px-2 py-0.5 text-xs transition-colors hover:opacity-70"
                    style={{
                      border: `1px solid ${colors.archive.grayDark}`,
                      color: colors.archive.gray,
                      fontFamily: typography.mono,
                      background: microform.iron,
                    }}
                  >
                    × CLOSE
                  </button>
                </div>

                {/* Screen: frosted glass halogen projection */}
                <div
                  ref={historyContainerRef}
                  className="flex-1 overflow-y-auto p-5 space-y-3 relative"
                  style={{
                    fontFamily: typography.mono,
                    fontSize: typography.sizes.sm,
                    backgroundColor: colors.archive.black,
                    backgroundImage: `
                      linear-gradient(180deg, ${microform.frosted} 0%, transparent 60%),
                      radial-gradient(ellipse at 50% 0%, ${microform.halogenDim} 0%, transparent 70%)
                    `,
                    boxShadow: microform.chassisShadow,
                  }}
                >
                  {/* Optical diffusion overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: microform.opticalBlur,
                      WebkitBackdropFilter: microform.opticalBlur,
                    }}
                  />

                  {history.length === 0 && (
                    <div style={{ color: colors.archive.gray, opacity: 0.5 }}>
                      <div style={{ textShadow: microform.halogenText }}>Type a command to begin.</div>
                      <div style={{ marginTop: '0.5rem', fontSize: typography.sizes.xs }}>
                        Try: help, status, atlas, transmit, ground
                      </div>
                    </div>
                  )}

                  {history.map((cmd) => (
                    <div key={cmd.id} className="space-y-1 relative">
                      <div className="flex items-baseline gap-2">
                        <span style={{ color: colors.archive.green, opacity: 0.8 }}>&gt;</span>
                        <span style={{ color: colors.archive.white, textShadow: microform.halogenText }}>
                          {cmd.input}
                        </span>
                      </div>
                      <div
                        className={shouldJitter ? 'dust-jitter' : undefined}
                        style={{
                          color: getOutputColor(cmd.type),
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6',
                          wordBreak: 'break-word',
                          paddingLeft: '1rem',
                          borderLeft: `1px solid ${colors.archive.grayDark}`,
                          textShadow: microform.halogenText,
                        }}
                      >
                        {cmd.output}
                      </div>
                    </div>
                  ))}

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-wrap gap-2 py-2"
                      >
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              const words = input.split(' ');
                              words[words.length - 1] = s;
                              setInput(words.join(' ') + ' ');
                              setSuggestions([]);
                              inputRef.current?.focus();
                            }}
                            className="px-2 py-1 border text-xs transition-colors hover:border-amber-700"
                            style={{
                              borderColor: colors.archive.grayDark,
                              color: colors.archive.amber,
                              fontFamily: typography.mono,
                              background: microform.iron,
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={historyEndRef} />
                </div>

                {/* Input: mechanical stamp line */}
                <div
                  className="shrink-0 px-4 py-3 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
                    borderTop: `1px solid ${microform.iron}`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <span style={{ color: colors.archive.green, fontFamily: typography.mono, fontSize: typography.sizes.sm, opacity: 0.8 }}>
                    &gt;
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none"
                    style={{
                      color: colors.archive.white,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.sm,
                      caretColor: microform.halogen,
                      textShadow: microform.halogenText,
                    }}
                    placeholder="Enter command..."
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, opacity: 0.4 }}>
                    ESC to close
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};