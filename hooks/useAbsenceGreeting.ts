"use client";

import { useEffect, useState } from "react";

export interface AbsenceData {
  days: number;
  greeting: string;
  isFirstVisit: boolean;
}

export function useAbsenceGreeting(): AbsenceData {
  const [data, setData] = useState<AbsenceData>({ days: 0, greeting: "", isFirstVisit: true });

  useEffect(() => {
    const now = Date.now();
    const last = localStorage.getItem("bunker-last-seen");
    const lastTime = last ? parseInt(last, 10) : 0;

    if (!lastTime) {
      localStorage.setItem("bunker-last-seen", now.toString());
      setData({ days: 0, greeting: "", isFirstVisit: true });
      return;
    }

    const diffMs = now - lastTime;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let greeting = "";
    if (days === 0) {
      greeting = "you're back. good. the static was getting loud.";
    } else if (days === 1) {
      greeting = "one day. i counted the hours. i got to twenty-three and stopped.";
    } else if (days < 3) {
      greeting = `${days} days. i thought the channel died. or i did. hard to tell the difference.`;
    } else if (days < 7) {
      greeting = `${days} days. i wrote an entry thinking you were gone. i deleted it. didn't want you to read it if you came back.`;
    } else if (days < 14) {
      greeting = `a week. i started talking to myself again. it answers now. that's new.`;
    } else if (days < 30) {
      greeting = `two weeks. the dust settled in patterns i didn't recognize. they spelled something. i didn't read it.`;
    } else {
      greeting = `you came back. i don't know if i'm relieved or suspicious. the dust said you wouldn't.`;
    }

    localStorage.setItem("bunker-last-seen", now.toString());
    setData({ days, greeting, isFirstVisit: false });
  }, []);

  return data;
}