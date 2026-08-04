// components/terminal/TerminalLineView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TerminalLine, LineType } from '@/lib/terminalContent';
import type { TerminalTheme } from '@/lib/terminalThemes';

interface TerminalLineViewProps {
  line: TerminalLine;
  theme: TerminalTheme;
  corruptionStage: number;
  hijacked: boolean;
}

export default function TerminalLineView({ line, theme, corruptionStage, hijacked }: TerminalLineViewProps) {
  const [display, setDisplay] = useState(line.type === 'other' ? '' : line.text);

  useEffect(() => {
    if (line.type === 'other') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let i = 0;
      const interval = setInterval(() => {
        if (i >= line.text.length) {
          clearInterval(interval);
          setDisplay(line.text);
          return;
        }
        setDisplay(
          line.text.slice(0, i) +
          Array.from({ length: line.text.length - i }, () =>
            chars[Math.floor(Math.random() * chars.length)]
          ).join('')
        );
        i++;
      }, 22);
      return () => clearInterval(interval);
    } else {
      setDisplay(line.text);
    }
  }, [line]);

  let color = theme.primary;
  let opacity = 1;
  let blur = 0;
  let extraShadow = '';
  let letterSpacing = 'normal';
  let fontStyle: 'normal' | 'italic' = 'normal';

  switch (line.type) {
    case 'input':
      color = theme.dim;
      opacity = 0.45;
      break;
    case 'other':
      color = theme.corruption;
      extraShadow = `0 0 10px ${theme.corruption}50, -0.5px 0 rgba(180,60,60,0.35), 0.5px 0 rgba(60,180,180,0.2)`;
      letterSpacing = '0.03em';
      break;
    case 'ghost':
      color = theme.dim;
      opacity = 0.3;
      blur = 0.6;
      letterSpacing = '0.04em';
      fontStyle = 'italic';
      break;
    case 'error':
      color = theme.danger;
      extraShadow = `0 0 8px ${theme.danger}35`;
      break;
    case 'success':
      color = '#7a9a6a';
      extraShadow = '0 0 8px rgba(122,154,106,0.25)';
      break;
    case 'system':
      color = theme.accent;
      opacity = 0.85;
      break;
    case 'warning':
      color = theme.corruption;
      opacity = 0.9;
      extraShadow = `0 0 6px ${theme.corruption}30`;
      break;
    default:
      color = theme.primary;
      extraShadow = `0 0 2px ${theme.phosphor}35, 0 0 10px ${theme.phosphor}12`;
  }

  const shouldGlitch = corruptionStage >= 4 && line.type === 'normal' && Math.random() < 0.04;

  return (
    <motion.div
      initial={{ opacity: 0, x: -3 }}
      animate={{ opacity: line.type === 'ghost' ? 0.3 : 1, x: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="whitespace-pre-wrap font-mono text-[14px] leading-[1.7] tracking-wide"
      style={{
        color,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        textShadow: extraShadow,
        letterSpacing,
        fontStyle,
        fontFeatureSettings: '"tnum"',
      }}
    >
      {shouldGlitch
        ? display.split('').map((c, i) => (
            <span
              key={i}
              style={
                Math.random() < 0.07
                  ? {
                      display: 'inline-block',
                      transform: `translateY(${Math.random() > 0.5 ? 2 : -2}px) skewX(${Math.random() > 0.5 ? 1 : -1}deg)`,
                      color: theme.corruption,
                      textShadow: `0 0 5px ${theme.corruption}`,
                    }
                  : {}
              }
            >
              {c}
            </span>
          ))
        : display}
    </motion.div>
  );
}