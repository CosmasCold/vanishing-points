"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTerminal,
  FiLock,
  FiPackage,
  FiRadio,
  FiMap,
  FiShield,
  FiActivity,
  FiFileText,
} from "react-icons/fi";

interface TerminalSidebarProps {
  activeTab: string;
  onSetTab: (tab: string) => void;
  theme: string;
  dust: number;
  corruption: number;
  inventory: string[];
  visitedPlaces: string[];
  expeditionLog: string[];
}

const TABS = [
  { id: "logs", label: "Logs", icon: FiTerminal },
  { id: "inventory", label: "Items", icon: FiPackage },
  { id: "signals", label: "Signals", icon: FiRadio },
  { id: "map", label: "Atlas", icon: FiMap },
  { id: "status", label: "Status", icon: FiActivity },
  { id: "codes", label: "Codes", icon: FiLock },
  { id: "files", label: "Files", icon: FiFileText },
  { id: "shield", label: "Shield", icon: FiShield },
];

export function TerminalSidebar({
  activeTab,
  onSetTab,
  theme,
  dust,
  corruption,
  inventory,
  visitedPlaces,
  expeditionLog,
}: TerminalSidebarProps) {
  const themeColor = {
    tungsten: "#c4785a",
    phosphor: "#4a9a6a",
    amber: "#c4a040",
    bone: "#ddd0bc",
    ember: "#8b3a2a",
    ash: "#5a4e42",
    void: "#3a3028",
    archive: "#7a6b52",
  }[theme] ?? "#c4785a";

  const renderContent = () => {
    switch (activeTab) {
      case "logs":
        return (
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] text-[#5a4e42] tracking-widest uppercase mb-3">
              Transmission Log
            </h3>
            {expeditionLog.length === 0 ? (
              <p className="font-mono text-[11px] text-[#3a3028] italic">No transmissions recorded.</p>
            ) : (
              expeditionLog.map((log, i) => (
                <div key={i} className="border-l border-[#1a1610] pl-3 py-1">
                  <p className="font-mono text-[11px] text-[#6a5a4a]">{log}</p>
                </div>
              ))
            )}
          </div>
        );

      case "inventory":
        return (
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] text-[#5a4e42] tracking-widest uppercase mb-3">
              Collected Artifacts ({inventory.length})
            </h3>
            {inventory.length === 0 ? (
              <p className="font-mono text-[11px] text-[#3a3028] italic">Inventory empty.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {inventory.map((item, i) => (
                  <div
                    key={i}
                    className="border border-[#1a1610] rounded p-2 hover:border-[#5a4e42]/30 transition-colors"
                  >
                    <span className="font-mono text-[10px] text-[#7a6a5a]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="font-mono text-[11px] text-[#b0a090] mt-1">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "signals":
        return (
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] text-[#5a4e42] tracking-widest uppercase mb-3">
              Signal Decoder
            </h3>
            <div className="border border-[#1a1610] rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-[#5a4e42]">FREQ</span>
                <span className="font-mono text-[11px] text-[#c4785a]">142.857 MHz</span>
              </div>
              <div className="h-8 flex items-end gap-0.5">
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${20 + Math.random() * 60}%`,
                      backgroundColor: themeColor,
                      opacity: 0.3 + Math.random() * 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="font-mono text-[10px] text-[#3a3028]">
              Scanning for anomalous broadcasts...
            </p>
          </div>
        );

      case "status":
        return (
          <div className="space-y-4">
            <h3 className="font-mono text-[10px] text-[#5a4e42] tracking-widest uppercase mb-3">
              System Status
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#5a4e42]">Dust Saturation</span>
                <span className="text-[#b0a090]">{dust}%</span>
              </div>
              <div className="h-1 bg-[#1a1610] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${dust}%`,
                    backgroundColor: dust > 80 ? "#8b3a2a" : themeColor,
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#5a4e42]">Corruption</span>
                <span className={corruption > 2 ? "text-[#8b3a2a] animate-flicker" : "text-[#b0a090]"}>
                  Stage {corruption}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    style={{
                      backgroundColor: i < corruption ? "#8b3a2a" : "#1a1610",
                      opacity: i < corruption ? 0.7 : 0.2,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1a1610]">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#5a4e42]">Places Surveyed</span>
                <span className="text-[#b0a090]">{visitedPlaces.length}</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="font-mono text-[11px] text-[#3a3028] italic">
              {activeTab.toUpperCase()} — Under construction
            </p>
          </div>
        );
    }
  };

  return (
    <div className="vp-sidebar">
      <div className="vp-sidebar-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSetTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm
                font-mono text-[10px] tracking-wide uppercase whitespace-nowrap
                transition-all duration-200
                ${isActive 
                  ? "text-[#b0a090] bg-[rgba(180,160,140,0.06)]" 
                  : "text-[#3a3028] hover:text-[#5a4e42] hover:bg-[rgba(180,160,140,0.03)]"
                }
              `}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="vp-sidebar-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}