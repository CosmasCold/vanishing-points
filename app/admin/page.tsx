"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Eye,
  Edit3,
  Save,
  Trash2,
  Search,
  FileText,
  Shield,
  Globe,
} from "lucide-react";

interface Place {
  _id: string;
  name: string;
  slug: string;
  category: "abandoned" | "haunted" | "both";
  dangerLevel: number;
  status: "pending" | "approved" | "rejected";
  history: string;
  address: { city: string; country: string };
  coordinates: [number, number];
  yearAbandoned?: number;
  photos: string[];
  contributorName?: string;
  contributorEmail?: string;
  submittedAt: string;
  viewCount?: number;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Place | null>(null);

  // Check auth on mount
  useEffect(() => {
    fetch("/api/admin/auth", { credentials: "include" })
      .then((r) => r.ok && setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => authed === null && setAuthed(false));
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "include",
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setError("Invalid access code");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE", credentials: "include" });
    setAuthed(false);
    setPlaces([]);
  };

  const loadData = async () => {
    setLoading(true);
    const endpoint = tab === "pending" ? "/api/admin/submissions" : "/api/admin/places";
    const res = await fetch(endpoint, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setPlaces(tab === "pending" ? data.submissions : data.places);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed, tab]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
      credentials: "include",
    });
    loadData();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch("/api/admin/places", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing._id,
        name: editing.name,
        history: editing.history,
        category: editing.category,
        dangerLevel: editing.dangerLevel,
        yearAbandoned: editing.yearAbandoned,
      }),
      credentials: "include",
    });
    setEditing(null);
    loadData();
  };

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.country.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: places.filter((p) => p.status === "pending").length,
    approved: places.filter((p) => p.status === "approved").length,
    rejected: places.filter((p) => p.status === "rejected").length,
    total: places.length,
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#1a1612] flex items-center justify-center">
        <div className="text-[#9a8a72] font-mono text-sm animate-pulse">Verifying credentials...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#1a1612] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="submit-card rounded-xl p-8 w-full max-w-sm relative overflow-hidden"
        >
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgba(122,107,82,0.15)] border border-[rgba(122,107,82,0.25)] flex items-center justify-center">
              <Lock size={20} className="text-[#9a8a72]" />
            </div>
            <h1 className="font-cinzel text-xl text-[#3d3228] mb-1">Archivist's Console</h1>
            <p className="text-[11px] font-mono text-[#7a6e5e] mb-6 uppercase tracking-wider">
              Authorized personnel only
            </p>

            <form onSubmit={login} className="space-y-4">
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter access code"
                className="submit-input w-full py-2.5 px-3 text-sm text-center tracking-[0.2em]"
                autoFocus
              />
              {error && (
                <p className="text-[11px] font-mono text-[#7a3a2a]">{error}</p>
              )}
              <button
                type="submit"
                className="submit-btn w-full py-2.5 rounded-lg text-[11px]"
              >
                Unlock
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1612]">
      {/* Header */}
      <header className="border-b border-[rgba(122,107,82,0.15)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-[#9a8a72]" />
          <h1 className="font-cinzel text-lg text-[#ddd0bc]">Archivist's Console</h1>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#9a8a72] hover:text-[#ddd0bc] transition-colors"
        >
          <LogOut size={12} />
          Seal vault
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-[#a67c52]" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-[#6b7a5a]" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-[#7a3a2a]" },
            { label: "Total Records", value: stats.total, icon: FileText, color: "text-[#9a8a72]" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4 bg-[#252018] border border-[rgba(122,107,82,0.15)] rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} className={s.color} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a6e5e]">
                  {s.label}
                </span>
              </div>
              <p className="text-2xl font-cinzel text-[#ddd0bc]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[rgba(122,107,82,0.15)]">
          {[
            { key: "pending" as const, label: "Pending Review", count: stats.pending },
            { key: "all" as const, label: "All Sites", count: stats.total },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-[11px] font-mono uppercase tracking-wider transition-colors border-b-2 ${
                tab === t.key
                  ? "text-[#ddd0bc] border-[#9a8a72]"
                  : "text-[#7a6e5e] border-transparent hover:text-[#9a8a72]"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-[rgba(122,107,82,0.15)] rounded text-[10px]">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8a72]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records..."
              className="w-full bg-[#252018] border border-[rgba(122,107,82,0.2)] rounded-lg py-2 pl-9 pr-3 text-sm text-[#ddd0bc] placeholder:text-[#5a4e42] focus:border-[#9a8a72] outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 text-[#9a8a72] font-mono text-sm animate-pulse">
            Retrieving archives...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#5a4e42] font-mono text-sm">
            {tab === "pending" ? "No submissions awaiting review." : "No records found."}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((place) => (
              <div
                key={place._id}
                className="submit-card rounded-lg p-5 relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                            place.status === "pending"
                              ? "bg-[rgba(166,124,82,0.15)] text-[#a67c52] border border-[rgba(166,124,82,0.25)]"
                              : place.status === "approved"
                              ? "bg-[rgba(107,122,90,0.15)] text-[#6b7a5a] border border-[rgba(107,122,90,0.25)]"
                              : "bg-[rgba(122,58,42,0.15)] text-[#7a3a2a] border border-[rgba(122,58,42,0.25)]"
                          }`}
                        >
                          {place.status}
                        </span>
                        <span className="text-[10px] font-mono text-[#9a8a72]">
                          Ref. {place.slug?.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-cinzel text-base text-[#3d3228] mb-1">
                        {place.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-[#7a6e5e]">
                        <span className="flex items-center gap-1">
                          <Globe size={10} />
                          {place.address.city}, {place.address.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={10} />
                          Danger {place.dangerLevel}/5
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={10} />
                          {place.viewCount || 0} views
                        </span>
                        {place.yearAbandoned && (
                          <span>Abandoned {place.yearAbandoned}</span>
                        )}
                      </div>
                      {place.contributorName && (
                        <p className="text-[10px] font-mono text-[#9a8a72] mt-1">
                          Submitted by {place.contributorName} · {new Date(place.submittedAt).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-[13px] text-[#4a3e32] mt-3 leading-relaxed line-clamp-3">
                        {place.history}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {place.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(place._id, "approved")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(107,122,90,0.1)] border border-[rgba(107,122,90,0.25)] rounded text-[10px] font-mono uppercase text-[#5a6b4a] hover:bg-[rgba(107,122,90,0.2)] transition-colors"
                          >
                            <CheckCircle size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(place._id, "rejected")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(122,58,42,0.1)] border border-[rgba(122,58,42,0.25)] rounded text-[10px] font-mono uppercase text-[#7a3a2a] hover:bg-[rgba(122,58,42,0.2)] transition-colors"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setEditing(place)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(122,107,82,0.08)] border border-[rgba(122,107,82,0.2)] rounded text-[10px] font-mono uppercase text-[#5a4e42] hover:bg-[rgba(122,107,82,0.15)] transition-colors"
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[rgba(15,12,9,0.85)] backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="submit-card rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-cinzel text-lg text-[#3d3228]">Edit Record</h2>
                <button onClick={() => setEditing(null)} className="text-[#9a8a72] hover:text-[#5a4e42]">
                  <XCircle size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="submit-label block mb-1.5">Place Name</label>
                  <input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="submit-input w-full py-2 px-3 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="submit-label block mb-1.5">Category</label>
                    <select
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value as any })}
                      className="submit-input w-full py-2 px-3 text-sm"
                    >
                      <option value="abandoned">Abandoned</option>
                      <option value="haunted">Haunted</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="submit-label block mb-1.5">Danger Level</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={editing.dangerLevel}
                      onChange={(e) => setEditing({ ...editing, dangerLevel: parseInt(e.target.value) })}
                      className="submit-input w-full py-2 px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="submit-label block mb-1.5">Year Abandoned</label>
                  <input
                    type="number"
                    value={editing.yearAbandoned || ""}
                    onChange={(e) => setEditing({ ...editing, yearAbandoned: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="submit-input w-full py-2 px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="submit-label block mb-1.5">Historical Record</label>
                  <textarea
                    rows={6}
                    value={editing.history}
                    onChange={(e) => setEditing({ ...editing, history: e.target.value })}
                    className="submit-input submit-textarea w-full py-2 px-3 text-sm"
                  />
                </div>

                <button
                  onClick={saveEdit}
                  className="submit-btn w-full py-3 rounded-lg text-[11px] flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}