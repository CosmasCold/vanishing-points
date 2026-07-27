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

  const icons = {
    success: <CheckCircle size={16} className="text-specter" />,
    error: <XCircle size={16} className="text-warning" />,
    info: <Info size={16} className="text-ash" />,
  };

  const borders = {
    success: "border-specter/30",
    error: "border-warning/30",
    info: "border-ash/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-shadow/95 backdrop-blur-sm border ${borders[toast.type]} rounded-lg shadow-lg shadow-void/50 min-w-[280px]`}
    >
      {icons[toast.type]}
      <span className="text-sm text-bone/90 flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-ash hover:text-bone transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}