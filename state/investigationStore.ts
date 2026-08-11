import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EvidenceItem, TimelineEvent } from '@/types/investigation';

interface InvestigationStore {
  activeInvestigationId: string | null;
  evidence: Record<string, EvidenceItem[]>;
  timelines: Record<string, TimelineEvent[]>;
  notes: Record<string, string>;
  unlockedMedia: Record<string, string[]>;

  openInvestigation: (placeSlug: string, placeName: string) => void;
  closeInvestigation: () => void;
  addEvidence: (investigationId: string, item: EvidenceItem) => void;
  updateEvidenceStatus: (investigationId: string, evidenceId: string, status: EvidenceItem['status']) => void;
  addTimelineEvent: (investigationId: string, event: TimelineEvent) => void;
  setNotes: (investigationId: string, notes: string) => void;
  unlockMedia: (investigationId: string, mediaId: string) => void;
}

export const useInvestigationStore = create<InvestigationStore>()(
  persist(
    (set) => ({
      activeInvestigationId: null,
      evidence: {},
      timelines: {},
      notes: {},
      unlockedMedia: {},

      openInvestigation: (slug, name) => {
        set((state) => ({
          activeInvestigationId: slug,
          evidence: { ...state.evidence, [slug]: state.evidence[slug] || [] },
          timelines: { ...state.timelines, [slug]: state.timelines[slug] || [] },
          notes: { ...state.notes, [slug]: state.notes[slug] || '' },
          unlockedMedia: { ...state.unlockedMedia, [slug]: state.unlockedMedia[slug] || [] },
        }));
      },
      closeInvestigation: () => set({ activeInvestigationId: null }),
      addEvidence: (id, item) =>
        set((state) => ({
          evidence: {
            ...state.evidence,
            [id]: [...(state.evidence[id] || []), item],
          },
        })),
      updateEvidenceStatus: (invId, evId, status) =>
        set((state) => ({
          evidence: {
            ...state.evidence,
            [invId]:
              state.evidence[invId]?.map((e) =>
                e.id === evId ? { ...e, status } : e
              ) || [],
          },
        })),
      addTimelineEvent: (id, event) =>
        set((state) => ({
          timelines: {
            ...state.timelines,
            [id]: [...(state.timelines[id] || []), event].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
          },
        })),
      setNotes: (id, notes) =>
        set((state) => ({
          notes: {
            ...state.notes,
            [id]: notes,
          },
        })),
      unlockMedia: (id, mediaId) =>
        set((state) => ({
          unlockedMedia: {
            ...state.unlockedMedia,
            [id]: [...(state.unlockedMedia[id] || []), mediaId],
          },
        })),
    }),
    {
      name: 'vp-investigations-state',
      partialize: (state) => ({
        evidence: state.evidence,
        timelines: state.timelines,
        notes: state.notes,
        unlockedMedia: state.unlockedMedia,
      }),
    }
  )
);
