"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, Image as ImageIcon } from "lucide-react";
import { STORY_ASSETS, getUnlockedAssets } from "@/lib/assets";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  themeColor?: string;
}

export default function AssetGallery({ isOpen, onClose, themeColor = "#ffb000" }: Props) {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setUnlocked(getUnlockedAssets());
  }, [isOpen]);

  const selectedAsset = STORY_ASSETS.find((a) => a.id === selected);

  const rarityColor = (r: string) => {
    switch (r) {
      case "legendary": return "#a855f7";
      case "rare": return "#ef4444";
      case "uncommon": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(5,5,5,0.95)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-lg border flex flex-col"
          style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}05` }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: `${themeColor}20` }}>
            <div>
              <h2 className="text-sm font-mono uppercase tracking-widest" style={{ color: themeColor }}>Archive Collection</h2>
              <p className="text-[10px] font-mono opacity-50 mt-0.5" style={{ color: themeColor }}>
                {unlocked.length} / {STORY_ASSETS.length} recovered
              </p>
            </div>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: themeColor }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedAsset ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelected(null)}
                  className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: themeColor }}
                >
                  [← Back to grid]
                </button>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: `${themeColor}20` }}>
                  <img
                    src={`/story-assets/${selectedAsset.filename}`}
                    alt={selectedAsset.title}
                    className="w-full max-h-[50vh] object-contain bg-black"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded border" style={{ borderColor: rarityColor(selectedAsset.rarity), color: rarityColor(selectedAsset.rarity) }}>
                      {selectedAsset.rarity}
                    </span>
                    <span className="text-[10px] font-mono uppercase opacity-40" style={{ color: themeColor }}>{selectedAsset.category}</span>
                  </div>
                  <h3 className="text-lg font-cinzel" style={{ color: themeColor }}>{selectedAsset.title}</h3>
                  <p className="text-sm opacity-80" style={{ color: themeColor }}>{selectedAsset.description}</p>
                  {selectedAsset.lore && (
                    <p className="text-xs italic opacity-60 border-l-2 pl-3 mt-2" style={{ borderColor: `${themeColor}30`, color: themeColor }}>
                      {selectedAsset.lore}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {STORY_ASSETS.map((asset) => {
                  const isUnlocked = unlocked.includes(asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => isUnlocked && setSelected(asset.id)}
                      className={`relative aspect-square border rounded-lg overflow-hidden group transition-all ${
                        isUnlocked ? "hover:opacity-90" : "opacity-40 cursor-not-allowed"
                      }`}
                      style={{ borderColor: isUnlocked ? `${themeColor}30` : `${themeColor}10` }}
                    >
                      {isUnlocked ? (
                        <>
                          <img
                            src={`/story-assets/${asset.filename}`}
                            alt={asset.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            <p className="text-[9px] font-mono uppercase truncate" style={{ color: themeColor }}>{asset.title}</p>
                          </div>
                          <div className="absolute top-1 right-1">
                            <Unlock size={10} style={{ color: themeColor }} />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <Lock size={16} style={{ color: `${themeColor}40` }} />
                          <span className="text-[8px] font-mono uppercase opacity-30" style={{ color: themeColor }}>Encrypted</span>
                        </div>
                      )}
                      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rarityColor(asset.rarity) }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}