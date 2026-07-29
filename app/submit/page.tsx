"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { UNSENT_MESSAGES } from "@/lib/echoesContent";
import { showToast } from "@/lib/toast";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="submit-label block mb-1.5">Place Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="submit-input w-full py-2.5 px-3 text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="submit-label block mb-1.5">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="submit-input w-full py-2.5 px-3 text-sm"
            required
          />
        </div>
        <div>
          <label className="submit-label block mb-1.5">Country</label>
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="submit-input w-full py-2.5 px-3 text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="submit-label block mb-1.5">Historical Record</label>
        <textarea
          rows={5}
          value={form.history}
          onChange={(e) => setForm({ ...form, history: e.target.value })}
          className="submit-input submit-textarea w-full py-2.5 px-3 text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="submit-label block mb-1.5">Danger Level</label>
          <input
            type="number"
            min={1}
            max={5}
            value={form.dangerLevel}
            onChange={(e) => setForm({ ...form, dangerLevel: parseInt(e.target.value) })}
            className="submit-input w-full py-2.5 px-3 text-sm"
          />
        </div>
        <div>
          <label className="submit-label block mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            className="submit-input w-full py-2.5 px-3 text-sm"
          >
            <option value="abandoned">Abandoned</option>
            <option value="haunted">Haunted</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="submit-label block mb-1.5">Your Name</label>
          <input
            value={form.contributorName}
            onChange={(e) => setForm({ ...form, contributorName: e.target.value })}
            className="submit-input w-full py-2.5 px-3 text-sm"
          />
        </div>
        <div>
          <label className="submit-label block mb-1.5">Email</label>
          <input
            type="email"
            value={form.contributorEmail}
            onChange={(e) => setForm({ ...form, contributorEmail: e.target.value })}
            className="submit-input w-full py-2.5 px-3 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="submit-btn w-full py-3 rounded-lg text-[11px] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send size={14} />
        {submitting ? "Transmitting..." : "Log Discovery"}
      </button>
    </form>
  );
}

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
      <div className="text-center py-12 space-y-4">
        <AlertTriangle size={24} className="mx-auto text-[#33ff00]" />
        <p className="font-mono text-sm text-[#33ff00]">TRANSMISSION RECEIVED</p>
        <p className="text-[10px] font-mono text-[#33ff00]/60 uppercase tracking-widest">
          BUNKER_7 // ARCHIVIST NOTIFIED
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 relative">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#33ff00] animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#33ff00]/70">
          Incoming Transmission
        </span>
      </div>

      <div>
        <label className="submit-label block mb-1.5 text-[#33ff00]/70">Message</label>
        <textarea
          ref={inputRef}
          rows={4}
          value={display}
          readOnly
          className="w-full bg-[#050a05] border border-[#33ff00]/30 rounded-lg py-2.5 px-3 text-sm text-[#33ff00] font-mono focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 opacity-50">
        <div>
          <label className="submit-label block mb-1.5">Coordinates</label>
          <input
            value={`${(Math.random() * 180 - 90).toFixed(4)}, ${(Math.random() * 360 - 180).toFixed(4)}`}
            readOnly
            className="submit-input w-full py-2.5 px-3 text-sm"
          />
        </div>
        <div>
          <label className="submit-label block mb-1.5">Contributor</label>
          <input
            value="BUNKER_7"
            readOnly
            className="submit-input w-full py-2.5 px-3 text-sm text-[#33ff00]"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={phase !== "empty"}
        className="w-full py-3 bg-[#33ff00]/10 border border-[#33ff00]/30 rounded-lg text-[11px] font-mono uppercase tracking-wider text-[#33ff00] hover:bg-[#33ff00]/20 transition-colors disabled:opacity-30"
      >
        Submit Intercepted Transmission
      </button>
    </div>
  );
}

export default function SubmitPage() {
  const [hijacked] = useState(() => Math.random() < 0.067); // 1 in 15

  return (
    <main className="min-h-screen bg-[#1a1612] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="submit-card rounded-xl p-8 w-full max-w-lg relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-cinzel text-xl text-[#3d3228]">
                {hijacked ? "Intercepted Signal" : "Log Discovery"}
              </h1>
              <p className="text-[11px] font-mono text-[#7a6e5e] mt-1 uppercase tracking-wider">
                {hijacked ? "Transmission source unknown" : "Add to the atlas"}
              </p>
            </div>
            <Link
              href="/"
              className="text-[10px] font-mono uppercase tracking-wider text-[#9a8a72] hover:text-[#5a4e42]"
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