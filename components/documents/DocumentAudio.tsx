'use client';

import React, { useEffect, useRef } from 'react';
import { useDocumentStore } from '@/state/documentStore';
import { useAudioStore } from '@/state/audioStore';

const documentSounds: Record<string, string> = {
  field_report: '/audio/paper-rustle.mp3',
  witness_statement: '/audio/tape-hiss.mp3',
  internal_memo: '/audio/typewriter-clack.mp3',
  photograph: '/audio/shutter-click.mp3',
  audio_transcript: '/audio/tape-hiss.mp3',
  blueprint: '/audio/paper-rustle.mp3',
  telegram: '/audio/telegraph-tap.mp3',
  journal_entry: '/audio/pen-scratch.mp3',
  bunker7_transmission: '/audio/static-burst.mp3',
};

export const DocumentAudio: React.FC = () => {
  const { openDocumentId, getDocumentById } = useDocumentStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const doc = openDocumentId ? getDocumentById(openDocumentId) : undefined;
    if (!doc) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const soundPath = documentSounds[doc.type];
    if (soundPath) {
      audioRef.current = new Audio(soundPath);
      audioRef.current.volume = 0.3;
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [openDocumentId, getDocumentById]);

  return null;
};