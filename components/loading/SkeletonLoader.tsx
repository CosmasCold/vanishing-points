'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { colors, typography } from '@/styles/theme';

interface SkeletonProps {
  lines?: number;
  type?: 'document' | 'map' | 'grid' | 'list';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ lines = 4, type = 'document' }) => {
  const baseStyle = {
    backgroundColor: colors.archive.surface,
    borderColor: colors.archive.gray,
  };

  if (type === 'map') {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.archive.black }}>
        <div className="text-center space-y-3">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.sm }}
          >
            LOADING ATLAS DATA...
          </motion.div>
          <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
            Synchronizing coordinates...
          </div>
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            className="h-32 border"
            style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
          />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            className="h-12 border"
            style={{ borderColor: colors.archive.gray, backgroundColor: colors.archive.surface }}
          />
        ))}
      </div>
    );
  }

  // Document skeleton
  return (
    <div className="space-y-4 p-8 max-w-2xl">
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="h-4 w-1/3"
        style={{ backgroundColor: colors.archive.amber, opacity: 0.3 }}
      />
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          className="h-3 w-full"
          style={{ backgroundColor: colors.archive.white, opacity: 0.15 }}
        />
      ))}
    </div>
  );
};