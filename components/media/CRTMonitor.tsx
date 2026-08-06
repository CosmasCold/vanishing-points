'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { colors, typography } from '@/styles/theme';
import { useAudioStore } from '@/state/audioStore';

interface CRTMonitorProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const CRTMonitor: React.FC<CRTMonitorProps> = ({ src, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scanlines, setScanlines] = useState(true);
  const { click } = useAudioStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
    };
  }, []);

  const togglePlay = () => {
    click();
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setProgress(time);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* CRT bezel */}
      <div
        className="relative p-3 border-4"
        style={{
          borderColor: '#2a2a28',
          backgroundColor: '#151514',
          borderRadius: '6px',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 0 1px #3a3a38',
        }}
      >
        {/* Screen */}
        <div
          className="relative overflow-hidden"
          style={{ width: '480px', maxWidth: '85vw', height: '270px', backgroundColor: '#000' }}
        >
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain"
            style={{ opacity: 0.8 }}
            onClick={togglePlay}
          />

          {/* Scanlines */}
          {scanlines && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
                backgroundSize: '100% 4px',
              }}
            />
          )}

          {/* CRT phosphor flicker */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
            animate={{ opacity: [0.015, 0.035, 0.01, 0.025, 0.015] }}
            transition={{ duration: 0.12, repeat: Infinity }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)',
            }}
          />

          {/* No signal / standby */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, opacity: 0.4 }}>
                NO SIGNAL
              </div>
            </div>
          )}
        </div>

        {/* Front panel */}
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isPlaying ? colors.archive.green : colors.archive.red,
                boxShadow: `0 0 4px ${isPlaying ? colors.archive.green : colors.archive.red}`,
              }}
            />
            <span style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
              {isPlaying ? 'PLAYING' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span style={{ color: colors.archive.amber, fontSize: '0.625rem', fontFamily: typography.mono }}>
              CH 01
            </span>
            <div className="w-px h-3" style={{ backgroundColor: colors.archive.gray }} />
            <span style={{ color: colors.archive.gray, fontSize: '0.625rem', fontFamily: typography.mono }}>
              CRT-7
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: typography.sizes.sm, letterSpacing: '0.05em' }}>
        {title}
      </div>

      {/* Controls */}
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
          {isPlaying ? 'PAUSE' : 'PLAY'}
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

      <div className="flex gap-6">
        <button
          onClick={() => { click(); setScanlines(!scanlines); }}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: colors.archive.gray, fontFamily: typography.mono }}
        >
          [SCANLINES {scanlines ? 'ON' : 'OFF'}]
        </button>
        <button
          onClick={() => { click(); onClose(); }}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: colors.archive.gray, fontFamily: typography.mono }}
        >
          [POWER OFF]
        </button>
      </div>
    </div>
  );
};