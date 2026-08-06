'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';

interface PhotoViewerProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({ src, title, onClose }) => {
  const { click } = useAudioStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-20 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(26, 26, 24, 0.96)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative border p-2"
        style={{
          borderColor: colors.archive.grayDark,
          backgroundColor: colors.archive.surface,
          boxShadow: '0 0 40px rgba(0,0,0,0.8)',
          maxWidth: '85vw',
          maxHeight: '85vh',
        }}
      >
        {/* Photo border */}
        <div className="relative">
          <img
            src={src}
            alt={title}
            className="block max-w-full max-h-[75vh] object-contain"
            style={{ filter: 'sepia(0.2) contrast(1.05)' }}
          />
          
          {/* Photo corner marks */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l" style={{ borderColor: colors.archive.amber, opacity: 0.5 }} />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r" style={{ borderColor: colors.archive.amber, opacity: 0.5 }} />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l" style={{ borderColor: colors.archive.amber, opacity: 0.5 }} />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r" style={{ borderColor: colors.archive.amber, opacity: 0.5 }} />
        </div>

        {/* Caption */}
        <div
          className="mt-2 flex justify-between items-center"
          style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}
        >
          <span style={{ color: colors.archive.gray }}>{title}</span>
          <button
            onClick={() => { click(); onClose(); }}
            className="px-2 py-0.5 border hover:border-red-700 transition-colors"
            style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray }}
          >
            CLOSE
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};