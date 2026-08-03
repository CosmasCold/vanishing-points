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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        sessionStorage.setItem(key, "1");
        onComplete?.();
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, key, onComplete, skipOnRepeat]);

  const handleSkip = () => {
    if (skipped || displayed.length >= text.length) return;
    setSkipped(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayed(text);
    sessionStorage.setItem(key, "1");
    onComplete?.();
  };

  return (
    <span onClick={handleSkip} className={`cursor-pointer ${className}`}>
      {displayed}
      {displayed.length < text.length && (
        <span
          className="inline-block align-middle animate-blink"
          style={{
            width: 2,
            height: "1em",
            marginLeft: 1,
            backgroundColor: "#9a8a72",
          }}
        />
      )}
      <span className="sr-only">{text}</span>

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1.1s steps(1) infinite;
        }
      `}</style>
    </span>
  );
}