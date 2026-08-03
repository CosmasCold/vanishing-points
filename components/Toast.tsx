"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { Toast as ToastType } from "@/types";

interface Props {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastType;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const palette = {
    success: { icon: "#7a9a6a", border: "rgba(122,154,106,0.3)" },
    error: { icon: "#c4785a", border: "rgba(196,120,90,0.3)" },
    info: { icon: "#9a8a72", border: "rgba(154,138,114,0.3)" },
  }[toast.type];

  const icons = {
    success: <CheckCircle size={16} style={{ color: palette.icon }} />,
    error: <XCircle size={16} style={{ color: palette.icon }} />,
    info: <Info size={16} style={{ color: palette.icon }} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        minWidth: 280,
        backgroundColor: "rgba(12,10,8,0.95)",
        border: `1px solid ${palette.border}`,
      }}
    >
      {icons[toast.type]}
      <span className="text-sm flex-1" style={{ color: "rgba(221,208,188,0.9)" }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        className="transition-colors"
        style={{ color: "#7a6e5e" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#ddd0bc";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#7a6e5e";
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}