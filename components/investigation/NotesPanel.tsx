'use client';

import React from 'react';
import { colors, typography } from '@/styles/theme';

interface NotesPanelProps {
  notes: string;
  onChange: (value: string) => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ notes, onChange }) => {
  return (
    <div className="max-w-3xl h-full flex flex-col p-6 leather-notepad relative">

        {/* Hand-hammered brass corner studs in leather-bound backing board */}
        <div className="brass-rivet top-2 left-2" />
        <div className="brass-rivet top-2 right-2" />
        <div className="brass-rivet bottom-2 left-2" />
        <div className="brass-rivet bottom-2 right-2" />
      <div style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.serif, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
        INVESTIGATOR NOTES — AUTO-SAVED TO LOCAL CACHE
      </div>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-3 border resize-none outline-none"
        style={{
          backgroundColor: '#1b1411',
          borderColor: colors.archive.gray,
          color: '#ebd6be', textShadow: '0 0 2px rgba(223,178,124,0.1)',
          fontFamily: typography.serif,
          fontSize: typography.sizes.sm,
          lineHeight: '1.6',
          minHeight: '300px',
        }}
        placeholder="Enter observations, theories, connections..."
        spellCheck={false}
      />
      <div className="mt-2 flex justify-between" style={{ fontFamily: typography.serif, fontSize: typography.sizes.xs, color: colors.archive.gray }}>
        <span>CHARACTERS: {notes.length}</span>
        <span>LAST EDITED: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};