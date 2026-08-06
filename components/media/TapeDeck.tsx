'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { colors, typography } from '@/styles/theme';
import { useAudioStore } from '@/state/audioStore';

interface TapeDeckProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const TapeDeck: React.FC<TapeDeckProps> = ({ src, title, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [counter, setCounter] = useState(0);
  const { click } = useAudioStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
      setCounter(Math.floor((audio.currentTime / (audio.duration || 1)) * 999));
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
    };
  }, []);

  const togglePlay = () => {
    click();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setProgress(time);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Deck chassis */}
      <div
        className="relative w-80 h-48 border p-4"
        style={{
          borderColor: colors.archive.gray,
          backgroundColor: colors.archive.surface,
          borderRadius: '2px',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)',
        }}
      >
        {/* Tape window */}
        <div
          className="absolute top-8 left-8 right-8 h-24 border"
          style={{
            borderColor: '#3a3a38',
            backgroundColor: 'rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Left reel */}
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2"
            style={{ borderColor: colors.archive.amber }}
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={isPlaying ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
          >
            <div className="absolute inset-2 rounded-full border" style={{ borderColor: colors.archive.amber, opacity: 0.4 }} />
            <div className="absolute top-0 left-1/2 w-0.5 h-2 -translate-x-1/2" style={{ backgroundColor: colors.archive.amber }} />
          </motion.div>

          {/* Right reel */}
          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2"
            style={{ borderColor: colors.archive.amber }}
            animate={isPlaying ? { rotate: -360 } : { rotate: 0 }}
            transition={isPlaying ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
          >
            <div className="absolute inset-2 rounded-full border" style={{ borderColor: colors.archive.amber, opacity: 0.4 }} />
            <div className="absolute top-0 left-1/2 w-0.5 h-2 -translate-x-1/2" style={{ backgroundColor: colors.archive.amber }} />
          </motion.div>

          {/* Tape path line */}
          <div className="absolute top-1/2 left-24 right-24 h-px -translate-y-1/2" style={{ backgroundColor: colors.archive.amber, opacity: 0.25 }} />
        </div>

        {/* Counter */}
        <div
          className="absolute bottom-3 left-4 px-2 py-1 border text-xs"
          style={{
            borderColor: colors.archive.gray,
            color: colors.archive.amber,
            backgroundColor: colors.archive.black,
            fontFamily: typography.mono,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
          }}
        >
          {counter.toString().padStart(3, '0')}
        </div>

        {/* Record lamp */}
        <div className="absolute bottom-3 right-4 flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isPlaying ? colors.archive.red : colors.archive.gray,
              boxShadow: isPlaying ? `0 0 6px ${colors.archive.red}` : 'none',
            }}
          />
          <span style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
            REC
          </span>
        </div>
      </div>

      {/* Title */}
      <div style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.sm, letterSpacing: '0.05em' }}>
        {title}
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-4 w-80">
        <button
          onClick={togglePlay}
          className="px-4 py-2 border transition-colors hover:border-amber-700"
          style={{
            borderColor: colors.archive.amber,
            color: colors.archive.amber,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            minWidth: '64px',
          }}
        >
          {isPlaying ? 'STOP' : 'PLAY'}
        </button>

        <div className="flex-1 flex items-center gap-2">
          <span style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${colors.archive.amber} ${(progress / (duration || 1)) * 100}%, ${colors.archive.gray} ${(progress / (duration || 1)) * 100}%)`,
            }}
          />
          <span style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <button
        onClick={() => { click(); onClose(); }}
        className="text-xs hover:opacity-70 transition-opacity"
        style={{ color: colors.archive.gray, fontFamily: typography.mono }}
      >
        [EJECT]
      </button>
    </div>
  );
};