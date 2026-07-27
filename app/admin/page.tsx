"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Eye } from "lucide-react";
import { Place } from "@/types";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      fetch("/api/places?status=pending")
        .then((r) => r.json())
        .then((data) => setPlaces(data.places || []));
    }
  }, [authenticated]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    }
  };

  const handleVerify = async (id: string, status: "verified" | "rejected") => {
    const res = await fetch(`/api/places/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setPlaces((prev) => prev.filter((p) => p._id !== id));
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <form
          onSubmit={handleAuth}
          className="w-full max-w-sm px-6"
        >
          <h1 className="font-cinzel text-2xl text-bone mb-6 text-center">
            Archives administration
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access key"
            className="w-full py-3 px-4 bg-shadow border border-fog/40 rounded-lg text-bone text-center placeholder:text-ash/30 focus:border-bone transition-colors"
          />
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-ember/20 border border-ember/40 rounded-lg font-cinzel text-sm uppercase tracking-wider text-bone hover:bg-ember/30 transition-all"
          >
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ash hover:text-bone transition-colors text-sm font-mono mb-8"
        >
          <ArrowLeft size={14} />
          Return to atlas
        </Link>

        <h1 className="font-cinzel text-3xl text-bone mb-2">
          Pending discoveries
        </h1>
        <p className="text-ash text-sm mb-8">
          {places.length} awaiting verification
        </p>

        {places.length === 0 ? (
          <div className="text-center py-24 text-ash font-mono">
            No pending submissions.
          </div>
        ) : (
          <div className="space-y-4">
            {places.map((place) => (
              <div
                key={place._id}
                className="bg-shadow border border-fog/40 rounded-xl p-6 hover:border-ash/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-cinzel text-lg text-bone">
                      {place.name}
                    </h3>
                    <p className="text-ash text-sm mt-1 font-mono">
                      {place.address.formatted}
                    </p>
                    <p className="text-ash/70 text-sm mt-2 line-clamp-2">
                      {place.history}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-[11px] text-ash/50 font-mono">
                      <span>By {place.contributor.name}</span>
                      <span>{place.contributor.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/place/${place.slug}`}
                      target="_blank"
                      className="p-2 bg-fog/30 rounded-lg text-ash hover:text-bone transition-colors"
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      onClick={() => handleVerify(place._id, "verified")}
                      className="p-2 bg-specter/20 rounded-lg text-specter hover:bg-specter/30 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleVerify(place._id, "rejected")}
                      className="p-2 bg-warning/20 rounded-lg text-warning hover:bg-warning/30 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}