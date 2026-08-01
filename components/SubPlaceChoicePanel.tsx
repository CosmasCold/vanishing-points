"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubPlace, SubPlaceChoice } from "@/lib/subPlaces";

interface Props {
  subPlace: SubPlace;
  theme: {
    primary: string;
  };
  onConsequence: (lines: string[]) => void;
}

export default function SubPlaceChoicePanel({ subPlace, theme, onConsequence }: Props) {
  const [madeChoices, setMadeChoices] = useState<string[]>([]);
  const [currentChoice, setCurrentChoice] = useState<SubPlaceChoice | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem(`vp-subplace-${subPlace.id}-choices`) || "[]"
    );
    setMadeChoices(saved);
  }, [subPlace.id]);

  const handleChoice = (choice: SubPlaceChoice) => {
    const next = [...madeChoices, choice.id];
    setMadeChoices(next);
    localStorage.setItem(`vp-subplace-${subPlace.id}-choices`, JSON.stringify(next));

    const effect = choice.effect;
    if (effect) {
      switch (effect.type) {
        case "add_item": {
          const inv = JSON.parse(localStorage.getItem("bunker-inventory") || "[]");
          inv.push(effect.value);
          localStorage.setItem("bunker-inventory", JSON.stringify(inv));
          break;
        }
        case "remove_item": {
          const inv = JSON.parse(localStorage.getItem("bunker-inventory") || "[]");
          localStorage.setItem(
            "bunker-inventory",
            JSON.stringify(inv.filter((i: string) => i !== effect.value))
          );
          break;
        }
        case "add_dust": {
          const dustKey = "vp-dust-accumulation";
          const currentDust = parseInt(localStorage.getItem(dustKey) || "0", 10);
          localStorage.setItem(dustKey, String(currentDust + (effect.value as number)));
          break;
        }
        case "add_corruption": {
          const corr = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
          localStorage.setItem("vp-corruption-stage", String(corr + (effect.value as number)));
          window.dispatchEvent(new CustomEvent("atlas-invert"));
          break;
        }
        case "add_encounter": {
          const count = parseInt(localStorage.getItem("bunker-other-count") || "0", 10);
          localStorage.setItem("bunker-other-count", String(count + (effect.value as number)));
          break;
        }
      }
    }

    setCurrentChoice(choice);
    setShowResult(true);
    onConsequence(choice.resultText);
  };

  const availableChoices =
    subPlace.choices?.filter((c) => !madeChoices.includes(c.id)) || [];

  return (
    <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${theme.primary}10` }}>
      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="choices"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {availableChoices.length > 0 ? (
              <>
                <p className="text-[10px] opacity-60">Something requires your attention:</p>
                {availableChoices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice)}
                    className="w-full text-left p-2 border rounded text-[10px] hover:opacity-80 transition-opacity"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    {choice.text}
                  </button>
                ))}
              </>
            ) : (
              <p className="text-[10px] opacity-40 italic">
                This place has nothing left to offer you.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            {currentChoice?.resultText.map((line, i) => (
              <p
                key={i}
                className="text-[10px] opacity-80 border-l-2 pl-2"
                style={{ borderColor: `${theme.primary}30` }}
              >
                {line}
              </p>
            ))}
            <button
              onClick={() => {
                setShowResult(false);
                setCurrentChoice(null);
              }}
              className="text-[9px] opacity-50 hover:opacity-100 pt-1"
            >
              [continue]
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}