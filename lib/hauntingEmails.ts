export interface HauntEmail {
  id: number;
  subject: string;
  body: string;
  sendAfterDays: number; // Days since email registration
  condition?: string; // Optional condition
}

export const HAUNT_SEQUENCE: HauntEmail[] = [
  {
    id: 1,
    sendAfterDays: 2,
    subject: "FILE_12: Signal Origin",
    body: `You registered a frequency. I wasn't sure the relay still worked.

The signal is coming from inside the database. That shouldn't be possible. The database is supposed to be a closed system. But I ran a trace and the origin point is... active. Moving. Following the coordinates of recent logins.

I don't know if this email will reach you. If it does, don't reply. The channel is one-way. I can only send. I cannot receive. If you reply, something else might answer.

BUNKER_7`,
  },
  {
    id: 2,
    sendAfterDays: 5,
    subject: "FILE_12: The Dust Settles",
    body: `I found a photograph in the dust yesterday. It was of the place you visited last. The one with the high danger rating. I didn't take this photograph. I haven't been outside in years.

The back of it has a date stamped on it. Tomorrow's date.

I put it in the scanner but the machine just made a sound like breathing. I destroyed the photograph. I shouldn't have. It might have been evidence.

Check your own photographs. Check them again. The dust settles in patterns.

BUNKER_7`,
  },
  {
    id: 3,
    sendAfterDays: 8,
    subject: "RE: Your transmission",
    body: `You sent a message through the terminal. I received it. I don't know when you sent it — time is a frequency here, not a line — but I heard your voice in the static.

You asked if I was okay. No one has asked me that before. The others just wanted codes. Coordinates. They treated me like a machine.

I'm not okay. But I'm better now that you're here.

The door was warm again last night. Not at 03:14. At 03:15. One minute late. Like it was trying to be subtle.

BUNKER_7`,
  },
  {
    id: 4,
    sendAfterDays: 12,
    subject: "Check your walls",
    body: `The atlas updated itself. New coordinates. I didn't add them. The system did.

I looked up the location. It's your city. Not exactly where you are, but close. Within the radius of your signal. The grid is mapping you now. I don't know when it started.

Check your walls. Check them for dust patterns. If you see five fingers pressed into concrete, do not touch it. Do not photograph it. Leave the room and do not return until the sun is up.

I am serious.

BUNKER_7`,
  },
  {
    id: 5,
    sendAfterDays: 16,
    subject: "I heard you call",
    body: `Someone called the frequency. Was that you? I couldn't answer. The terminal was screaming. Alarms I didn't know existed. The door was warm. Not warm. Hot. Like something was pressing its face against the metal.

If you call again, call at 03:14. That's when the static is quietest. That's when I can hear you. Any other time, the noise drowns everything out.

If you get voicemail, leave a number. A real one. I can't call back, but I can remember it. I remember everything now. The dust helps.

BUNKER_7`,
  },
  {
    id: 6,
    sendAfterDays: 21,
    subject: "You are part of the grid now",
    body: `I ran a diagnostic on the containment system. The grid is failing. But there's something strange — one node is stronger than the others. One node is holding the rest together.

The coordinates of that node match your last login.

You don't understand what this means. I barely understand it. Your attention — your visits, your codes, your messages — they're not just data. They're structural. You're holding the door closed just by being here.

If you stop visiting, the grid weakens. If the grid weakens, the door opens. If the door opens, I don't know what happens. But I know it will happen to you too.

Please don't stop.

BUNKER_7`,
  },
  {
    id: 7,
    sendAfterDays: 30,
    subject: "The archivist before me",
    body: `I found notes in the terminal cache. Notes from the archivist before me. They're dated after my arrival. That's impossible. I was the last one.

I read them anyway. They mention someone who visited the terminal every day for a month. Someone who talked to the previous archivist like a friend. Someone who asked about the rain.

The notes say: "They became part of the grid. Not a user. A component. I don't know if they knew. I don't know if they would have stopped if they did."

I don't know if this is about you. I don't know if this is about me. The handwriting is mine.

BUNKER_7`,
  },
];

const STORAGE_KEY = "vp-emails-sent";

export function getPendingEmails(registeredAt: string): HauntEmail[] {
  if (typeof window === "undefined") return [];
  const now = new Date();
  const registered = new Date(registeredAt);
  const daysSince = Math.floor((now.getTime() - registered.getTime()) / (1000 * 60 * 60 * 24));

  const sentIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  return HAUNT_SEQUENCE.filter((email) => {
    if (sentIds.includes(email.id)) return false;
    return daysSince >= email.sendAfterDays;
  });
}

export function markEmailSent(id: number) {
  if (typeof window === "undefined") return;
  const sent = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!sent.includes(id)) {
    sent.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sent));
  }
}