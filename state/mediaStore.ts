import { create } from 'zustand';

interface ActiveMedia {
  evidenceId: string;
  url: string;
  type: 'audio' | 'video' | 'personal';
  title: string;
}

interface MediaState {
  activeMedia: ActiveMedia | null;
  isPlaying: boolean;

  openMedia: (evidenceId: string, url: string, type: 'audio' | 'video' | 'personal', title: string) => void;
  closeMedia: () => void;
  setPlaying: (playing: boolean) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  activeMedia: null,
  isPlaying: false,

  openMedia: (evidenceId, url, type, title) =>
    set({ activeMedia: { evidenceId, url, type, title }, isPlaying: false }),

  closeMedia: () => set({ activeMedia: null, isPlaying: false }),

  setPlaying: (playing) => set({ isPlaying: playing }),
}));