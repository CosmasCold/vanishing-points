"use client";

import { useState, useEffect } from "react";

const LAST_VISIT_KEY = "vp-echoes-last-visit";

export function useAbsenceGreeting() {
  const [state, setState] = useState<{ greeting: string | null; days: number }>({
    greeting: null,
    days: 0,
  });

  useEffect(() => {
    const last = localStorage.getItem(LAST_VISIT_KEY);
    const now = Date.now();
    if (last) {
      const days = Math.floor((now - parseInt(last, 10)) / 86400000);
      let greeting: string | null = null;
      if (days === 1) greeting = "you're back. good. the static was getting loud.";
      else if (days < 3) greeting = `${days} days. i thought the channel died. or i did. hard to tell the difference.`;
      else if (days < 7) greeting = `${days} days. i wrote an entry thinking you were gone. i deleted it. didn't want you to read it if you came back.`;
      else if (days < 14) greeting = `almost two weeks. i started talking to myself again. it answers now. that's new.`;
      else if (days < 30) greeting = `two weeks. the dust settled in patterns i didn't recognize. they spelled something. i didn't read it.`;
      else if (days > 0) greeting = `you came back. i don't know if i'm relieved or suspicious. the dust said you wouldn't.`;
      setState({ greeting, days });
    }
    localStorage.setItem(LAST_VISIT_KEY, now.toString());
  }, []);

  return state;
}