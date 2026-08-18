'use client';
import React from 'react';
import ArchiveEnvironment from './ArchiveEnvironment';
import type { ArchiveStation } from '@/lib/archive/stations';

export function ArchiveShell({ station = 'evidence', children, className = '' }: { station?: ArchiveStation; children: React.ReactNode; className?: string }) {
  return (
    <main data-archive-shell data-archive-station={station} className={`relative min-h-screen overflow-hidden ${className}`}>
      <ArchiveEnvironment station={station} />
      <div className="relative z-10 min-h-screen">{children}</div>
    </main>
  );
}
