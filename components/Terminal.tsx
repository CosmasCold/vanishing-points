'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useTerminalStore } from '@/state/terminalStore';
import { useAudioStore } from '@/state/audioStore';
import { registry } from '@/logic/commandRegistry';
import { colors, typography, spacing, timing } from '@/styles/theme';
import { TerminalCommand, CommandOutputType } from '@/types';

const getOutputColor = (type: CommandOutputType): string => {
  switch (type) {
    case 'error': return colors.archive.redBright;
    case 'warning': return colors.archive.amber;
    case 'success': return colors.archive.greenBright;
    case 'system': return colors.archive.blue;
    default: return colors.archive.white;
  }
};

export const Terminal: React.FC = () => {
  const { terminalOpen, setTerminalOpen } = useUIStore();
  const { commands, addCommand, clearCommands, history, addHistory, historyIndex, setHistoryIndex } = useTerminalStore();
  const { click } = useAudioStore();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commands]);

  useEffect(() => {
    if (terminalOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [terminalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    click();
    addHistory(input.trim());
    setHistoryIndex(-1);
    setSuggestions([]);

    const result = await registry.execute(input.trim());

    if (result.clear) {
      clearCommands();
      setInput('');
      return;
    }

    const cmd: TerminalCommand = {
      id: Date.now().toString(),
      input: input.trim(),
      output: result.output,
      timestamp: Date.now(),
      type: result.type,
    };

    addCommand(cmd);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex < history.length) {
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      if (newIndex >= -1) {
        setHistoryIndex(newIndex);
        setInput(newIndex >= 0 ? history[history.length - 1 - newIndex] : '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const tokens = input.split(/\s+/);
      const partial = tokens[tokens.length - 1] || '';
      const matches = registry.complete(partial);
      if (matches.length === 1) {
        tokens[tokens.length - 1] = matches[0];
        setInput(tokens.join(' ') + ' ');
        setSuggestions([]);
      } else if (matches.length > 1) {
        setSuggestions(matches);
      }
    } else if (e.key === 'Escape') {
      setTerminalOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {terminalOpen && (
        <motion.div
          initial={{ y: 192 }}
          animate={{ y: 0 }}
          exit={{ y: 192 }}
          transition={{ duration: timing.terminalSlide, ease: 'easeInOut' }}
          className="fixed bottom-0 left-0 right-0 z-30 border-t"
          style={{
            height: spacing.terminalHeight,
            backgroundColor: colors.archive.black,
            borderColor: colors.archive.gray,
            fontFamily: typography.mono,
          }}
        >
          <div
            className="flex items-center justify-between px-3 h-6 border-b"
            style={{
              borderColor: colors.archive.gray,
              backgroundColor: colors.archive.surface,
            }}
          >
            <span style={{
              color: colors.archive.green,
              fontSize: typography.sizes.xs
            }}>
              TERMINAL
            </span>
            <button
              onClick={() => setTerminalOpen(false)}
              className="hover:opacity-70 transition-opacity"
              style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}
            >
              [ESC]
            </button>
          </div>

          <div
            ref={scrollRef}
            className="overflow-y-auto p-3 space-y-2"
            style={{ height: 'calc(100% - 3rem)' }}
          >
            {commands.length === 0 && (
              <div style={{ color: colors.archive.gray, fontSize: typography.sizes.sm }}>
                Vanishing Points Archive Terminal v2.4.1
                <br />
                Type 'help' for available commands.
              </div>
            )}

            {commands.map((cmd) => (
              <div key={cmd.id} className="space-y-1">
                <div style={{ color: colors.archive.green, fontSize: typography.sizes.sm }}>
                  <span style={{ color: colors.archive.amber }}>&gt;</span> {cmd.input}
                </div>
                {cmd.output && (
                  <div style={{
                    color: getOutputColor(cmd.type),
                    fontSize: typography.sizes.sm,
                    opacity: 0.9,
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.4',
                  }}>
                    {cmd.output}
                  </div>
                )}
              </div>
            ))}
          </div>

          {suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 bottom-8 px-3 py-1 border-t"
              style={{
                backgroundColor: colors.archive.surface,
                borderColor: colors.archive.gray,
              }}
            >
              <span style={{ color: colors.archive.gray, fontSize: typography.sizes.xs }}>
                {suggestions.join(' ')}
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="absolute bottom-0 left-0 right-0 flex items-center px-3 h-8 border-t"
            style={{
              borderColor: colors.archive.gray,
              backgroundColor: colors.archive.surface,
            }}
          >
            <span style={{ color: colors.archive.amber, marginRight: '0.5rem' }}>
              &gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (suggestions.length) setSuggestions([]);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none"
              style={{
                color: colors.archive.white,
                fontFamily: typography.mono,
                fontSize: typography.sizes.sm,
              }}
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};