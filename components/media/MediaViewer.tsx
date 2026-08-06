'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TapeDeck } from './TapeDeck';
import { CRTMonitor } from './CRTMonitor';
import { colors } from '@/styles/theme';

interface MediaViewerProps {
  url: string;
  type: 'audio' | 'video' | 'personal';
  title: string;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ url, type, title, onClose }) => {
  // Personal cache recordings play through the Tape Deck (archivist cassettes)
  const playerType = type === 'personal' ? 'audio' : type;

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
        className="border"
        style={{
          borderColor: colors.archive.gray,
          backgroundColor: colors.archive.black,
          boxShadow: '0 0 40px rgba(0,0,0,0.8)',
        }}
      >
        {playerType === 'audio' ? (
          <TapeDeck src={url} title={title} onClose={onClose} />
        ) : (
          <CRTMonitor src={url} title={title} onClose={onClose} />
        )}
      </motion.div>
    </motion.div>
  );
};