 "use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpRight,
  FileText,
  Filter,
  Headphones,
  Image as ImageIcon,
  Link2,
  ListFilter,
  Maximize2,
  Search,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Timer,
  Pause,
  Play,
  Volume2,
  X,
} from "lucide-react";
import { useAtlasStore } from "@/state/atlasStore";
import { useAudioStore } from "@/state/audioStore";
import { useEvidenceBoardStore } from "@/state/evidenceBoardStore";
import { useInvestigationStore } from "@/state/investigationStore";
import { useProgressionStore } from "@/state/progressionStore";
import { getExposure } from "@/data/exposures";
import { performExposure } from "@/logic/progression/exposure";
import { useArtifactStore } from "@/state/artifactStore";
import type { SignalArtifact } from "@/components/signals/SignalModal";
import { ACT_I_CASES } from "@/data/act1Cases";
import type { Place } from "@/types/places";
import type { EvidenceItem } from "@/types/investigation";


type ArchiveStampProps = {
  label: string;
  variant?: "archived" | "provisional" | "restricted" | "unverified" | "review";
  className?: string;
  rotate?: number;
};

function ArchiveStamp({
  label,
  variant = "archived",
  className = "",
  rotate = -3,
}: ArchiveStampProps) {
  const filterId = `stamp-distress-${variant}`;

  const geometry = {
    archived: { width: 230, height: 72, fontSize: 29, border: 7, opacity: 0.70 },
    provisional: { width: 250, height: 78, fontSize: 28, border: 6, opacity: 0.58 },
    restricted: { width: 250, height: 78, fontSize: 29, border: 8, opacity: 0.72 },
    unverified: { width: 250, height: 78, fontSize: 27, border: 6, opacity: 0.54 },
    review: { width: 290, height: 78, fontSize: 25, border: 6, opacity: 0.58 },
  }[variant];

  const ink = "#713b2d";

  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        mixBlendMode: "multiply",
        opacity: geometry.opacity,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        className="block w-full h-auto overflow-visible"
        role="presentation"
      >
        <defs>
          <filter id={filterId} x="-8%" y="-14%" width="116%" height="128%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035 0.12"
              numOctaves="2"
              seed={variant.length * 17}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.4"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />
            <feGaussianBlur in="warped" stdDeviation="0.16" />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`} fill="none" stroke={ink}>
          <rect
            x={geometry.border / 2}
            y={geometry.border / 2}
            width={geometry.width - geometry.border}
            height={geometry.height - geometry.border}
            rx="3"
            strokeWidth={geometry.border}
            strokeDasharray={variant === "provisional" ? "155 8 38 5 90 7" : "310 5 74 4 190 6"}
          />
          <rect
            x={geometry.border + 7}
            y={geometry.border + 7}
            width={geometry.width - (geometry.border + 7) * 2}
            height={geometry.height - (geometry.border + 7) * 2}
            rx="1"
            strokeWidth="2.2"
            strokeDasharray="210 6 46 5 120 4"
            opacity=".72"
          />
          <text
            x={geometry.width / 2}
            y={geometry.height / 2 + geometry.fontSize * 0.34}
            textAnchor="middle"
            fill={ink}
            stroke={ink}
            strokeWidth="0.45"
            paintOrder="stroke"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize={geometry.fontSize}
            fontWeight="700"
            letterSpacing={variant === "review" ? "2.2" : "2.8"}
          >
            {label}
          </text>
        </g>
      </svg>
    </div>
  );
}

const STELMO_CASE_SLUG = "stelmo-light";
const STATION_LAYOUT_VERSION = "carrel-7b-desk-v10";
const layoutKey = (id: string) => `${STATION_LAYOUT_VERSION}:${id}`;

const VANCE_SIGNAL: SignalArtifact = {
  id: "vance-lighthouse",
  title: "Cassette: Keeper's Final Log",
  source: "E. Vance, Lighthouse Service (Ret.) — St. Elmo Light",
  length: "2:15",
  dustUnlock: 12,
  description: "Forty years keeping the light. Then the lamp began lighting itself.",
  mediaUrl: "/audio/vance/vance-lighthouse.mp3",
  transcript: [
    "[00:00] [Ocean. Wind. A kettle whistling.]",
    "VANCE: Testing. This is Edward Vance, St. Elmo Light. Date is... well, the calendar says March, but the gulls haven't left yet.",
    "[00:22] [He chuckles. Paper rustles.]",
    "VANCE: Forty years I kept this light. Never missed a night. Then last Tuesday, I woke up and the lamp was already lit.",
    "[00:52] [Pause. He sips something.]",
    "VANCE: I know what you are thinking. Old man, bad memory. But I remember every ship that passed. I do not remember lighting that lamp.",
    "[01:28] [Wind increases. A door latch rattles.]",
    "VANCE: The light's doing its job without me now. I think maybe it always was.",
    "[02:00] [He sets down the cup.]",
    "VANCE: If someone finds this—tell them the light still works. That's all. That's enough.",
  ],
};

const INITIAL_HYPOTHESIS = {
  id: "hyp-physical-record-drift",
  title: "PHYSICAL RECORD DRIFT",
  description:
    "The documented history of a physical process may no longer correspond to the physical state that produced it.",
  confidence: 0,
  completed: false,
  contradictionText:
    "Keeper Edward Vance documented forty years of personally maintaining the light. The lamp nevertheless performed its function without the action that historically caused it.",
};

type StationItem = {
  id: string;
  kind: "place" | "evidence" | "media" | "hypothesis";
  title: string;
  subtitle: string;
  typeLabel: string;
  description: string;
  status?: string;
  source?: string;
  date?: string;
  image?: string;
  evidence?: EvidenceItem;
  place?: Place;
  artifactId?: string;
};

type DragState = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const kindIcon = (kind: StationItem["kind"], hasArtifact = false) => {
  if (kind === "place") return <ImageIcon size={13} />;
  if (kind === "media") return <Headphones size={13} />;
  if (kind === "hypothesis") return <Sparkles size={13} />;
  if (hasArtifact) return <Archive size={13} />;
  return <FileText size={13} />;
};

const statusLabel = (item: StationItem) => {
  if (item.kind === "hypothesis") {
    if (item.status === "confirmed") return "CONFIRMED";
    if (item.status === "supported") return "SUPPORTED";
    if (item.status === "contradicted") return "CONTRADICTED";
    return "PROVISIONAL";
  }
  return item.status?.toUpperCase() || "DISCOVERED";
};

const statusTone = (item: StationItem) => {
  if (item.kind === "hypothesis") return "#b89455";
  if ((item.status || "").toLowerCase().includes("rejected")) return "#8e6258";
  if ((item.status || "").toLowerCase().includes("verified")) return "#9eae96";
  return "#817565";
};

const defaultPositions = [
  { x: 11, y: 56, rotate: -1.6 },
  { x: 34, y: 63, rotate: 0.8 },
  { x: 59, y: 58, rotate: 1.3 },
  { x: 22, y: 68, rotate: 0.9 },
  { x: 45, y: 69, rotate: -0.8 },
];

const PaperObject = React.memo(function PaperObject({
  item,
  index,
  selected,
  isDragging,
  position,
  onSelect,
  onExamine,
  onDragStart,
  onDragEnd,
  isPlaying,
}: {
  item: StationItem;
  index: number;
  selected: boolean;
  isDragging: boolean;
  position: { x: number; y: number };
  onSelect: (id: string) => void;
  onExamine: (id: string) => void;
  onDragStart: (event: React.PointerEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
  isPlaying: boolean;
}) {
  const rotate = defaultPositions[index % defaultPositions.length].rotate;
  const isHypothesis = item.kind === "hypothesis";
  const isMedia = item.kind === "media";

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: isHypothesis ? 202 : isMedia ? 292 : 188,
        zIndex: isDragging ? 90 : selected ? 80 : 10 + index,
      }}
      animate={{
        scale: isDragging ? 1.015 : selected ? 1.008 : 1,
        y: isDragging ? -10 : selected ? -5 : 0,
        rotate: selected ? 0 : rotate,
      }}
      transition={{ duration: isDragging ? 0.08 : 0.18, ease: [0.2, 0.75, 0.25, 1] }}
    >
      <div
        onClick={() => onSelect(item.id)}
        onDoubleClick={() => onExamine(item.id)}
        onPointerDown={(event) => onDragStart(event, item.id)}
        onPointerUp={onDragEnd}
        className="relative cursor-grab select-none active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <div
          className="relative overflow-hidden border"
          style={{
            minHeight: isHypothesis ? 134 : isMedia ? 184 : 126,
            background: isHypothesis
              ? "linear-gradient(145deg, rgba(54,42,28,.98), rgba(22,17,12,.99))"
              : isMedia
                ? "linear-gradient(135deg, #181513 0%, #0d0c0a 100%)"
                : "linear-gradient(145deg, #e0d5bd, #c0b295)",
            borderColor: selected ? "#c9a65d" : isHypothesis ? "#665039" : isMedia ? "#2d2924" : "#756650",
            boxShadow: isDragging
              ? "0 22px 34px rgba(0,0,0,.64), 0 0 0 1px rgba(201,166,93,.22), inset 0 1px rgba(255,255,255,.34)"
              : selected
              ? "0 14px 25px rgba(0,0,0,.60), 0 0 0 1px rgba(201,166,93,.22), inset 0 1px rgba(255,255,255,.34)"
              : "0 5px 12px rgba(0,0,0,.42), 0 2px 4px rgba(0,0,0,.24), inset 0 1px rgba(255,255,255,.30)",
          }}
        >
          {isMedia ? (
            <div
              className="relative overflow-hidden"
              style={{
                height: "184px",
                background: "linear-gradient(145deg, #24201b 0%, #11100e 42%, #080807 100%)",
                boxShadow: "0 10px 18px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -5px 10px rgba(0,0,0,0.72), inset 0 0 22px rgba(0,0,0,0.9)",
                transformStyle: "preserve-3d",
                border: "1px solid #302b25",
                borderRight: "3px solid #14120f",
                borderBottom: "5px solid #0d0c0a",
                borderRadius: "4px",
              }}
            >
              {/* Matte plastic texture */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-screen"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Brass fasteners */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#8c7456] opacity-60 border border-black/40" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#8c7456] opacity-60 border border-black/40" />
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[#8c7456] opacity-60 border border-black/40" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-[#8c7456] opacity-60 border border-black/40" />

              {/* Weathered paper cassette label */}
              <div
                className="absolute left-5 right-5 top-5 h-[94px] border border-[#a69c84]/40"
                style={{
                  background: "linear-gradient(180deg, #ece5d3 0%, #ded6bf 100%)",
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8), 0 3px 6px rgba(0,0,0,0.3)",
                  borderRadius: "3px",
                }}
              >
                <div className="absolute left-0 right-0 top-3 h-[2px] bg-[#994f4f]/30" />
                <div className="absolute left-0 right-0 top-[20px] h-[1px] bg-[#5c7b8f]/30" />

                <div className="absolute top-6 left-3 text-[7px] font-mono font-bold text-[#615447] tracking-widest leading-none">
                  CASSETTE TAPE • SIDE A
                </div>
                <div
                  className="absolute left-3 right-3 top-[34px] text-[10px] font-bold text-[#2a2218] tracking-tight truncate border-b border-[#a89a81]/40 pb-0.5"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {item.title}
                </div>
                <div className="absolute left-3 right-3 top-[52px] text-[7.5px] font-mono text-[#5a4c3f] truncate opacity-90 leading-tight">
                  {item.subtitle || item.source || "No secondary metadata."}
                </div>

                {/* Clear acrylic spool window */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-[67px] w-[128px] h-[27px] border border-[#23201a] flex items-center justify-between px-4"
                  style={{
                    background: "linear-gradient(180deg, #090807 0%, #151311 100%)",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.9), 0 1px 1px rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                  }}
                >
                  <div className="relative w-5 h-5 rounded-full flex items-center justify-center bg-[#1e1b18] border border-black/80 shadow-[0_1px_2px_rgba(255,255,255,0.05)]">
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: isPlaying ? "26px" : "32px",
                        height: isPlaying ? "26px" : "32px",
                        background: "radial-gradient(circle, transparent 35%, #2a1b14 36%, #41261d 95%, #15110d 96%)",
                        zIndex: -1,
                        opacity: 0.85,
                        transition: "width 2s, height 2s",
                      }}
                    />
                    <motion.svg
                      className="w-4 h-4 text-[#9a8d78] fill-current"
                      viewBox="0 0 20 20"
                      animate={isPlaying ? { rotate: 360 } : {}}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    >
                      <path d="M10 0a10 10 0 1010 10A10 10 0 0010 0zm0 17a7 7 0 117-7 7 7 0 01-7 7z" />
                      <rect x="9" y="1" width="2" height="18" rx="0.5" />
                      <rect x="1" y="9" width="18" height="2" rx="0.5" />
                    </motion.svg>
                  </div>

                  <div className="relative w-5 h-5 rounded-full flex items-center justify-center bg-[#1e1b18] border border-black/80 shadow-[0_1px_2px_rgba(255,255,255,0.05)]">
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: isPlaying ? "32px" : "26px",
                        height: isPlaying ? "32px" : "26px",
                        background: "radial-gradient(circle, transparent 35%, #2a1b14 36%, #41261d 95%, #15110d 96%)",
                        zIndex: -1,
                        opacity: 0.85,
                        transition: "width 2s, height 2s",
                      }}
                    />
                    <motion.svg
                      className="w-4 h-4 text-[#9a8d78] fill-current"
                      viewBox="0 0 20 20"
                      animate={isPlaying ? { rotate: 360 } : {}}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    >
                      <path d="M10 0a10 10 0 1010 10A10 10 0 0010 0zm0 17a7 7 0 117-7 7 7 0 01-7 7z" />
                      <rect x="9" y="1" width="2" height="18" rx="0.5" />
                      <rect x="1" y="9" width="18" height="2" rx="0.5" />
                    </motion.svg>
                  </div>
                </div>
              </div>

              {/* Molded shell bevel / edge catch light */}
              <div
                className="absolute inset-[5px] pointer-events-none rounded-[3px]"
                style={{
                  border: "1px solid rgba(255,255,255,.055)",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,.45), inset 0 2px 7px rgba(255,255,255,.035)",
                }}
              />

              {/* Lower mechanical guide */}
              <div
                className="absolute bottom-0 left-[42px] right-[42px] h-[18px] border-t border-[#1a1816]"
                style={{ background: "#11100f", clipPath: "polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)" }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-[58px] h-[3px] bg-[#050403] rounded-full" />
              </div>

              {/* Reflected light across plastic */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0.015) 46%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 55%)",
                }}
              />
            </div>
          ) : (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: 0.58,
                  background:
                    "repeating-linear-gradient(0deg, rgba(65,45,28,.035) 0 1px, transparent 1px 4px)",
                }}
              />

              {item.kind === "place" && item.place?.photos?.[0] ? (
                <div className="m-3 border border-black/30 overflow-hidden" style={{ height: 112, background: "#17130f" }}>
                  <img
                    src={item.place.photos[0]}
                    alt={item.place.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    style={{ filter: "sepia(.2) contrast(1.07) brightness(.84) saturate(.78)" }}
                  />
                </div>
              ) : item.kind === "place" ? (
                <div className="m-3 h-[112px] flex items-center justify-center border border-black/20 bg-black/10 font-mono text-[8px] tracking-[.18em] text-[#625949]">
                  NO PHOTOGRAPH
                </div>
              ) : (
                <div className="mx-3 mt-3 h-7 flex items-center justify-between border-b" style={{ borderColor: isHypothesis ? "rgba(201,166,93,.2)" : "rgba(55,43,28,.2)" }}>
                  <span
                    className="font-mono text-[7px] tracking-[.16em] uppercase"
                    style={{ color: isHypothesis ? "#c9a65d" : "#705b3b" }}
                  >
                    {item.typeLabel}
                  </span>
                  <StickyNote size={11} style={{ color: "#806c50" }} />
                </div>
              )}

              <div className="relative px-4 pb-4 pt-2.5">
                {item.kind === "place" && (
                  <div className="font-mono text-[7px] tracking-[.16em] uppercase" style={{ color: "#705b3b" }}>
                    {item.typeLabel}
                  </div>
                )}
                <div
                  className="mt-1 font-serif font-semibold text-[14px] leading-tight"
                  style={{ color: isHypothesis ? "#ded1bc" : "#2b231a" }}
                >
                  {item.title}
                </div>
                <div
                  className="mt-2 font-serif text-[9px] leading-[1.5] line-clamp-3"
                  style={{ color: isHypothesis ? "#a79b8a" : "#51483c" }}
                >
                  {item.description}
                </div>
                <div
                  className="mt-3 pt-2 border-t flex items-center justify-between gap-2 font-mono text-[7px] uppercase tracking-[.1em]"
                  style={{
                    borderColor: isHypothesis ? "rgba(201,166,93,.2)" : "rgba(55,43,28,.2)",
                    color: isHypothesis ? "#766c60" : "#6a5e4d",
                  }}
                >
                  <span>{item.subtitle}</span>
                  <span style={{ color: statusTone(item) }}>{statusLabel(item)}</span>
                  {selected && <Maximize2 size={9} />}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export const EvidenceBoard: React.FC = () => {
  const { places, selectPlace } = useAtlasStore();
  const { click } = useAudioStore();
  const { evidence } = useInvestigationStore();
  const {
    dustIndex,
    boardConnections,
    discoveredEvidenceIds,
    analysedEvidenceIds,
    hypotheses: progressionHypotheses,
    hypothesisEvidence,
    contradictions,
    sessionCount,
    addEvidence: discoverEvidence,
    markEvidenceAnalysed,
    markMediaListened,
    markMediaAnalysed,
    addHypothesisEvidence,
    setHypothesis,
    setKnowledge,
    addContradiction,
    resolveContradiction,
    completeCase,
  } = useProgressionStore();
  const { inventory: artifactInventory, openArtifact } = useArtifactStore();
  const {
    playerEdges,
    discoveredEdges,
    nodePositions,
    workspaceEvidenceIds,
    addToWorkspace,
    removeFromWorkspace,
    setNodePosition,
    selectNode,
    setFocusNode,
    setViewMode,
  } = useEvidenceBoardStore();

  const [view, setView] = useState<"workspace" | "archive" | "timeline">("workspace");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | StationItem["kind"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(workspaceEvidenceIds?.[0] || STELMO_CASE_SLUG);
  const [selectedSignal, setSelectedSignal] = useState<SignalArtifact | null>(null);
  const [examinationId, setExaminationId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const signalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [signalPlaying, setSignalPlaying] = useState(false);
  const [signalTime, setSignalTime] = useState(0);
  const [signalDuration, setSignalDuration] = useState(135);
  const [deskMemory, setDeskMemory] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);

  const visiblePlaces = useMemo(
    () =>
      places.filter(
        (place) =>
          place.status !== "rejected" &&
          ACT_I_CASES.some((caseSpec) => caseSpec.slug === place.slug),
      ),
    [places],
  );

  const stElmoEvidence = useMemo(() => {
    const live = Object.values(evidence)
      .flat()
      .filter(
        (item) =>
          item.id === "doc-stelmo-001" ||
          item.id === "evidence-stelmo-mechanical-exposure",
      );

    const hasSource = live.some((item) => item.id === "doc-stelmo-001");
    if (hasSource) return live;

    const source = {
      id: "doc-stelmo-001",
      title: "Keeper's Log",
      description:
        "Edward Vance's final recorded log from St. Elmo Light Station.",
      type: "document",
      status: "available",
      source: "St. Elmo Light Station Archive",
      timestamp: "1942-03-14",
      relatedTo: [],
    } as (typeof live)[number];

    return [source, ...live];
  }, [evidence]);

  const canonicalHypothesisState = progressionHypotheses[INITIAL_HYPOTHESIS.id];
  const canonicalHypothesisEvidence = hypothesisEvidence[INITIAL_HYPOTHESIS.id] ?? [];
  const canonicalContradiction = contradictions["contradiction-stelmo-physical-record"];
  const canonicalHypothesisConfidence =
    canonicalHypothesisState === "confirmed"
      ? 100
      : canonicalHypothesisState === "contradicted"
        ? 60
        : canonicalHypothesisState === "supported"
          ? 70
          : canonicalHypothesisEvidence.length > 0
            ? Math.min(99, canonicalHypothesisEvidence.length * 50)
            : 0;

  const items = useMemo<StationItem[]>(() => {
    const result: StationItem[] = [];
    const place = visiblePlaces.find((candidate) => candidate.slug === STELMO_CASE_SLUG);

    if (place) {
      result.push({
        id: place.slug,
        kind: "place",
        title: place.name,
        subtitle: place.address?.formatted || "OREGON COAST",
        typeLabel: "CASE ANCHOR // LOCATION",
        description:
          "The geographic anchor for the St. Elmo investigation. Place context remains authoritative in the Atlas.",
        status: place.status,
        image: place.photos?.[0],
        place,
      });
    }

    for (const caseSpec of ACT_I_CASES) {
      if (caseSpec.slug === STELMO_CASE_SLUG) continue;
      const casePlace = visiblePlaces.find((candidate) => candidate.slug === caseSpec.slug);
      if (!casePlace) continue;

      result.push({
        id: casePlace.slug,
        kind: "place",
        title: caseSpec.name,
        subtitle: casePlace.address?.formatted || "ACT I CASE",
        typeLabel: "CASE ANCHOR // LOCATION",
        description: caseSpec.primaryAnomaly.statement,
        status: casePlace.status,
        image: casePlace.photos?.[0],
        place: casePlace,
      });
    }

    for (const item of stElmoEvidence) {
      result.push({
        id: item.id,
        kind: "evidence",
        title: item.title,
        subtitle: item.timestamp || item.status.toUpperCase(),
        typeLabel: `${item.type.toUpperCase()} // EVIDENCE`,
        description: item.description,
        status: item.status,
        source: item.source,
        date: item.timestamp,
        evidence: item,
        artifactId:
          item.id === "evidence-stelmo-mechanical-exposure"
            ? "art-vance-cassette"
            : undefined,
      });
    }

    if (dustIndex >= VANCE_SIGNAL.dustUnlock) {
      result.push({
        id: VANCE_SIGNAL.id,
        kind: "media",
        title: VANCE_SIGNAL.title,
        subtitle: `${VANCE_SIGNAL.length} // AUDIO`,
        typeLabel: "ARCHIVAL MEDIA // SIGNAL",
        description: VANCE_SIGNAL.description,
        source: VANCE_SIGNAL.source,
        artifactId: artifactInventory.find((artifact) => artifact.id === "art-vance-cassette")?.id,
      });
    }

    result.push({
      id: INITIAL_HYPOTHESIS.id,
      kind: "hypothesis",
      title: INITIAL_HYPOTHESIS.title,
      subtitle: `${canonicalHypothesisConfidence}% CONFIDENCE`,
      typeLabel: "WORKING HYPOTHESIS",
      description: INITIAL_HYPOTHESIS.description,
      status: canonicalHypothesisState || "provisional",
    });

    return result;
  }, [
    visiblePlaces,
    stElmoEvidence,
    dustIndex,
    artifactInventory,
    canonicalHypothesisState,
    canonicalHypothesisConfidence,
  ]);

  const filteredArchive = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const kindMatch = filter === "all" || item.kind === filter;
      const text = `${item.title} ${item.description} ${item.typeLabel} ${item.subtitle}`.toLowerCase();
      return kindMatch && (!needle || text.includes(needle));
    });
  }, [items, search, filter]);

  const workspaceIds = workspaceEvidenceIds?.length
    ? workspaceEvidenceIds
    : ["stelmo-light", "doc-stelmo-001", "hyp-physical-record-drift"];

  const workspaceItems = useMemo(
    () =>
      workspaceIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as StationItem[],
    [workspaceIds, items],
  );

  const selectedItem =
    items.find((item) => item.id === selectedId) ||
    workspaceItems[0] ||
    items[0];

  const positionFor = useCallback(
    (id: string, index: number) => {
      const saved = nodePositions[layoutKey(id)];
      if (saved) {
        return {
          x: (saved.x / 900) * 100,
          y: (saved.y / 600) * 100,
        };
      }
      const fallback = defaultPositions[index % defaultPositions.length];
      return { x: fallback.x, y: fallback.y };
    },
    [nodePositions],
  );

  const selectItem = useCallback(
    (id: string) => {
      click();
      setSelectedId(id);
      selectNode(id);
      setFocusNode(id);
      setViewMode("detail");
      const item = items.find((candidate) => candidate.id === id);
      if (item?.kind === "place") selectPlace(id);
    },
    [click, items, selectNode, setFocusNode, setViewMode, selectPlace],
  );

  const onDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, id: string) => {
      const item = items.find((candidate) => candidate.id === id);
      if (!item || !boardRef.current) return;

      const position = positionFor(
        id,
        Math.max(
          0,
          workspaceItems.findIndex((candidate) => candidate.id === id),
        ),
      );

      const rect = boardRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      setDragState({
        id,
        pointerId: event.pointerId,
        startX: x,
        startY: y,
        originX: position.x,
        originY: position.y,
      });

      setSelectedId(id);
      selectNode(id);
    },
    [items, positionFor, workspaceItems, selectNode],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState || dragState.pointerId !== event.pointerId || !boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      const nextX = Math.max(8, Math.min(67, dragState.originX + (x - dragState.startX)));
      const nextY = Math.max(53, Math.min(70, dragState.originY + (y - dragState.startY)));

      setNodePosition(layoutKey(dragState.id), {
        x: (nextX / 100) * 900,
        y: (nextY / 100) * 600,
      });
    },
    [dragState, setNodePosition],
  );

  const onPointerUp = useCallback(() => {
    if (dragState) setDeskMemory((value) => value + 1);
    setDragState(null);
  }, [dragState]);

  useEffect(() => {
    const handleWindowUp = () => setDragState(null);
    window.addEventListener("pointerup", handleWindowUp);
    return () => window.removeEventListener("pointerup", handleWindowUp);
  }, []);

  const addEvidence = (id: string) => {
    addToWorkspace(id);
    setSelectedId(id);
    click();
  };

  const removeSelected = () => {
    if (!selectedItem) return;
    removeFromWorkspace(selectedItem.id);
    setSelectedId(
      workspaceItems.find((item) => item.id !== selectedItem.id)?.id || null,
    );
  };

  const openMedia = () => {
    if (!selectedItem || selectedItem.id !== VANCE_SIGNAL.id) return;
    click();
    setSelectedSignal(VANCE_SIGNAL);
  };

  const verifyStElmoSource = () => {
    const id = "doc-stelmo-001";
    discoverEvidence(id);
    markEvidenceAnalysed(id);
    setSelectedId(id);
    click();
  };

  const exposeStElmo = () => {
    const exposure = getExposure("stelmo-mechanical-exposure");
    if (!exposure) return;

    const result = performExposure(exposure);
    if (!result.success || !result.resultEvidenceId) return;

    const resultEvidenceId = result.resultEvidenceId;
    discoverEvidence(resultEvidenceId);
    markEvidenceAnalysed(resultEvidenceId);
    addToWorkspace(resultEvidenceId);
    setSelectedId(resultEvidenceId);
    click();
  };

  const supportPhysicalRecordDrift = () => {
    const source = "doc-stelmo-001";
    const result = "evidence-stelmo-mechanical-exposure";

    if (!discoveredEvidenceIds.includes(source) || !discoveredEvidenceIds.includes(result)) return;

    addHypothesisEvidence(INITIAL_HYPOTHESIS.id, source);
    addHypothesisEvidence(INITIAL_HYPOTHESIS.id, result);
    setHypothesis(INITIAL_HYPOTHESIS.id, "supported");
    setKnowledge(INITIAL_HYPOTHESIS.id, "known", [source, result]);
    setSelectedId(INITIAL_HYPOTHESIS.id);
    click();
  };

  const filePhysicalRecordContradiction = () => {
    const source = "doc-stelmo-001";
    const result = "evidence-stelmo-mechanical-exposure";

    if (progressionHypotheses[INITIAL_HYPOTHESIS.id] !== "supported") return;

    addContradiction({
      id: "contradiction-stelmo-physical-record",
      status: "unresolved",
      sourceIds: [source, result],
      discoveredAtSession: sessionCount,
      hypothesisId: INITIAL_HYPOTHESIS.id,
    });
    setHypothesis(INITIAL_HYPOTHESIS.id, "contradicted");
    setKnowledge(INITIAL_HYPOTHESIS.id, "suspected", [source, result]);
    setSelectedId(INITIAL_HYPOTHESIS.id);
    click();
  };

  const resolvePhysicalRecordContradiction = () => {
    if (!canonicalContradiction || canonicalContradiction.status !== "unresolved") return;

    const resolved = resolveContradiction("contradiction-stelmo-physical-record", "resolved");
    if (!resolved) return;

    setHypothesis(INITIAL_HYPOTHESIS.id, "supported");
    setKnowledge(
      INITIAL_HYPOTHESIS.id,
      "known",
      canonicalHypothesisEvidence.length > 0
        ? canonicalHypothesisEvidence
        : ["doc-stelmo-001", "evidence-stelmo-mechanical-exposure"],
    );
    click();
  };

  const archiveStElmo = () => {
    const source = "doc-stelmo-001";
    const result = "evidence-stelmo-mechanical-exposure";
    const contradictionResolved =
      canonicalContradiction?.status === "resolved" || canonicalContradiction?.status === "accepted";

    if (!discoveredEvidenceIds.includes(source) || !discoveredEvidenceIds.includes(result)) return;
    if (!canonicalHypothesisEvidence.includes(source) || !canonicalHypothesisEvidence.includes(result)) return;
    if (!contradictionResolved) return;

    setHypothesis(INITIAL_HYPOTHESIS.id, "confirmed");
    setKnowledge(INITIAL_HYPOTHESIS.id, "confirmed", [source, result]);
    completeCase(STELMO_CASE_SLUG, INITIAL_HYPOTHESIS.id);
    setSelectedId(INITIAL_HYPOTHESIS.id);
    click();
  };

  const recordListeningObservation = () => {
    markMediaListened(VANCE_SIGNAL.id);
    markMediaAnalysed(VANCE_SIGNAL.id);
    click();
  };

  const examinePhysicalCassette = () => {
    if (!selectedItem || selectedItem.id !== VANCE_SIGNAL.id) return;
    const artifact = artifactInventory.find((candidate) => candidate.id === "art-vance-cassette");
    if (!artifact) return;
    click();
    openArtifact(artifact);
  };

  const examineSelected = () => {
    if (!selectedItem) return;
    click();

    if (selectedItem.kind === "media") {
      setSelectedSignal(VANCE_SIGNAL);
      return;
    }

    if (selectedItem.artifactId) {
      const artifact = artifactInventory.find((candidate) => candidate.id === selectedItem.artifactId);
      if (artifact) {
        openArtifact(artifact);
        return;
      }
    }

    setExaminationId(selectedItem.id);
  };

  const examineItem = useCallback((id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;

    setSelectedId(id);
    click();

    if (item.kind === "media") {
      setSelectedSignal(VANCE_SIGNAL);
      return;
    }

    if (item.artifactId) {
      const artifact = artifactInventory.find((candidate) => candidate.id === item.artifactId);
      if (artifact) {
        openArtifact(artifact);
        return;
      }
    }

    setExaminationId(id);
  }, [artifactInventory, click, items, openArtifact]);

  const toggleSignalPlayback = async () => {
    const audio = signalAudioRef.current;
    if (!audio) return;
    click();
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const formatSignalTime = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
  };

  const relatedItems = useMemo(() => {
    if (!selectedItem) return [];

    const edges = [...discoveredEdges, ...playerEdges];
    const relatedIds = new Set<string>();

    for (const edge of edges) {
      if (edge.source === selectedItem.id) relatedIds.add(edge.target);
      if (edge.target === selectedItem.id) relatedIds.add(edge.source);
    }

    for (const connection of boardConnections) {
      if (connection.includes(selectedItem.id)) {
        const parts = connection.split("::");
        parts.forEach((part) => {
          if (part !== selectedItem.id) relatedIds.add(part);
        });
      }
    }

    return Array.from(relatedIds)
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean) as StationItem[];
  }, [selectedItem, discoveredEdges, playerEdges, boardConnections, items]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        color: "#d5c7ad",
        backgroundImage:
          "linear-gradient(180deg, rgba(7,5,3,.12), rgba(7,5,3,.04) 48%, rgba(7,5,3,.10)), url('/images/evidence-station.png')",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#120d09",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,.12), transparent 20%, transparent 72%, rgba(0,0,0,.14))",
        }}
      />

      <header
        className="absolute inset-x-0 top-0 z-40 h-[58px] border-b flex items-center"
        style={{
          background: "linear-gradient(180deg, rgba(17,12,8,.92), rgba(10,8,6,.86))",
          borderColor: "rgba(148,120,75,.28)",
          boxShadow: "0 7px 18px rgba(0,0,0,.4)",
        }}
      >
        <div className="px-5 flex items-center gap-3 min-w-[275px] border-r h-full" style={{ borderColor: "rgba(148,120,75,.2)" }}>
          <Archive size={17} style={{ color: "#c9a65d" }} />
          <div>
            <div className="font-mono text-[9px] tracking-[.2em] text-[#c9a65d]">
              EVIDENCE STATION
            </div>
            <div className="font-serif text-[12px] text-[#9c9181]">
              Investigator's working desk
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          {(["workspace", "archive", "timeline"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className="px-3 py-2 font-mono text-[8px] uppercase tracking-[.13em] border transition-colors"
              style={{
                color: view === mode ? "#e0c17b" : "#766c5d",
                borderColor: view === mode ? "rgba(201,166,93,.35)" : "transparent",
                background: view === mode ? "rgba(201,166,93,.08)" : "transparent",
              }}
            >
              {mode === "workspace" ? "Desk" : mode === "archive" ? "Archive Drawer" : "Chronology"}
            </button>
          ))}
        </div>

        <div className="ml-auto px-5 flex items-center gap-5 font-mono text-[8px] uppercase tracking-[.12em] text-[#6e6559]">
          <span>{workspaceItems.length} ON WORKING SURFACE</span>
          <span>{items.length} RECORDS</span>
          {deskMemory > 0 && <span className="text-[#806d52]">{deskMemory} DESK REVISIONS</span>}
          <span className="text-[#b89a61]">ST. ELMO // ACTIVE</span>
        </div>
      </header>

      {view === "workspace" && (
        <>
          <aside
            className="absolute left-0 top-[54px] bottom-0 z-30 w-[276px] border-r flex flex-col"
            style={{
              background: "linear-gradient(180deg, rgba(21,15,11,.78), rgba(10,7,5,.84))",
              borderColor: "rgba(148,120,75,.22)",
              boxShadow: "8px 0 24px rgba(0,0,0,.26)",
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: "rgba(148,120,75,.18)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[8px] tracking-[.18em] text-[#c9a65d]">
                  RECORD DRAWER
                </div>
                <ListFilter size={13} className="text-[#756a5a]" />
              </div>

              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-[#6e6559]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="SEARCH ARCHIVE"
                  className="w-full h-8 pl-8 pr-3 bg-black/25 border outline-none font-mono text-[8px] tracking-[.1em] text-[#c9bea9] placeholder:text-[#4f4941]"
                  style={{ borderColor: "rgba(148,120,75,.22)" }}
                />
              </div>

              <div className="flex gap-1 mt-2 flex-wrap">
                {(["all", "place", "evidence", "media", "hypothesis"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className="px-2 py-1 border font-mono text-[7px] uppercase tracking-[.1em]"
                    style={{
                      color: filter === value ? "#c9a65d" : "#675f54",
                      borderColor: filter === value ? "rgba(201,166,93,.3)" : "rgba(148,120,75,.12)",
                      background: filter === value ? "rgba(201,166,93,.06)" : "transparent",
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2">
              <div className="px-2 py-2 font-mono text-[7px] tracking-[.16em] text-[#514a41] uppercase">
                ACT I / DRAWER INDEX
              </div>

              {filteredArchive.map((item) => {
                const onDesk = workspaceIds.includes(item.id);
                const active = selectedId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item.id)}
                    className="w-full text-left p-3 mb-1 border transition-all"
                    style={{
                      background: active ? "rgba(201,166,93,.09)" : "rgba(20,15,10,.18)",
                      borderColor: active ? "rgba(201,166,93,.28)" : "rgba(148,120,75,.1)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: active ? "#c9a65d" : "#70675b" }}>
                        {kindIcon(item.kind, Boolean(item.artifactId))}
                      </span>
                      <span className="font-mono text-[8px] tracking-[.08em] text-[#b8ad9b] truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="mt-1 pl-5 font-mono text-[6px] uppercase tracking-[.12em] text-[#5d564d]">
                      {item.typeLabel}
                    </div>
                    {item.artifactId && (
                      <div className="mt-1 pl-5 font-mono text-[6px] uppercase tracking-[.12em] text-[#8f7650]">
                        PHYSICAL OBJECT // EXAMINATION CHAMBER
                      </div>
                    )}
                    <div className="mt-2 pl-5 flex items-center gap-2">
                      <span className="font-mono text-[6px] uppercase" style={{ color: statusTone(item) }}>
                        {statusLabel(item)}
                      </span>
                      {onDesk && (
                        <span className="font-mono text-[6px] uppercase text-[#a48756]">
                          ON DESK
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t" style={{ borderColor: "rgba(148,120,75,.16)" }}>
              <div className="font-mono text-[7px] uppercase tracking-[.14em] text-[#5e574d]">
                Drawer protocol
              </div>
              <div className="mt-1 font-serif text-[10px] leading-[1.45] text-[#81776a]">
                Keep only the records required for the current line of inquiry. The drawer preserves the catalogue; the desk is for working.
              </div>
            </div>
          </aside>

          <main
            ref={boardRef}
            className="absolute left-[276px] right-[326px] top-[54px] bottom-0 z-20 overflow-hidden"
            style={{ background: "transparent" }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-[7%] top-[7%] font-mono text-[7px] tracking-[.18em] text-[#c0a36e] opacity-55">
                CARREL 7-B // WORKING DESK
              </div>
              <div className="absolute right-[7%] top-[7%] font-mono text-[7px] tracking-[.14em] text-[#a58b60] opacity-45">
                SOURCE RECORDS REMAIN IN DRAWER
              </div>
              <div
                className="absolute left-[8%] right-[8%] top-[55%] bottom-[5%]"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 45%, rgba(215,170,86,.035), transparent 58%)",
                }}
              />
            </div>

            {workspaceItems.map((item, index) => (
              <PaperObject
                key={item.id}
                item={item}
                index={index}
                selected={item.id === selectedId}
                isDragging={dragState?.id === item.id}
                position={positionFor(item.id, index)}
                onExamine={examineItem}
                onSelect={selectItem}
                onDragStart={onDragStart}
                onDragEnd={onPointerUp}
                isPlaying={signalPlaying && selectedId === VANCE_SIGNAL.id}
              />
            ))}

            {workspaceItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center px-10">
                  <Archive size={30} className="mx-auto text-[#5d554b]" />
                  <div className="mt-3 font-mono text-[8px] tracking-[.18em] text-[#6a6156]">
                    DESK EMPTY
                  </div>
                  <div className="mt-1 font-serif text-[11px] text-[#554e45]">
                    Select a record from the drawer to place it on the working surface.
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between pointer-events-none">
              <div className="font-mono text-[6px] uppercase tracking-[.14em] text-[#6f604d] opacity-75">
                Desk arrangement is persistent
              </div>
              <div className="font-mono text-[6px] uppercase tracking-[.14em] text-[#6f604d] opacity-75">
                Arrange records for comparison
              </div>
            </div>
          </main>

          <aside
            className="absolute right-0 top-[54px] bottom-0 z-30 w-[326px] border-l overflow-auto"
            style={{
              background: "linear-gradient(180deg, rgba(21,15,11,.80), rgba(10,7,5,.86))",
              borderColor: "rgba(148,120,75,.22)",
              boxShadow: "-8px 0 24px rgba(0,0,0,.26)",
            }}
          >
            <div className="p-5 border-b" style={{ borderColor: "rgba(148,120,75,.18)" }}>
              <div className="font-mono text-[7px] tracking-[.17em] text-[#6d6458]">
                DOCUMENT TRAY
              </div>
              <div className="mt-2 font-serif text-[20px] leading-tight text-[#d1c4b1]">
                {selectedItem?.title || "Nothing selected"}
              </div>
              {selectedItem && (
                <div className="mt-2 font-mono text-[7px] uppercase tracking-[.12em] text-[#a48756]">
                  {selectedItem.typeLabel}
                </div>
              )}
            </div>

            {selectedItem ? (
              <div className="p-5">
                {selectedItem.kind === "place" && selectedItem.place?.photos?.[0] && (
                  <div className="border border-black/30 overflow-hidden mb-5" style={{ height: 176, background: "#14100d" }}>
                    <img
                      src={selectedItem.place.photos[0]}
                      alt={selectedItem.place.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                      style={{ filter: "sepia(.18) contrast(1.06) brightness(.82) saturate(.84)" }}
                    />
                  </div>
                )}

                <div className="font-serif text-[11px] leading-[1.65] text-[#898075]">
                  {selectedItem.description}
                </div>

                {selectedItem.artifactId && (
                  <div
                    className="mt-5 border px-3 py-3"
                    style={{
                      borderColor: "rgba(201,166,93,.14)",
                      background: "linear-gradient(145deg, rgba(201,166,93,.035), rgba(0,0,0,.08))",
                    }}
                  >
                    <div className="font-mono text-[7px] tracking-[.15em] text-[#b28e57]">
                      PHYSICAL OBJECT AVAILABLE
                    </div>
                    <div className="mt-2 font-serif text-[10px] leading-[1.5] text-[#746b60]">
                      This record has a recovered object associated with it. Examine the physical object in the forensic chamber.
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {[
                    ["SOURCE", selectedItem.source || selectedItem.place?.address?.formatted || "CANONICAL ARCHIVE"],
                    ["STATUS", statusLabel(selectedItem)],
                    ["DATE", selectedItem.date || "NOT RECORDED"],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b pb-2" style={{ borderColor: "rgba(148,120,75,.12)" }}>
                      <div className="font-mono text-[6px] tracking-[.14em] text-[#5d564d]">{label}</div>
                      <div className="mt-1 font-mono text-[8px] text-[#a59a89] break-words">{value}</div>
                    </div>
                  ))}
                </div>

                {selectedItem.kind === "media" && (
                  <div className="mt-5 space-y-2">
                    <button
                      onClick={openMedia}
                      className="w-full h-9 border flex items-center justify-center gap-2 font-mono text-[8px] uppercase tracking-[.12em] text-[#c9a65d]"
                      style={{
                        borderColor: "rgba(201,166,93,.28)",
                        background: "rgba(201,166,93,.05)",
                      }}
                    >
                      <Headphones size={12} /> PLAY RECORDING
                    </button>
                    <button
                      onClick={examinePhysicalCassette}
                      className="w-full h-9 border flex items-center justify-center gap-2 font-mono text-[8px] uppercase tracking-[.12em] text-[#bca67d]"
                      style={{
                        borderColor: "rgba(148,120,75,.24)",
                        background: "rgba(0,0,0,.12)",
                      }}
                    >
                      <Archive size={12} /> EXAMINE CASSETTE
                    </button>
                  </div>
                )}

                {selectedItem.kind === "hypothesis" && (
                  <div
                    className="mt-5 border p-4"
                    style={{
                      borderColor: "rgba(201,166,93,.2)",
                      background: "rgba(201,166,93,.035)",
                    }}
                  >
                    <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.14em] text-[#c9a65d]">
                      <ShieldAlert size={11} /> CURRENT INTERPRETATION
                    </div>
                    <div className="mt-2 font-serif text-[10px] leading-[1.55] text-[#857b6e]">
                      {INITIAL_HYPOTHESIS.contradictionText}
                    </div>
                  </div>
                )}

                {selectedItem.kind === "evidence" && selectedItem.id === "doc-stelmo-001" && (
                  <button
                    onClick={verifyStElmoSource}
                    disabled={analysedEvidenceIds.includes("doc-stelmo-001")}
                    className="mb-2 h-10 w-full border flex items-center justify-center gap-2 font-mono text-[8px] uppercase tracking-[.14em] text-[#d1b36f]"
                    style={{
                      borderColor: "rgba(201,166,93,.24)",
                      background: "rgba(201,166,93,.045)",
                    }}
                  >
                    <FileText size={12} />
                    {analysedEvidenceIds.includes("doc-stelmo-001") ? "SOURCE VERIFIED" : "EXAMINE SOURCE"}
                  </button>
                )}

                {selectedItem.kind === "evidence" && selectedItem.id === "evidence-stelmo-mechanical-exposure" && (
                  <div
                    className="mb-2 border p-3"
                    style={{
                      borderColor: "rgba(201,166,93,.16)",
                      background: "rgba(201,166,93,.025)",
                    }}
                  >
                    <div className="font-mono text-[7px] uppercase tracking-[.14em] text-[#c9a65d]">
                      PHYSICAL EXAMINATION RECORDED
                    </div>
                    <div className="mt-2 font-serif text-[10px] leading-[1.55] text-[#857b6e]">
                      This record was derived from direct examination of the Keeper's Final Log Cassette.
                    </div>
                  </div>
                )}

                {selectedItem.kind === "hypothesis" && (
                  <div
                    className="mb-2 border p-4"
                    style={{
                      borderColor: "rgba(201,166,93,.18)",
                      background: "rgba(201,166,93,.028)",
                    }}
                  >
                    <div className="font-mono text-[7px] tracking-[.14em] text-[#c9a65d]">REASONING STATE</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[7px] uppercase tracking-[.08em] text-[#827565]">
                      <span>Evidence {canonicalHypothesisEvidence.length}/2</span>
                      <span>{canonicalHypothesisConfidence}% confidence</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={supportPhysicalRecordDrift}
                        disabled={
                          !discoveredEvidenceIds.includes("doc-stelmo-001") ||
                          !discoveredEvidenceIds.includes("evidence-stelmo-mechanical-exposure") ||
                          canonicalHypothesisState === "confirmed" ||
                          canonicalHypothesisState === "contradicted"
                        }
                        className="h-8 w-full border font-mono text-[7px] uppercase tracking-[.1em] text-[#c9a65d]"
                        style={{ borderColor: "rgba(201,166,93,.22)", background: "rgba(201,166,93,.035)" }}
                      >
                        {canonicalHypothesisEvidence.length >= 2 ? "EVIDENCE ASSIGNED" : "SUPPORT WITH BOTH RECORDS"}
                      </button>

                      <button
                        onClick={filePhysicalRecordContradiction}
                        disabled={canonicalHypothesisState !== "supported" || Boolean(canonicalContradiction)}
                        className="h-8 w-full border font-mono text-[7px] uppercase tracking-[.1em] text-[#b98558]"
                        style={{ borderColor: "rgba(139,94,52,.26)", background: "rgba(139,94,52,.045)" }}
                      >
                        {canonicalContradiction ? "CONTRADICTION FILED" : "FILE CONTRADICTION"}
                      </button>

                      {canonicalContradiction && (
                        <button
                          onClick={resolvePhysicalRecordContradiction}
                          disabled={canonicalContradiction.status !== "unresolved"}
                          className="h-8 w-full border font-mono text-[7px] uppercase tracking-[.1em] text-[#bca67d]"
                          style={{ borderColor: "rgba(201,166,93,.20)" }}
                        >
                          {canonicalContradiction.status === "unresolved" ? "RESOLVE CONTRADICTION" : "CONTRADICTION RESOLVED"}
                        </button>
                      )}

                      <button
                        onClick={archiveStElmo}
                        disabled={
                          canonicalHypothesisState === "confirmed" ||
                          canonicalHypothesisEvidence.length < 2 ||
                          !canonicalContradiction ||
                          !["resolved", "accepted"].includes(canonicalContradiction.status)
                        }
                        className="h-8 w-full border font-mono text-[7px] uppercase tracking-[.1em] text-[#d7b86e]"
                        style={{ borderColor: "rgba(201,166,93,.30)", background: "rgba(201,166,93,.055)" }}
                      >
                        {canonicalHypothesisState === "confirmed" ? "CASE ARCHIVED" : "ARCHIVE CASE"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <button
                    onClick={examineSelected}
                    className="h-10 w-full border flex items-center justify-center gap-2 font-mono text-[8px] uppercase tracking-[.14em] text-[#d1b36f]"
                    style={{
                      borderColor: "rgba(201,166,93,.30)",
                      background: "linear-gradient(180deg, rgba(201,166,93,.08), rgba(201,166,93,.025))",
                      boxShadow: "inset 0 1px rgba(255,255,255,.05)",
                    }}
                  >
                    <Maximize2 size={12} /> {selectedItem.kind === "hypothesis"
                      ? "Open Working Folio"
                      : selectedItem.kind === "media"
                        ? "Open Recording"
                        : selectedItem.artifactId
                          ? "Examine in Forensic Chamber"
                          : "Examine Record"}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {workspaceIds.includes(selectedItem.id) ? (
                      <button
                        onClick={removeSelected}
                        className="h-8 border flex items-center justify-center gap-2 font-mono text-[7px] uppercase tracking-[.1em] text-[#81766a]"
                        style={{ borderColor: "rgba(148,120,75,.16)" }}
                      >
                        <ArrowDownToLine size={11} /> Return to drawer
                      </button>
                    ) : (
                      <button
                        onClick={() => addEvidence(selectedItem.id)}
                        className="h-8 border flex items-center justify-center gap-2 font-mono text-[7px] uppercase tracking-[.1em] text-[#c9a65d]"
                        style={{
                          borderColor: "rgba(201,166,93,.26)",
                          background: "rgba(201,166,93,.04)",
                        }}
                      >
                        <ArrowUpRight size={11} /> Put on desk
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedId(INITIAL_HYPOTHESIS.id);
                        addToWorkspace(INITIAL_HYPOTHESIS.id);
                        setView("workspace");
                        setExaminationId(INITIAL_HYPOTHESIS.id);
                      }}
                      className="h-8 border flex items-center justify-center gap-2 font-mono text-[7px] uppercase tracking-[.1em] text-[#81766a]"
                      style={{ borderColor: "rgba(148,120,75,.16)" }}
                    >
                      <Sparkles size={11} /> Working folio
                    </button>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="font-mono text-[7px] tracking-[.15em] text-[#5e574e]">
                    ARCHIVAL REFERENCES
                  </div>

                  <div className="mt-2 space-y-1">
                    {relatedItems.map((other) => (
                      <button
                        key={other.id}
                        onClick={() => selectItem(other.id)}
                        className="w-full text-left p-2 border flex items-center gap-2"
                        style={{
                          borderColor: "rgba(148,120,75,.11)",
                          background: "rgba(255,255,255,.01)",
                        }}
                      >
                        <Link2 size={10} className="text-[#8d7349]" />
                        <span className="font-mono text-[7px] text-[#82786c] truncate">
                          {other.title}
                        </span>
                      </button>
                    ))}

                    {relatedItems.length === 0 && (
                      <div className="font-serif text-[9px] text-[#514b43]">
                        No authored relationship currently visible.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 font-serif text-[10px] leading-[1.6] text-[#5c554c]">
                Select a record from the drawer or desk.
              </div>
            )}
          </aside>
        </>
      )}

      {view === "archive" && (
        <div className="absolute inset-x-0 top-[54px] bottom-0 z-20 overflow-auto p-10 bg-black/10">
          <div className="max-w-[980px] mx-auto">
            <div className="font-mono text-[8px] tracking-[.18em] text-[#c9a65d]">
              CENTRAL DRAWER // AVAILABLE RECORDS
            </div>
            <div className="mt-2 font-serif text-[26px] text-[#c8bba7]">
              Records awaiting examination
            </div>

            <div className="mt-8 grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredArchive.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setView("workspace");
                  }}
                  className="text-left border p-4 transition-transform hover:-translate-y-1"
                  style={{
                    background: "linear-gradient(145deg, rgba(211,200,177,.95), rgba(170,156,132,.95))",
                    borderColor: "rgba(69,53,35,.58)",
                    color: "#2c241b",
                    boxShadow: "0 12px 26px rgba(0,0,0,.4)",
                  }}
                >
                  <div className="font-mono text-[7px] uppercase tracking-[.14em] text-[#6c5a43]">
                    {item.typeLabel}
                  </div>
                  <div className="mt-2 font-serif text-[15px] font-semibold">
                    {item.title}
                  </div>
                  <div className="mt-2 font-serif text-[9px] leading-[1.55] text-[#584d40]">
                    {item.description}
                  </div>
                  <div className="mt-4 pt-2 border-t flex justify-between font-mono text-[6px] uppercase tracking-[.12em] text-[#6b5b47]">
                    <span>{item.subtitle}</span>
                    <span>{statusLabel(item)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "timeline" && (
        <div className="absolute inset-x-0 top-[54px] bottom-0 z-20 overflow-auto p-10 bg-black/10">
          <div className="max-w-[900px] mx-auto">
            <div className="font-mono text-[8px] tracking-[.18em] text-[#c9a65d]">
              CHRONOLOGY / ST. ELMO
            </div>
            <div className="mt-2 font-serif text-[24px] text-[#c8bba7]">
              The record, as currently reconstructed
            </div>
            <div className="mt-10 relative border-t" style={{ borderColor: "rgba(148,120,75,.28)" }}>
              {[
                ["1918", "Locked drawer", "The provenance record places the recovered drawer in a long-sealed desk."],
                ["1942-03-14", "Keeper's Log", "Edward Vance records that the lamp was already lit when he woke."],
                ["CURRENT", "Physical Record Drift", "The working hypothesis asks whether the physical state still corresponds to its archived history."],
              ].map(([date, title, description]) => (
                <div
                  key={date}
                  className="relative grid grid-cols-[130px_1fr] gap-7 py-8 border-b"
                  style={{ borderColor: "rgba(148,120,75,.14)" }}
                >
                  <div className="font-mono text-[8px] tracking-[.12em] text-[#a28654]">{date}</div>
                  <div>
                    <div className="font-serif text-[15px] text-[#c9bdab]">{title}</div>
                    <div className="mt-2 font-serif text-[10px] leading-[1.6] text-[#777065] max-w-[570px]">
                      {description}
                    </div>
                  </div>
                  <div
                    className="absolute left-[125px] top-[39px] w-2 h-2 rounded-full border"
                    style={{
                      background: "#c9a65d",
                      borderColor: "#624d2d",
                      boxShadow: "0 0 0 4px rgba(201,166,93,.06)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {dragState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 px-3 py-2 border font-mono text-[7px] uppercase tracking-[.12em] text-[#c9a65d]"
            style={{
              background: "rgba(13,10,7,.9)",
              borderColor: "rgba(201,166,93,.24)",
              boxShadow: "0 8px 22px rgba(0,0,0,.4)",
            }}
          >
            Rearranging desk record
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {examinationId && (() => {
          const examinationItem = items.find((item) => item.id === examinationId);
          if (!examinationItem) return null;

          const isFolio = examinationItem.kind === "hypothesis";
          const sourceValue =
            examinationItem.source ||
            examinationItem.place?.address?.formatted ||
            "CANONICAL ARCHIVE";

          return (
            <motion.div
              className="absolute inset-0 z-[120] flex items-center justify-center p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: "rgba(5,3,2,.48)",
                backdropFilter: "blur(1.5px) saturate(.72)",
                boxShadow: "inset 0 0 120px rgba(0,0,0,.24)",
              }}
              onPointerDown={() => setExaminationId(null)}
            >
              <motion.div
                className="relative w-full max-w-[790px] max-h-[92%] overflow-auto"
                initial={{ opacity: 0, y: 38, scale: .93, rotate: isFolio ? 1 : -1.2 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: isFolio ? 0 : -.25 }}
                exit={{ opacity: 0, y: 28, scale: .97, rotate: isFolio ? -.5 : .5 }}
                transition={{ duration: .34, ease: [0.16, .8, .22, 1] }}
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  color: isFolio ? "#d7c8b1" : "#30281e",
                  filter: "drop-shadow(0 36px 38px rgba(0,0,0,.48))",
                }}
              >
                {/* A second physical sheet gives the record believable thickness. */}
                <div
                  className="absolute inset-[7px] pointer-events-none"
                  style={{
                    backgroundImage: "url('/images/folder-edges-01.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: .22,
                    transform: "translate(9px, 10px) rotate(.45deg)",
                    filter: "sepia(.3) saturate(.7)",
                  }}
                />

                <div
                  className="relative overflow-hidden"
                  style={{
                    backgroundColor: isFolio ? "#20180f" : "#d9ccb0",
                    backgroundImage: isFolio
                      ? "linear-gradient(145deg, rgba(51,39,25,.96), rgba(19,14,10,.99)), url('/images/folio-working-01.png')"
                      : "linear-gradient(rgba(224,211,183,.22), rgba(224,211,183,.22)), url('/images/paper-aged-01.png')",
                    backgroundSize: isFolio ? "cover, cover" : "cover, cover",
                    backgroundPosition: "center",
                    border: `1px solid ${isFolio ? "rgba(83,63,39,.9)" : "rgba(74,55,34,.55)"}`,
                    boxShadow: "inset 0 1px rgba(255,255,255,.42), inset 0 -12px 26px rgba(61,39,19,.10)",
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: isFolio
                        ? "linear-gradient(90deg, rgba(255,255,255,.025), transparent 18%, transparent 82%, rgba(0,0,0,.12))"
                        : "linear-gradient(90deg, rgba(255,255,255,.10), transparent 16%, transparent 82%, rgba(79,53,28,.06))",
                    }}
                  />

                  {isFolio ? (
                    <div className="relative p-8 md:p-10 min-h-[650px]">
                      <div className="flex items-start justify-between gap-8">
                        <div>
                          <div className="font-mono text-[7px] tracking-[.22em] text-[#c9a65d]">WORKING FOLIO // CARREL 7-B</div>
                          <h2 className="mt-3 font-serif text-[29px] leading-tight text-[#e0d2b9]">{examinationItem.title}</h2>
                          <div className="mt-2 font-mono text-[7px] tracking-[.15em] text-[#8f806b]">{examinationItem.subtitle} // {canonicalHypothesisState || "PROVISIONAL"}</div>
                        </div>
                        <button
                          onClick={() => setExaminationId(null)}
                          aria-label="Return folio to desk"
                          className="shrink-0 px-3 py-2 font-mono text-[6px] tracking-[.14em] uppercase border"
                          style={{ borderColor: "rgba(201,166,93,.22)", color: "#a89473" }}
                        >
                          Return to desk
                        </button>
                      </div>

                      <div className="mt-8 h-px" style={{ background: "rgba(201,166,93,.18)" }} />

                      <div className="mt-7 grid grid-cols-[1fr_150px] gap-8">
                        <div>
                          <div className="font-mono text-[7px] tracking-[.16em] text-[#c9a65d]">CURRENT INTERPRETATION</div>
                          <div className="mt-3 font-serif text-[14px] leading-[1.8] text-[#c1b39d]">{INITIAL_HYPOTHESIS.contradictionText}</div>

                          <div className="mt-9 font-mono text-[7px] tracking-[.16em] text-[#c9a65d]">OPEN QUESTION</div>
                          <div className="mt-3 font-serif italic text-[13px] leading-[1.7] text-[#a99b86]">
                            What observation would force this interpretation to change?
                          </div>
                        </div>

                        <div className="relative">
                          <ArchiveStamp
                            label="PROVISIONAL"
                            variant="provisional"
                            className="absolute right-0 top-0 w-[148px]"
                            rotate={-5}
                          />
                          <div className="pt-28 border-t" style={{ borderColor: "rgba(201,166,93,.14)" }}>
                            <div className="font-mono text-[7px] tracking-[.14em] text-[#806f57]">CONFIDENCE</div>
                            <div className="mt-2 font-serif text-[38px] leading-none text-[#d7c7aa]">{canonicalHypothesisConfidence}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 grid grid-cols-2 gap-8">
                        <div>
                          <div className="font-mono text-[7px] tracking-[.15em] text-[#c9a65d]">SUPPORTING RECORDS</div>
                          <div className="mt-4 space-y-3 font-serif text-[11px] leading-[1.55] text-[#8f806d]">
                            <div className="border-b pb-2" style={{ borderColor: "rgba(201,166,93,.10)" }}>
                              St. Elmo Lighthouse // {discoveredEvidenceIds.includes("doc-stelmo-001") ? "verified" : "unverified"}
                            </div>
                            <div className="border-b pb-2" style={{ borderColor: "rgba(201,166,93,.10)" }}>
                              Keeper's Final Log // {discoveredEvidenceIds.includes("vance-lighthouse") ? "analysed" : "archival signal"}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[7px] tracking-[.15em] text-[#c9a65d]">CONFLICTS</div>
                          <div className="mt-4 font-serif text-[11px] leading-[1.55] text-[#8f806d]">
                            {canonicalContradiction
                              ? canonicalContradiction.status === "unresolved"
                                ? "Contradictory records remain unresolved."
                                : "The filed contradiction has been resolved and accepted into the case record."
                              : "No contradiction has been filed against the current interpretation."}
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 relative min-h-[130px] border-t pt-5" style={{ borderColor: "rgba(201,166,93,.14)" }}>
                        <div className="font-mono text-[7px] tracking-[.15em] text-[#c9a65d]">INVESTIGATOR'S MARGIN</div>
                        <div className="mt-4 absolute left-1 top-9 w-[280px] opacity-30 rotate-[-2deg]">
                          <img src="/images/handwriting-01.png" alt="" className="w-full mix-blend-multiply" draggable={false} />
                        </div>
                        <div className="absolute right-0 top-5 font-mono text-[6px] tracking-[.13em] text-[#665a4b]">OBSERVATION / NOT CANON</div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative p-7 md:p-9">
                      <div className="flex items-start justify-between gap-6">
                        <div className="max-w-[570px]">
                          <div className="font-mono text-[7px] tracking-[.20em] uppercase text-[#6f5938]">{examinationItem.typeLabel}</div>
                          <h2 className="mt-3 font-serif text-[30px] leading-[1.05] text-[#30251a]">{examinationItem.title}</h2>
                          <div className="mt-2 font-mono text-[7px] tracking-[.13em] uppercase text-[#75634e]">{examinationItem.subtitle}</div>
                        </div>
                        <button
                          onClick={() => setExaminationId(null)}
                          aria-label="Return record to desk"
                          className="shrink-0 font-mono text-[6px] tracking-[.13em] uppercase text-[#66553f]"
                        >
                          Return to desk
                        </button>
                      </div>

                      <div className="mt-6 h-px" style={{ background: "rgba(78,56,31,.22)" }} />

                      {examinationItem.kind === "place" && (
                        <div className="mt-7 relative mx-auto max-w-[540px] rotate-[-.4deg]">
                          <div
                            className="relative bg-[#e9dfca] p-4 pb-5"
                            style={{
                              boxShadow: "0 18px 24px rgba(43,29,15,.28), 0 2px 5px rgba(43,29,15,.18)",
                              border: "1px solid rgba(75,55,32,.24)",
                            }}
                          >
                            <div className="absolute -left-1 top-7 w-2 h-9 bg-[#d8c8a8] opacity-70" />
                            <div className="absolute -right-1 top-12 w-2 h-8 bg-[#d8c8a8] opacity-70" />
                            <div className="overflow-hidden bg-[#211a13] border" style={{ borderColor: "rgba(50,36,21,.4)" }}>
                              {examinationItem.place?.photos?.[0] ? (
                                <img
                                  src={examinationItem.place.photos[0]}
                                  alt={examinationItem.place.name}
                                  className="w-full aspect-[4/3] object-cover"
                                  draggable={false}
                                  style={{ filter: "sepia(.22) contrast(1.07) brightness(.84) saturate(.78)" }}
                                />
                              ) : (
                                <div className="aspect-[4/3] flex items-center justify-center font-mono text-[7px] tracking-[.16em] text-[#7b705e]">NO PHOTOGRAPH</div>
                              )}
                            </div>
                            <div className="mt-3 font-mono text-[6px] tracking-[.14em] uppercase text-[#79664c]">FIELD PHOTOGRAPH // CASE ANCHOR</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-8 grid grid-cols-[1fr_150px] gap-8">
                        <div>
                          <div className="font-mono text-[7px] tracking-[.16em] text-[#806747]">RECORD</div>
                          <div className="mt-3 font-serif text-[13px] leading-[1.75] text-[#4c4030]">{examinationItem.description}</div>
                        </div>
                        <div className="relative">
                          <ArchiveStamp
                            label="ARCHIVED"
                            variant="archived"
                            className="w-[142px]"
                            rotate={-4}
                          />
                          <div className="mt-7 font-mono text-[6px] tracking-[.13em] text-[#77664f]">STATUS</div>
                          <div className="mt-1 font-serif text-[12px] uppercase text-[#403425]">{statusLabel(examinationItem)}</div>
                        </div>
                      </div>

                      <div className="mt-9 border-t pt-5 grid grid-cols-3 gap-5" style={{ borderColor: "rgba(78,56,31,.18)" }}>
                        {[
                          ["SOURCE", sourceValue],
                          ["DATE", examinationItem.date || "NOT RECORDED"],
                          ["ARCHIVE", examinationItem.kind === "place" ? "CASE ANCHOR" : "DISCOVERED RECORD"],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <div className="font-mono text-[6px] tracking-[.15em] text-[#806d54]">{label}</div>
                            <div className="mt-2 font-mono text-[7px] leading-[1.5] text-[#504331] break-words">{value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 flex items-end justify-between gap-6">
                        <div className="relative w-[210px] h-[74px] overflow-hidden opacity-45 rotate-[-1.5deg]">
                          <img src="/images/handwriting-01.png" alt="" className="absolute w-[250px] max-w-none mix-blend-multiply" style={{ left: -18, top: -22 }} draggable={false} />
                        </div>
                        <div className="font-mono text-[6px] tracking-[.14em] text-[#77664f] text-right">CARREL 7-B // ARCHIVE COPY</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSignal && (
          <motion.div
            className="absolute inset-0 z-[125] flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "rgba(5,3,2,.50)",
              backdropFilter: "blur(1.5px) saturate(.72)",
            }}
            onPointerDown={() => {
              signalAudioRef.current?.pause();
              setSignalPlaying(false);
              setSelectedSignal(null);
            }}
          >
            <motion.div
              className="relative w-full max-w-[760px] overflow-hidden"
              initial={{ opacity: 0, y: 36, scale: .94, rotate: -.7 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: .15 }}
              exit={{ opacity: 0, y: 26, scale: .97 }}
              transition={{ duration: .28, ease: [0.16, .8, .22, 1] }}
              onPointerDown={(event) => event.stopPropagation()}
              style={{
                background: "linear-gradient(145deg, #211a13, #0f0b08)",
                border: "1px solid rgba(201,166,93,.26)",
                boxShadow: "0 38px 90px rgba(0,0,0,.78), 0 10px 24px rgba(0,0,0,.44)",
              }}
            >
              <audio
                ref={signalAudioRef}
                src={selectedSignal.mediaUrl}
                preload="metadata"
                onLoadedMetadata={(event) => {
                  const duration = event.currentTarget.duration;
                  if (Number.isFinite(duration)) setSignalDuration(duration);
                }}
                onTimeUpdate={(event) => setSignalTime(event.currentTarget.currentTime)}
                onPlay={() => setSignalPlaying(true)}
                onPause={() => setSignalPlaying(false)}
                onEnded={() => setSignalPlaying(false)}
              />

              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 4px)",
                }}
              />

              <div className="relative px-7 py-5 border-b flex items-start justify-between"
                style={{ borderColor: "rgba(201,166,93,.15)" }}
              >
                <div>
                  <div className="flex items-center gap-2 font-mono text-[7px] tracking-[.18em] text-[#c9a65d]">
                    <span className="w-5 h-px bg-[#c9a65d]" />
                    ARCHIVAL PLAYBACK INSTRUMENT
                  </div>
                  <h2 className="mt-3 font-serif text-[25px] text-[#d7c8b1]">
                    {selectedSignal.title}
                  </h2>
                  <div className="mt-2 font-mono text-[7px] uppercase tracking-[.12em] text-[#817565]">
                    {selectedSignal.source}
                  </div>
                </div>
                <button
                  onClick={() => {
                    signalAudioRef.current?.pause();
                    setSignalPlaying(false);
                    setSelectedSignal(null);
                  }}
                  className="w-8 h-8 border flex items-center justify-center text-[#95856e]"
                  style={{ borderColor: "rgba(201,166,93,.18)" }}
                  aria-label="Close recording"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="relative p-7">
                <div
                  className="relative h-[128px] border p-5 overflow-hidden"
                  style={{
                    borderColor: "rgba(201,166,93,.16)",
                    background:
                      "linear-gradient(180deg, rgba(201,166,93,.045), rgba(0,0,0,.16)), repeating-linear-gradient(90deg, transparent 0 13px, rgba(201,166,93,.035) 13px 14px)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[7px] tracking-[.16em] text-[#8f806b]">
                      TAPE / SIGNAL
                    </div>
                    <div className="font-mono text-[7px] text-[#6f6252]">
                      {formatSignalTime(signalTime)} / {formatSignalTime(signalDuration)}
                    </div>
                  </div>

                  <div className="absolute left-5 right-5 bottom-5 flex items-center gap-4">
                    <button
                      onClick={toggleSignalPlayback}
                      className="w-12 h-12 border flex items-center justify-center text-[#d1b36f]"
                      style={{
                        borderColor: "rgba(201,166,93,.30)",
                        background: "rgba(201,166,93,.055)",
                      }}
                      aria-label={signalPlaying ? "Pause recording" : "Play recording"}
                    >
                      {signalPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    <div className="flex-1">
                      <input
                        aria-label="Recording position"
                        type="range"
                        min={0}
                        max={Math.max(signalDuration, 1)}
                        step={0.1}
                        value={Math.min(signalTime, signalDuration)}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (signalAudioRef.current) signalAudioRef.current.currentTime = value;
                          setSignalTime(value);
                        }}
                        className="w-full accent-[#c9a65d]"
                      />
                      <div className="mt-2 flex items-center justify-between font-mono text-[6px] tracking-[.12em] text-[#665b4d]">
                        <span>BEGIN</span>
                        <span>END</span>
                      </div>
                    </div>

                    <Volume2 size={14} className="text-[#746754]" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-[1fr_250px] gap-6">
                  <div>
                    <div className="font-mono text-[7px] tracking-[.16em] text-[#c9a65d]">
                      LISTENING TRANSCRIPT
                    </div>
                    <div className="mt-3 max-h-[260px] overflow-auto pr-3 space-y-3">
                      {selectedSignal.transcript.map((line, index) => (
                        <div
                          key={`${line}-${index}`}
                          className="font-serif text-[11px] leading-[1.65]"
                          style={{
                            color:
                              signalTime >= index * (signalDuration / Math.max(selectedSignal.transcript.length, 1))
                                ? "#c7baa5"
                                : "#6e6254",
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="border p-4 self-start"
                    style={{
                      borderColor: "rgba(201,166,93,.15)",
                      background: "rgba(201,166,93,.025)",
                    }}
                  >
                    <div className="font-mono text-[7px] tracking-[.14em] text-[#c9a65d]">
                      LISTENING NOTE
                    </div>
                    <div className="mt-3 font-serif text-[10px] leading-[1.65] text-[#8f8371]">
                      Record an observation while the signal is playing. The Archive preserves the observation separately from the source recording.
                    </div>
                    <button
                      onClick={recordListeningObservation}
                      disabled={false}
                      className="mt-5 w-full h-8 border font-mono text-[7px] uppercase tracking-[.12em] text-[#b49a6b]"
                      style={{ borderColor: "rgba(201,166,93,.18)" }}
                    >
                      Add listening note
                    </button>
                  </div>
                </div>

                <div className="mt-7 pt-4 border-t flex items-center justify-between"
                  style={{ borderColor: "rgba(201,166,93,.12)" }}
                >
                  <div className="font-mono text-[6px] uppercase tracking-[.16em] text-[#625849]">
                    CARREL 7-B // PLAYBACK SURFACE
                  </div>
                  <button
                    onClick={() => {
                      signalAudioRef.current?.pause();
                      setSignalPlaying(false);
                      setSelectedSignal(null);
                    }}
                    className="h-8 px-4 border font-mono text-[7px] uppercase tracking-[.12em] text-[#b49a6b]"
                    style={{ borderColor: "rgba(201,166,93,.20)" }}
                  >
                    Return recording to tray
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EvidenceBoard;
