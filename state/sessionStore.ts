import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProgressionStore } from './progressionStore';

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
  /**
   * Workstation/session presentation state.
   *
   * Canonical session identity belongs to useProgressionStore.
   * This value exists for compatibility with existing workstation
   * consumers and is synchronized from canonical progression.
   */
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

function getCanonicalSessionCount(): number {
  return useProgressionStore.getState().sessionCount;
}

function getCanonicalSessionStart(): string | null {
  return useProgressionStore.getState().sessionStartedAt;
}

function generateInbox(
  sessionCount: number,
  dust: number,
): InboxItem[] {
  const items: InboxItem[] = [];

  const now = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  // ---------------------------------------------------------------------------
  // SYSTEM BASELINE
  // ---------------------------------------------------------------------------

  items.push({
    id: `sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'system',
    title: 'Archive Synchronized',
    body:
      `Remote nodes checked. Local cache verified. ` +
      `Session ${sessionCount} initiated.`,
    timestamp: now,
    read: false,
  });

  // ---------------------------------------------------------------------------
  // SYNCHRONIZED 4.5 HZ GEODETIC ALERT
  // ---------------------------------------------------------------------------

  items.push({
    id:
      `signal-intercept-4.5hz-` +
      `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'alert',
    title: 'SIGNAL INTERCEPT: Centroid Active',
    body:
      'WARNING: Subsonic carrier wave at 4.5 Hz detected across Blue Ridge geophones. ' +
      'Extreme spatial folding measured along Kansas 7-B solstice vector. ' +
      'Physical coordinates: collapsing. Center of the triangle is active. Do not follow the lines.',
    timestamp: now,
    read: false,
  });

  // ---------------------------------------------------------------------------
  // DUST WARNINGS
  // ---------------------------------------------------------------------------

  if (dust >= 30) {
    items.push({
      id: `dust-warning-${Date.now()}`,
      type: 'alert',
      title: 'Dust Accumulation Warning',
      body:
        `Observer Dust index at ${dust}. Stability monitoring recommended. ` +
        'Limit exposure to unverified documents.',
      timestamp: now,
      read: false,
    });
  }

  if (dust >= 50) {
    items.push({
      id: `dust-critical-${Date.now()}`,
      type: 'alert',
      title: 'CRITICAL: Reality Consensus',
      body:
        'Multiple valid histories detected in local sector. ' +
        'Do not trust uncorroborated observations.',
      timestamp: now,
      read: false,
    });
  }

  // ---------------------------------------------------------------------------
  // SESSION-SPECIFIC BUNKER_7 MESSAGES
  //
  // Session count comes from canonical progression.
  // These messages are presentation only.
  // ---------------------------------------------------------------------------

  switch (sessionCount) {
    case 1:
      items.push({
        id: 'session-1-welcome',
        type: 'message',
        title: 'BUNKER_7: Welcome',
        body:
          'Previous session terminated: unknown duration. ' +
          'The work has been waiting. Select a case to begin.',
        timestamp: now,
        read: false,
      });
      break;

    case 2:
      items.push({
        id: 'session-2-observation',
        type: 'message',
        title: 'BUNKER_7: Observation',
        body:
          'Your investigation patterns differ from previous archivists. ' +
          'Noting for the record. Proceed as usual.',
        timestamp: now,
        read: false,
      });
      break;

    case 3:
      items.push({
        id: 'session-3-provenance',
        type: 'message',
        title: 'BUNKER_7: Provenance Irregularity',
        body:
          'Personnel File 447 has returned to the active index. ' +
          'The record predates your current assignment, but its provenance has changed. ' +
          'The Archive cannot determine why a disappearance report from Carrel 7-B is appearing in this session.',
        timestamp: now,
        read: false,
        caseRef: 'personnel-447',
      });
      break;

    case 4:
      items.push({
        id: 'session-4-red7',
        type: 'message',
        title: 'BUNKER_7: INV_RED-7',
        body:
          'INV_RED-7 appears in a record generated before this session began. ' +
          'The Archive has requested that I classify this as a historical anomaly.',
        timestamp: now,
        read: false,
      });
      break;

    case 5:
      items.push({
        id: 'session-5-identity',
        type: 'message',
        title: 'BUNKER_7: Identity Query',
        body:
          'I have a question for the record. ' +
          'Are you certain you are the investigator assigned to Carrel 7-B?',
        timestamp: now,
        read: false,
      });
      break;

    default:
      items.push({
        id: 'session-6-recurring',
        type: 'message',
        title: 'BUNKER_7: Recurrence',
        body:
          'The Archive no longer classifies your presence as a new investigation. ' +
          'You have occurred here before.',
        timestamp: now,
        read: false,
      });
      break;
  }

  // ---------------------------------------------------------------------------
  // EXPOSURE WARNING
  //
  // Dust is operational state, not the narrative session milestone.
  // ---------------------------------------------------------------------------

  if (sessionCount >= 4 && dust > 20) {
    items.push({
      id: `b7-concern-${sessionCount}`,
      type: 'alert',
      title: 'BUNKER_7: Exposure Concern',
      body:
        'Your Dust accumulation rate exceeds guidelines. ' +
        'I am required to inform you that continued exposure is... ' +
        '[TRANSMISSION DEGRADED] ...your choice.',
      timestamp: now,
      read: false,
    });
  }

  if (sessionCount >= 6 && dust > 40) {
    items.push({
      id: `b7-permission-${sessionCount}`,
      type: 'message',
      title: 'BUNKER_7: Permission',
      body:
        'You may close the Archive for today. ' +
        'The work will still be here tomorrow. ' +
        'You are more important than the work.',
      timestamp: now,
      read: false,
    });
  }

  // ---------------------------------------------------------------------------
  // ARCHIVAL NOISE
  // ---------------------------------------------------------------------------

  const noises = [
    {
      title: 'Evidence Sync Complete',
      body:
        '3 new documents recovered from Remote Archive Node 2. Awaiting review.',
    },
    {
      title: 'Coordinate Drift',
      body:
        'Atlas sector 7-B has shifted 0.3km from last known position. Recommend verification.',
    },
    {
      title: 'Signal Intercept',
      body:
        'Unregistered broadcast detected on Channel 7. Duration: 14 seconds. Content: numerical sequence.',
    },
    {
      title: 'Maintenance Report',
      body:
        'Ventilation system in Wing C requires service. Not relevant to current operations.',
    },
    {
      title: 'Personnel Note',
      body:
        'Coffee supply in break room depleted. Previous investigator left no procurement notes.',
    },
    {
      title: 'Atlas Update',
      body:
        '4 new unstable sectors mapped. Coordinates appended to pending verification queue.',
    },
    {
      title: 'Remote Node Ping',
      body:
        'Archive Node 3 responded after 72 hours of silence. Status: degraded but functional.',
    },
  ];

  const noiseCount =
    Math.min(2, Math.floor(Math.random() * 2) + 1);

  const shuffled = [...noises].sort(
    () => Math.random() - 0.5,
  );

  for (let i = 0; i < noiseCount; i++) {
    items.push({
      id:
        `noise-${sessionCount}-${i}-` +
        `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'report',
      title: shuffled[i].title,
      body: shuffled[i].body,
      timestamp: now,
      read: false,
    });
  }

  return items;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // INITIAL STATE
      //
      // Session identity is synchronized from canonical progression.
      // -----------------------------------------------------------------------

      sessionCount: getCanonicalSessionCount(),
      lastSessionDate: getCanonicalSessionStart(),
      inboxItems: [],
      availableCases: [],
      completedToday: [],
      ritualComplete: false,

      // -----------------------------------------------------------------------
      // INITIALIZE SESSION
      // -----------------------------------------------------------------------

      initializeSession: () => {
        const progression =
          useProgressionStore.getState();

        const today =
          new Date().toISOString().split('T')[0];

        const current = get();

        /*
         * If today's workstation session has already been initialized,
         * do not create another canonical session.
         */
        if (
          current.lastSessionDate === today &&
          progression.sessionStartedAt !== null
        ) {
          return;
        }

        /*
         * Canonical session authority.
         *
         * beginSession() is responsible for advancing progression.
         * sessionStore never increments the canonical session counter.
         */
        if (progression.sessionStartedAt === null) {
          progression.beginSession();
        }

        const canonical =
          useProgressionStore.getState();

        const sessionCount =
          canonical.sessionCount;

        const sessionStartedAt =
          canonical.sessionStartedAt;

        const dust =
          canonical.dustIndex;

        set({
          sessionCount,

          lastSessionDate:
            sessionStartedAt
              ? today
              : current.lastSessionDate,

          inboxItems:
            generateInbox(
              sessionCount,
              dust,
            ),

          ritualComplete: false,
        });
      },

      // -----------------------------------------------------------------------
      // INBOX
      // -----------------------------------------------------------------------

      markInboxRead: (id) =>
        set((state) => ({
          inboxItems:
            state.inboxItems.map((item) =>
              item.id === id
                ? {
                    ...item,
                    read: true,
                  }
                : item,
            ),
        })),

      // -----------------------------------------------------------------------
      // CASES
      // -----------------------------------------------------------------------

      acceptCase: (slug) =>
        set((state) => ({
          availableCases:
            state.availableCases.filter(
              (caseSlug) =>
                caseSlug !== slug,
            ),
        })),

      // -----------------------------------------------------------------------
      // RITUAL
      // -----------------------------------------------------------------------

      completeRitual: () =>
        set({
          ritualComplete: true,
        }),

      // -----------------------------------------------------------------------
      // RESET WORKSTATION SESSION
      //
      // This resets presentation state only.
      // It does NOT reset canonical progression.
      // -----------------------------------------------------------------------

      resetSession: () => {
        const canonical =
          useProgressionStore.getState();

        set({
          sessionCount:
            canonical.sessionCount,

          lastSessionDate:
            canonical.sessionStartedAt,

          inboxItems: [],
          availableCases: [],
          completedToday: [],
          ritualComplete: false,
        });
      },
    }),

    {
      name: 'vp-session-state',

      /*
       * Canonical session identity is owned by progressionStore.
       *
       * Do not persist a second authoritative session counter.
       * Existing consumers still receive sessionCount from the live
       * synchronized Zustand state.
       */
      partialize: (state) => ({
        lastSessionDate:
          state.lastSessionDate,

        inboxItems:
          state.inboxItems,

        availableCases:
          state.availableCases,

        completedToday:
          state.completedToday,

        ritualComplete:
          state.ritualComplete,
      }),

      /*
       * Recover cleanly from older vp-session-state records that
       * contained an independent session counter.
       */
      onRehydrateStorage: () => {
        return () => {
          const canonical =
            useProgressionStore.getState();

          useSessionStore.setState({
            sessionCount:
              canonical.sessionCount,

            lastSessionDate:
              canonical.sessionStartedAt,
          });
        };
      },
    },
  ),
);