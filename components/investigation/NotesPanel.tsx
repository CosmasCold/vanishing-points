'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

interface NotesPanelProps {
  notes: string;
  onChange: (value: string) => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ notes, onChange }) => {
  return (
    <div className="max-w-3xl h-full flex flex-col">
      <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
        INVESTIGATOR NOTES — AUTO-SAVED TO LOCAL CACHE
      </div>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-3 border resize-none outline-none"
        style={{
          backgroundColor: colors.archive.surface,
          borderColor: colors.archive.gray,
          color: colors.archive.white,
          fontFamily: typography.mono,
          fontSize: typography.sizes.sm,
          lineHeight: '1.6',
          minHeight: '300px',
        }}
        placeholder="Enter observations, theories, connections..."
        spellCheck={false}
      />
      <div className="mt-2 flex justify-between" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs, color: colors.archive.gray }}>
        <span>CHARACTERS: {notes.length}</span>
        <span>LAST EDITED: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};