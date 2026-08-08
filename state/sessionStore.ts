import { create } from 'zustand';
import { useUIStore } from './uiStore';

export interface InboxItem {
  id: string;
  type: 'report' | 'alert' | 'message' | 'system';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  caseRef?: string;
}

interface SessionState {
  sessionCount: number;
  lastSessionDate: string | null;
  inboxItems: InboxItem[];
  availableCases: string[];
  completedToday: string[];
  ritualComplete: boolean;

  initializeSession: () => void;
  markInboxRead: (id: string) => void;
  acceptCase: (slug: string) => void;
  completeRitual: () => void;
  resetSession: () => void;
}

function generateInbox(sessionCount: number, dust: number): InboxItem[] {
  const items: InboxItem[] = [];
  const now = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  // System baseline
  items.push({
    id: `sync-${Date.now()}`,
    type: 'system',
    title: 'Archive Synchronized',
    body: `Remote nodes checked. Local cache verified. Session ${sessionCount} initiated.`,
    timestamp: now,
    read: false,
  });

  // Synchronized 4.5 Hz Geodetic Alert
  items.push({
    id: `signal-intercept-4.5hz-${Date.now()}`,
    type: 'alert',
    title: 'SIGNAL INTERCEPT: Centroid Active',
    body: 'WARNING: Subsonic carrier wave at 4.5 Hz detected across Blue Ridge geophones. Extreme spatial folding measured along Kansas 7-B solstice vector. Physical coordinates: collapsing. Center of the triangle is active. Do not follow the lines.',
    timestamp: now,
    read: false,
  });

  // Dust warnings
  if (dust >= 30) {
    items.push({
      id: 'dust-warning',
      type: 'alert',
      title: 'Dust Accumulation Warning',
      body: `Observer Dust index at ${dust}. Stability monitoring recommended. Limit exposure to unverified documents.`,
      timestamp: now,
      read: false,
    });
  }

  if (dust >= 50) {
    items.push({
      id: 'dust-critical',
      type: 'alert',
      title: 'CRITICAL: Reality Consensus',
      body: 'Multiple valid histories detected in local sector. Do not trust uncorroborated observations.',
      timestamp: now,
      read: false,
    });
  }

  // Session-specific BUNKER_7 messages
  if (sessionCount === 1) {
    items.push({
      id: 'welcome',
      type: 'message',
      title: 'BUNKER_7: Welcome',
      body: 'Previous session terminated: unknown duration. The work has been waiting. Select a case to begin.',
      timestamp: now,
      read: false,
    });
  } else if (sessionCount === 2) {
    items.push({
      id: 'b7-observation',
      type: 'message',
      title: 'BUNKER_7: Observation',
      body: 'Your investigation patterns differ from previous archivists. Noting for the record. Proceed as usual.',
      timestamp: now,
      read: false,
    });
  } else if (sessionCount >= 4 && dust > 20) {
    items.push({
      id: 'b7-concern',
      type: 'message',
      title: 'BUNKER_7: Concern',
      body: 'Your Dust accumulation rate exceeds institutional guidelines. I am required to inform you that continued exposure is... [TRANSMISSION DEGRADED] ...your choice.',
      timestamp: now,
      read: false,
    });
  } else if (sessionCount >= 6 && dust > 40) {
    items.push({
      id: 'b7-permission',
      type: 'message',
      title: 'BUNKER_7: Permission',
      body: 'You may close the Archive for today. The work will still be here tomorrow. You are more important than the work.',
      timestamp: now,
      read: false,
    });
  }

  // Archival noise
  const noises = [
    {
      title: 'Evidence Sync Complete',
      body: '3 new documents recovered from Remote Archive Node 2. Awaiting review.',
    },
    {
      title: 'Coordinate Drift',
      body: 'Atlas sector 7-B has shifted 0.3km from last known position. Recommend verification.',
    },
    {
      title: 'Signal Intercept',
      body: 'Unregistered broadcast detected on Channel 7. Duration: 14 seconds. Content: numerical sequence.',
    },
    {
      title: 'Maintenance Report',
      body: 'Ventilation system in Wing C requires service. Not relevant to current operations.',
    },
    {
      title: 'Personnel Note',
      body: 'Coffee supply in break room depleted. Previous investigator left no procurement notes.',
    },
    {
      title: 'Atlas Update',
      body: '4 new unstable sectors mapped. Coordinates appended to pending verification queue.',
    },
    {
      title: 'Remote Node Ping',
      body: 'Archive Node 3 responded after 72 hours of silence. Status: degraded but functional.',
    },
  ];

  const noiseCount = Math.min(2, Math.floor(Math.random() * 2) + 1);
  const shuffled = [...noises].sort(() => Math.random() - 0.5);
  for (let i = 0; i < noiseCount; i++) {
    items.push({
      id: `noise-${i}-${Date.now()}`,
      type: 'report',
      title: shuffled[i].title,
      body: shuffled[i].body,
      timestamp: now,
      read: false,
    });
  }

  return items;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionCount: 0,
  lastSessionDate: null,
  inboxItems: [],
  availableCases: [],
  completedToday: [],
  ritualComplete: false,

  initializeSession: () => {
    const today = new Date().toISOString().split('T')[0];
    const current = get();

    if (current.lastSessionDate === today) {
      set({ ritualComplete: false });
      return;
    }

    const newCount = current.sessionCount + 1;
    const dust = useUIStore.getState().status.dustIndex;
    const items = generateInbox(newCount, dust);

    set({
      sessionCount: newCount,
      lastSessionDate: today,
      inboxItems: items,
      availableCases: [],
      completedToday: [],
      ritualComplete: false,
    });
  },

  markInboxRead: (id) =>
    set((s) => ({
      inboxItems: s.inboxItems.map((item) =>
        item.id === id ? { ...item, read: true } : item
      ),
    })),

  acceptCase: (slug) =>
    set((s) => ({
      availableCases: s.availableCases.filter((c) => c !== slug),
    })),

  completeRitual: () => set({ ritualComplete: true }),

  resetSession: () =>
    set({
      sessionCount: 0,
      lastSessionDate: null,
      inboxItems: [],
      availableCases: [],
      completedToday: [],
      ritualComplete: false,
    }),
}));