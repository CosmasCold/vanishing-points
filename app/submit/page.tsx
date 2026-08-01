"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, AlertTriangle, Radio } from "lucide-react";
import Link from "next/link";
import { UNSENT_MESSAGES } from "@/lib/echoesContent";
import { showToast } from "@/lib/toast";

/* ─── NORMAL FORM ─── */
function NormalForm() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    history: "",
    city: "",
    country: "",
    dangerLevel: 1,
    category: "abandoned" as const,
    contributorName: "",
    contributorEmail: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        coordinates: [0, 0],
        address: { city: form.city, country: form.country },
        photos: [],
      }),
    });
    if (res.ok) {
      showToast("Discovery logged. Awaiting verification.", "success");
      setForm({ name: "", history: "", city: "", country: "", dangerLevel: 1, category: "abandoned", contributorName: "", contributorEmail: "" });
    } else {
      showToast("Failed to log discovery.", "warning");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
      <Field label="Place Name">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="submit-input w-full py-2.5 px-3.5 text-sm rounded-md"
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <Field label="City">
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="submit-input w-full py-2.5 px-3.5 text-sm rounded-md"
            required
          />
        </Field>
        <Field label="Country">
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="submit-input w-full py-2.5 px-3.5 text-sm rounded-md"
            required
          />
        </Field>
      </div>

      <Field label="Historical Record">
        <textarea
          rows={4}
          value={form.history}
          onChange={(e) => setForm({ ...form, history: e.target.value })}
          className="submit-input submit-textarea w-full py-2.5 px-3.5 text-sm rounded-md"
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <Field label="Danger Level">
          <input
            type="number"
            min={1}
            max={5}
            value={form.dangerLevel}
            onChange={(e) => setForm({ ...form, dangerLevel: parseInt(e.target.value) })}
            className="submit-input w-full py-2.5 px-3.5 text-sm rounded-md"
          />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            className="submit-input w-full py-2.5 px-3.5 text-sm rounded-md"
          >
            <option value="abandoned">Abandoned</option>
            <option value="haunted">Haunted</option>
            <option value="both">Both</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <Field label="Your Name">
          <input
            value={form.contributorName}
            onChange={(e) => setForm({ ...form, contributorName: e.target.value })}
            className="submit-input w-full py-2.5 px-3.5 text-sm rounded-md"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.contributorEmail}
            onChange={(e) => setForm({ ...form, contributorEmail: e.target.value })}
            className="submit-input w-full py-2.5 px-3.5 text-sm rounded-md"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="submit-btn w-full py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all min-h-[52px]"
        style={{
          background: "linear-gradient(135deg, #5a4e42, #5a4a32)",
          border: "1px solid #3a2e22",
          color: "#ddd0bc",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <Send size={14} />
        {submitting ? "Transmitting..." : "Log Discovery"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5 text-[11px] md:text-xs uppercase tracking-[0.2em] font-bold" style={{ color: "#5a4e42" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ─── HIJACKED FORM ─── */
function HijackedForm() {
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"typing" | "deleting" | "empty">("typing");
  const [submitted, setSubmitted] = useState(false);
  const message = UNSENT_MESSAGES[Math.floor(Math.random() * UNSENT_MESSAGES.length)];
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let i = 0;
    const typeInterval = setInterval(() => {
      i++;
      setDisplay(message.slice(0, i));
      if (i >= message.length) {
        clearInterval(typeInterval);
        setTimeout(() => setPhase("deleting"), 1200);
      }
    }, 45);
    return () => clearInterval(typeInterval);
  }, [message]);

  useEffect(() => {
    if (phase !== "deleting") return;
    let i = display.length;
    const delInterval = setInterval(() => {
      i--;
      setDisplay(message.slice(0, i));
      if (i <= 0) {
        clearInterval(delInterval);
        setPhase("empty");
      }
    }, 30);
    return () => clearInterval(delInterval);
  }, [phase, display.length, message]);

  const handleSubmit = async () => {
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "UNVERIFIED_TRANSMISSION",
        history: message,
        coordinates: [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 90],
        address: { city: "Unknown", country: "Unknown" },
        dangerLevel: 5,
        category: "haunted",
        contributorName: "BUNKER_7",
        photos: [],
      }),
    });
    if (res.ok) {
      showToast("Transmission intercepted by Archivist", "success");
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10 md:py-14 space-y-4">
        <AlertTriangle size={28} className="mx-auto" style={{ color: "#c4785a" }} />
        <p className="font-mono text-sm uppercase tracking-[0.2em]" style={{ color: "#c4785a" }}>
          Transmission Received
        </p>
        <p className="text-[11px] font-mono opacity-40 uppercase tracking-[0.3em]">
          BUNKER_7 // Archivist Notified
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6 relative">
      {/* Corruption header */}
      <div className="flex items-center gap-2.5 mb-2">
        <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "#c4785a", boxShadow: "0 0 8px #c4785a80" }} />
        <span className="text-[11px] font-mono uppercase tracking-[0.3em] opacity-60" style={{ color: "#c4785a" }}>
          Incoming Transmission
        </span>
      </div>

      <div>
        <label className="block mb-1.5 text-[11px] md:text-xs uppercase tracking-[0.2em] font-bold opacity-50" style={{ color: "#c4785a" }}>
          Message
        </label>
        <textarea
          ref={inputRef}
          rows={3}
          value={display}
          readOnly
          className="w-full rounded-lg py-2.5 px-3.5 text-sm font-mono outline-none"
          style={{
            background: "rgba(8,6,4,0.6)",
            border: "1px solid rgba(196,120,90,0.25)",
            color: "#e8c8b8",
            boxShadow: "inset 0 0 20px rgba(196,120,90,0.04)",
            textShadow: "0 0 6px rgba(196,120,90,0.15)",
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 opacity-40">
        <div>
          <label className="block mb-1.5 text-[11px] md:text-xs uppercase tracking-[0.2em] font-bold opacity-50" style={{ color: "#c4785a" }}>
            Coordinates
          </label>
          <input
            value={`${(Math.random() * 180 - 90).toFixed(4)}, ${(Math.random() * 360 - 180).toFixed(4)}`}
            readOnly
            className="w-full rounded-lg py-2.5 px-3.5 text-sm font-mono outline-none"
            style={{
              background: "rgba(8,6,4,0.4)",
              border: "1px solid rgba(196,120,90,0.15)",
              color: "#c4785a",
            }}
          />
        </div>
        <div>
          <label className="block mb-1.5 text-[11px] md:text-xs uppercase tracking-[0.2em] font-bold opacity-50" style={{ color: "#c4785a" }}>
            Contributor
          </label>
          <input
            value="BUNKER_7"
            readOnly
            className="w-full rounded-lg py-2.5 px-3.5 text-sm font-mono outline-none"
            style={{
              background: "rgba(8,6,4,0.4)",
              border: "1px solid rgba(196,120,90,0.15)",
              color: "#c4785a",
            }}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={phase !== "empty"}
        className="w-full py-3.5 rounded-lg text-xs font-mono uppercase tracking-[0.2em] transition-all disabled:opacity-20 active:scale-[0.98] min-h-[52px] relative overflow-hidden"
        style={{
          color: "#0c0a08",
          background: "linear-gradient(135deg, #c4785a, #a05040)",
          border: "1px solid rgba(196,120,90,0.4)",
          boxShadow: "0 4px 20px rgba(196,120,90,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <span className="relative z-10">Submit Intercepted Transmission</span>
      </button>
    </div>
  );
}

/* ─── MAIN ─── */
export default function SubmitPage() {
  const [hijacked] = useState(() => Math.random() < 0.067);

  return (
    <main
      className="min-h-[100dvh] relative overflow-hidden flex items-start md:items-center justify-center p-5 md:p-10"
      style={{ backgroundColor: "#0c0a08" }}
    >
      {/* Subtle CRT */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 4px",
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(8,6,4,0.5) 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 w-full max-w-lg rounded-xl p-6 md:p-10 overflow-hidden ${
          hijacked ? "" : "submit-card"
        }`}
        style={hijacked ? {
          background: "linear-gradient(180deg, #120a08 0%, #0c0a08 100%)",
          border: "1px solid rgba(196,120,90,0.2)",
          borderLeft: "3px solid #c4785a",
          boxShadow: "0 16px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(196,120,90,0.05), 0 0 60px rgba(196,120,90,0.03)",
        } : {}}
      >
        {/* Inner glow for hijacked */}
        {hijacked && (
          <div
            className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #c4785a, transparent 70%)" }}
          />
        )}

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-0 mb-6 md:mb-8">
            <div>
              <h1
                className="font-cinzel text-lg md:text-xl font-medium"
                style={{ color: hijacked ? "#e8c8b8" : "#3d3228" }}
              >
                {hijacked ? "Intercepted Signal" : "Log Discovery"}
              </h1>
              <p
                className="text-[11px] md:text-xs font-mono mt-1 uppercase tracking-[0.2em]"
                style={{ color: hijacked ? "#9a8a72" : "#7a6e5e" }}
              >
                {hijacked ? "Transmission source unknown" : "Add to the atlas"}
              </p>
            </div>
            <Link
              href="/"
              className="self-start sm:self-auto text-[11px] font-mono uppercase tracking-wider transition-colors duration-300 active:scale-95"
              style={{ color: hijacked ? "#5a4e42" : "#9a8a72" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = hijacked ? "#c4785a" : "#5a4e42")}
              onMouseLeave={(e) => (e.currentTarget.style.color = hijacked ? "#5a4e42" : "#9a8a72")}
            >
              [ Close ]
            </Link>
          </div>

          {hijacked ? <HijackedForm /> : <NormalForm />}
        </div>
      </motion.div>
    </main>
  );
}