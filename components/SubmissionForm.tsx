"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, MapPin, AlertTriangle, Send, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { geocodeAddress } from "@/lib/geocode";
import { PlaceInput } from "@/types";
import Toast from "./Toast";
import { generateId } from "@/lib/utils";

interface Props {
  onSuccess?: () => void;
}

export default function SubmissionForm({ onSuccess }: Props) {
  const router = useRouter();
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);

  const [form, setForm] = useState<Partial<PlaceInput>>({
    category: "abandoned",
    dangerLevel: 1,
    photos: [],
    hauntingReports: [],
  });

  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addToast = (message: string, type: "success" | "error" | "info") => {
    setToasts((prev) => [...prev, { id: generateId(), message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if ((form.photos?.length || 0) + acceptedFiles.length > 5) {
        addToast("Maximum 5 photos allowed", "error");
        return;
      }

      setUploading(true);
      const newPhotos: string[] = [];

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.url) newPhotos.push(data.url);
        } catch {
          addToast(`Failed to upload ${file.name}`, "error");
        }
      }

      setForm((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos],
      }));
      setUploading(false);
    },
    [form.photos]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 5 * 1024 * 1024,
  });

  const handleAddressSearch = async () => {
    if (!addressQuery.trim()) return;
    const results = await geocodeAddress(addressQuery);
    setAddressResults(results);
  };

  const selectAddress = (result: any) => {
    const city =
      result.context?.find((c: any) => c.id?.includes("place"))?.text ||
      result.text;
    const country =
      result.context?.find((c: any) => c.id?.includes("country"))?.text || "";

    setForm((prev) => ({
      ...prev,
      coordinates: result.center,
      address: {
        city,
        country,
        formatted: result.place_name,
      },
    }));
    setAddressResults([]);
    setAddressQuery(result.place_name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        addToast(
          "Your discovery has been logged in the archives. Awaiting verification.",
          "success"
        );
        setTimeout(() => {
          onSuccess?.();
          router.push("/");
        }, 2000);
      } else {
        const err = await res.json();
        addToast(err.message || "Failed to submit", "error");
      }
    } catch {
      addToast("An error occurred. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <Toast toasts={toasts} onRemove={removeToast} />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="submit-label block mb-2">Place name</label>
          <input
            type="text"
            required
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="submit-input w-full py-2.5 px-3 text-sm"
            placeholder="What is this place called?"
          />
        </motion.div>

        {/* Category */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="submit-label block mb-3">Classification</label>
          <div className="flex gap-2">
            {(["abandoned", "haunted", "both"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all ${
                  form.category === cat
                    ? "bg-[#4a3e32] border-[#4a3e32] text-[#ddd0bc]"
                    : "border-[rgba(139,115,85,0.3)] text-[#7a6e5e] hover:border-[#9a8a72]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <label className="submit-label block mb-2">Location</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8a72]"
              />
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
                className="submit-input w-full py-2.5 pl-9 pr-3 text-sm"
                placeholder="Search for an address..."
              />
            </div>
            <button
              type="button"
              onClick={handleAddressSearch}
              className="px-4 py-2 bg-[rgba(60,40,20,0.08)] border border-[rgba(139,115,85,0.25)] rounded-lg text-[#7a6e5e] text-xs font-mono hover:text-[#3d3228] hover:border-[#9a8a72] transition-all"
            >
              Locate
            </button>
          </div>

          {addressResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-[#e8dcc8] border border-[rgba(139,115,85,0.25)] rounded-lg shadow-xl overflow-hidden">
              {addressResults.map((result, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectAddress(result)}
                  className="w-full px-4 py-3 text-left text-sm text-[#4a3e32] hover:bg-[rgba(139,115,85,0.1)] hover:text-[#1a120b] transition-colors border-b border-[rgba(139,115,85,0.15)] last:border-0"
                >
                  {result.place_name}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Year & Danger */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="submit-label block mb-2">Year abandoned</label>
            <input
              type="number"
              value={form.yearAbandoned || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  yearAbandoned: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="submit-input w-full py-2.5 px-3 text-sm"
              placeholder="e.g. 1986"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="submit-label block mb-2">Danger level</label>
            <div className="flex items-center gap-3">
              <AlertTriangle size={14} className="text-[#9a8a72]" />
              <input
                type="range"
                min={1}
                max={5}
                value={form.dangerLevel || 1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dangerLevel: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5,
                  })
                }
                className="flex-1 accent-[#7a3a2a]"
              />
              <span className="font-mono text-sm text-[#3d3228] w-4">
                {form.dangerLevel}
              </span>
            </div>
          </motion.div>
        </div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <label className="submit-label block mb-2">History & description</label>
          <textarea
            required
            rows={5}
            value={form.history || ""}
            onChange={(e) => setForm({ ...form, history: e.target.value })}
            className="submit-input submit-textarea w-full py-2.5 px-3 text-sm"
            placeholder="Document what you know about this place..."
            maxLength={2000}
          />
          <div className="text-right text-[10px] text-[#9a8a72] font-mono mt-1">
            {(form.history?.length || 0)}/2000
          </div>
        </motion.div>

        {/* Haunting Reports */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="submit-label block mb-2">Spectral accounts (optional)</label>
          <textarea
            rows={3}
            value={(form.hauntingReports || []).join("\n")}
            onChange={(e) =>
              setForm({
                ...form,
                hauntingReports: e.target.value
                  .split("\n")
                  .filter((r) => r.trim()),
              })
            }
            className="submit-input submit-textarea w-full py-2.5 px-3 text-sm"
            placeholder="One report per line..."
          />
        </motion.div>

        {/* Photo Upload */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <label className="submit-label block mb-2">Visual evidence (max 5)</label>
          <div
            {...getRootProps()}
            className={`submit-dropzone p-8 text-center cursor-pointer ${
              isDragActive ? "active" : ""
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={24} className="mx-auto text-[#9a8a72] mb-2" />
            <p className="text-sm text-[#7a6e5e]">
              {isDragActive
                ? "Drop the evidence here..."
                : "Drag & drop photos, or click to select"}
            </p>
            <p className="text-[11px] text-[#9a8a72] mt-1 font-mono">
              JPG, PNG up to 5MB each
            </p>
          </div>

          {form.photos && form.photos.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {form.photos.map((photo, i) => (
                <div key={photo} className="relative w-20 h-20 rounded-lg overflow-hidden group border border-[rgba(139,115,85,0.2)]">
                  <Image
                    src={photo}
                    alt={`Upload ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        photos: form.photos?.filter((_, idx) => idx !== i),
                      })
                    }
                    className="absolute top-1 right-1 w-5 h-5 bg-[#3d3228]/80 rounded-full flex items-center justify-center text-[#d4c8b4] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Contributor */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="submit-label block mb-2">Your name</label>
            <input
              type="text"
              required
              value={form.contributorName || ""}
              onChange={(e) =>
                setForm({ ...form, contributorName: e.target.value })
              }
              className="submit-input w-full py-2.5 px-3 text-sm"
              placeholder="How shall we credit you?"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <label className="submit-label block mb-2">Email</label>
            <input
              type="email"
              required
              value={form.contributorEmail || ""}
              onChange={(e) =>
                setForm({ ...form, contributorEmail: e.target.value })
              }
              className="submit-input w-full py-2.5 px-3 text-sm"
              placeholder="For verification only"
            />
          </motion.div>
        </div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <button
            type="submit"
            disabled={submitting || uploading}
            className="submit-btn w-full py-4 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="animate-pulse">Logging to archives...</span>
            ) : (
              <>
                <Send size={14} />
                Submit discovery
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}