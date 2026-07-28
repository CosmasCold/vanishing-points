"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SubmissionForm from "@/components/SubmissionForm";

export default function SubmitPage() {
  return (
    <main className="submit-page">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#8b7355] hover:text-[#c9b896] transition-colors text-sm font-mono mb-6"
          >
            <ArrowLeft size={14} />
            Return to atlas
          </Link>

          <div className="submit-card rounded-xl p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="font-cinzel text-2xl font-medium text-[#2a1f14] mb-1">
                Log a Discovery
              </h1>
              <p className="text-[#5a4a3a] text-sm mb-8 font-mono">
                Document a location for the archives. All submissions are verified before publication.
              </p>

              <SubmissionForm />
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}