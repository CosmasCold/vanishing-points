"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Info, AlertTriangle, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Omit<Toast, "id">;
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...detail, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };
    window.addEventListener("showtoast", handler);
    return () => window.removeEventListener("showtoast", handler);
  }, []);

  const remove = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const icon = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle size={14} className="text-[#6b7a5a]" />;
      case "warning":
        return <AlertTriangle size={14} className="text-[#a67c52]" />;
      default:
        return <Info size={14} className="text-[#9a8a72]" />;
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-[#252018] border border-[rgba(122,107,82,0.3)] rounded-lg shadow-xl min-w-[260px]"
          >
            {icon(t.type)}
            <span className="text-xs font-mono text-[#ddd0bc]">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="ml-auto text-[#9a8a72] hover:text-[#ddd0bc] transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}