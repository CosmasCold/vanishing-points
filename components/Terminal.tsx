'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminalStore } from '@/state/terminalStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { registry } from '@/logic/commandRegistry';
import { colors, typography, shadows } from '@/styles/theme';

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
  const { history, addCommand, clearHistory } = useTerminalStore();
  const { play, init } = useAudioStore();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    // Start ambient on first user interaction
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(20, 20, 18, 0.85)' }}
            onClick={() => setTerminalOpen(false)}
          />

          {/* Modal Terminal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 bottom-16 z-50 mx-auto max-w-4xl flex flex-col border"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: colors.archive.black,
              boxShadow: shadows.depth,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title bar */}
            <div
              className="flex items-center justify-between px-4 h-9 border-b shrink-0"
              style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}
            >
              <div className="flex items-center gap-3" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                <span style={{ color: colors.archive.amber }}>BUNKER_7 TERMINAL</span>
                <span style={{ color: colors.archive.gray }}>|</span>
                <span style={{ color: colors.archive.gray }}>v2.4.1</span>
              </div>
              <button
                onClick={() => { play('click'); setTerminalOpen(false); }}
                className="px-2 py-0.5 border text-xs hover:border-red-700 transition-colors"
                style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono }}
              >
                × CLOSE
              </button>
            </div>

            {/* History */}
            <div
              ref={historyContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ fontFamily: typography.mono, fontSize: typography.sizes.sm }}
            >
              {history.length === 0 && (
                <div style={{ color: colors.archive.gray, opacity: 0.6 }}>
                  <div>Type a command to begin.</div>
                  <div style={{ marginTop: '0.5rem', fontSize: typography.sizes.xs }}>
                    Try: help, status, atlas, transmit, ground
                  </div>
                </div>
              )}

              {history.map((cmd) => (
                <div key={cmd.id} className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span style={{ color: colors.archive.green }}>&gt;</span>
                    <span style={{ color: colors.archive.white }}>{cmd.input}</span>
                  </div>
                  <div
                    style={{
                      color: getOutputColor(cmd.type),
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      paddingLeft: '1rem',
                      borderLeft: `1px solid ${colors.archive.grayDark}`,
                    }}
                  >
                    {cmd.output}
                  </div>
                </div>
              ))}

              {/* Suggestions */}
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
                        className="px-2 py-1 border text-xs hover:border-amber-700 transition-colors"
                        style={{ borderColor: colors.archive.grayDark, color: colors.archive.amber, fontFamily: typography.mono }}
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={historyEndRef} />
            </div>

            {/* Input bar */}
            <div
              className="shrink-0 px-4 py-3 border-t flex items-center gap-3"
              style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}
            >
              <span style={{ color: colors.archive.green, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>&gt;</span>
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
                  caretColor: colors.archive.amber,
                }}
                placeholder="Enter command..."
                spellCheck={false}
                autoComplete="off"
              />
              <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                ESC to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};