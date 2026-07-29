"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  skipOnRepeat?: boolean;
}

export default function TypewriterText({
  text,
  speed = 18,
  className = "",
  onComplete,
  skipOnRepeat = true,
}: Props) {
  const [displayed, setDisplayed] = useState("");
  const [skipped, setSkipped] = useState(false);
  const indexRef = useRef(0);
  const key = `vp-typed-${text.slice(0, 40)}`;

  useEffect(() => {
    if (skipOnRepeat) {
      const seen = sessionStorage.getItem(key);
      if (seen) {
        setDisplayed(text);
        onComplete?.();
        return;
      }
    }

    indexRef.current = 0;
    setDisplayed("");
    setSkipped(false);

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        clearInterval(interval);
        sessionStorage.setItem(key, "1");
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, key, onComplete, skipOnRepeat]);

  const handleSkip = () => {
    if (!skipped) {
      setSkipped(true);
      setDisplayed(text);
      sessionStorage.setItem(key, "1");
      onComplete?.();
    }
  };

  return (
    <span onClick={handleSkip} className={`cursor-pointer ${className}`}>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-[#9a8a72] ml-[1px] animate-pulse align-middle" />
      )}
      <span className="sr-only">{text}</span>
    </span>
  );
}