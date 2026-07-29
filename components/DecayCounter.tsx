"use client";

import { useState, useEffect } from "react";

interface Props {
  yearAbandoned: number;
}

export default function DecayCounter({ yearAbandoned }: Props) {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const start = new Date(yearAbandoned, 0, 1).getTime();
    const update = () => {
      const now = Date.now();
      setDays(Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    };
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [yearAbandoned]);

  return (
    <span className="text-[10px] font-mono text-[#7a6e5e]">
      {days.toLocaleString()} days of silence
    </span>
  );
}