"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface GridNode {
  id: string;
  x: number;
  y: number;
  label: string;
  unlocked: boolean;
}

const NODES: GridNode[] = [
  { id: "bunker7", x: 50, y: 50, label: "BUNKER_7", unlocked: true },
  { id: "duga", x: 20, y: 20, label: "DUGA", unlocked: false },
  { id: "hashima", x: 80, y: 20, label: "HASHIMA", unlocked: false },
  { id: "aokigahara", x: 10, y: 70, label: "AOKIGAHARA", unlocked: false },
  { id: "poveglia", x: 90, y: 70, label: "POVEGLIA", unlocked: false },
  { id: "centralia", x: 50, y: 85, label: "CENTRALIA", unlocked: false },
  { id: "chernobyl", x: 30, y: 50, label: "CHERNOBYL", unlocked: false },
  { id: "thevoid", x: 70, y: 50, label: "???", unlocked: false },
];

const CORRECT_PATH = ["duga", "chernobyl", "centralia", "thevoid"];

export default function TheGrid() {
  const [discovered, setDiscovered] = useState<string[]>(["bunker7"]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [drawnLines, setDrawnLines] = useState<[string, string][]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

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

  const handleNodeClick = useCallback(
        (nodeId: string) => {
      if (!selectedNode) {
        setSelectedNode(nodeId);
        setMessage(null);
        return;
      }
      if (selectedNode === nodeId) {
        setSelectedNode(null);
        return;
      }
      const newLine: [string, string] = [selectedNode, nodeId];
      const reverseLine: [string, string] = [nodeId, selectedNode];
      const alreadyDrawn = drawnLines.some(
        (l) =>
          (l[0] === newLine[0] && l[1] === newLine[1]) ||
          (l[0] === reverseLine[0] && l[1] === reverseLine[1])
      );
      if (alreadyDrawn) {
        setSelectedNode(null);
        return;
      }
      const nextLines = [...drawnLines, newLine];
      setDrawnLines(nextLines);
      setSelectedNode(null);

      // Validate path: duga → chernobyl → centralia → thevoid
      const pathString = nextLines.map((l) => l.join("→")).join(",");
      const isCorrect =
        pathString.includes("duga→chernobyl") &&
        pathString.includes("chernobyl→centralia") &&
        pathString.includes("centralia→thevoid");

      if (isCorrect && !solved) {
        setSolved(true);
        setMessage(
          "The grid aligns. Coordinates: 38°74'N, 000°00'E. The ocean floor. The door opens."
        );
        localStorage.setItem("vp-grid-solved", "true");
        window.dispatchEvent(new CustomEvent("atlas-invert"));
      } else if (nextLines.length > 4 && !isCorrect) {
        const wrong = parseInt(localStorage.getItem("vp-grid-wrong") || "0", 10) + 1;
        localStorage.setItem("vp-grid-wrong", String(wrong));
        window.dispatchEvent(new CustomEvent("breach-triggered"));
        setMessage("The grid rejects this connection. The static surges.");
      }
    },
    [selectedNode, drawnLines, solved]
  );

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {drawnLines.map(([from, to], i) => {
          const n1 = nodes.find((n) => n.id === from);
          const n2 = nodes.find((n) => n.id === to);
          if (!n1 || !n2) return null;
          return (
            <line
              key={i}
              x1={n1.x}
              y1={n1.y}
              x2={n2.x}
              y2={n2.y}
              stroke={solved ? "#33ff00" : "#c4a882"}
              strokeWidth="0.5"
              opacity={0.6}
            />
          );
        })}
      </svg>

      {nodes.map((node) => (
        <motion.button
          key={node.id}
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            borderColor:
              selectedNode === node.id
                ? "#fff"
                : node.unlocked
                ? "#c4a882"
                : "#c4a88220",
            backgroundColor:
              selectedNode === node.id
                ? "#fff"
                : node.unlocked
                ? "#c4a88240"
                : "transparent",
          }}
          whileHover={node.unlocked ? { scale: 1.5 } : {}}
          onClick={() => node.unlocked && handleNodeClick(node.id)}
        >
          <span className="sr-only">{node.label}</span>
        </motion.button>
      ))}

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-3 border-t text-center"
          style={{ borderColor: "#c4a88230", backgroundColor: "rgba(5,5,5,0.9)" }}
        >
          <p className="text-[10px] uppercase tracking-widest text-[#c4a882]">
            {solved ? "GRID ALIGNED" : "ANOMALY"}
          </p>
          <p className="text-[9px] opacity-70 mt-1">{message}</p>
        </motion.div>
      )}
    </div>
  );
}