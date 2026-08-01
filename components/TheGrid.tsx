"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface GridNode {
  id: string;
  x: number;
  y: number;
  label: string;
  unlocked: boolean;
  connected: string[];
}

const NODES: GridNode[] = [
  { id: "bunker7", x: 50, y: 50, label: "BUNKER_7", unlocked: true, connected: ["duga", "hashima"] },
  { id: "duga", x: 20, y: 20, label: "DUGA", unlocked: false, connected: ["bunker7", "aokigahara"] },
  { id: "hashima", x: 80, y: 20, label: "HASHIMA", unlocked: false, connected: ["bunker7", "poveglia"] },
  { id: "aokigahara", x: 10, y: 70, label: "AOKIGAHARA", unlocked: false, connected: ["duga"] },
  { id: "poveglia", x: 90, y: 70, label: "POVEGLIA", unlocked: false, connected: ["hashima"] },
  { id: "centralia", x: 50, y: 85, label: "CENTRALIA", unlocked: false, connected: ["aokigahara", "poveglia"] },
  { id: "chernobyl", x: 30, y: 50, label: "CHERNOBYL", unlocked: false, connected: ["duga", "centralia"] },
  { id: "thevoid", x: 65, y: 50, label: "???", unlocked: false, connected: ["chernobyl", "centralia", "bunker7"] },
];

export default function TheGrid() {
  const [discovered, setDiscovered] = useState<string[]>(["bunker7"]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
    const map: Record<string, string> = {
      "duga-radar-array": "duga",
      "hashima-island": "hashima",
      "aokigahara-forest": "aokigahara",
      "poveglia-island": "poveglia",
    };
    const unlocked = ["bunker7"];
    visits.forEach((v: any) => {
      const slug = typeof v === "string" ? v : v.slug;
      if (map[slug] && !unlocked.includes(map[slug])) unlocked.push(map[slug]);
    });
    if (unlocked.length >= 5) unlocked.push("centralia");
    if (unlocked.length >= 6) unlocked.push("chernobyl");
    const breachCount = parseInt(localStorage.getItem("vp-breach-count") || "0", 10);
    if (unlocked.length >= 7 && breachCount >= 3) unlocked.push("thevoid");
    setDiscovered(unlocked);
  }, []);

  const nodes = NODES.map((n) => ({ ...n, unlocked: discovered.includes(n.id) }));
  const selectedNode = nodes.find((n) => n.id === selected);

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((node) =>
          node.unlocked
            ? node.connected.map((targetId) => {
                const target = nodes.find((n) => n.id === targetId);
                if (!target || !target.unlocked) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="rgba(196, 168, 130, 0.15)"
                    strokeWidth="0.3"
                  />
                );
              })
            : null
        )}
      </svg>

      {nodes.map((node) => (
        <motion.button
          key={node.id}
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            borderColor: node.unlocked ? "#c4a882" : "#c4a88220",
            backgroundColor: node.unlocked ? "#c4a88240" : "transparent",
          }}
          whileHover={node.unlocked ? { scale: 1.5 } : {}}
          onClick={() => node.unlocked && setSelected(node.id)}
        >
          <span className="sr-only">{node.label}</span>
        </motion.button>
      ))}

      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-3 border-t text-center"
          style={{ borderColor: "#c4a88230", backgroundColor: "rgba(5,5,5,0.9)" }}
        >
          <p className="text-[10px] uppercase tracking-widest text-[#c4a882]">{selectedNode.label}</p>
          <p className="text-[9px] opacity-50 mt-1">
            {selectedNode.id === "thevoid"
              ? "The grid completes itself. You were the final node."
              : "Signal stable. Connection established."}
          </p>
        </motion.div>
      )}
    </div>
  );
}