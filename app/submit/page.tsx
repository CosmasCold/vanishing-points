import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SubmissionForm from "@/components/SubmissionForm";

export const metadata = {
  title: "Log a Discovery | Vanishing Points",
  description: "Submit an abandoned or haunted location to the archives.",
};

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-void">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ash hover:text-bone transition-colors text-sm font-mono mb-8"
        >
          <ArrowLeft size={14} />
          Return to atlas
        </Link>

        <header className="mb-10">
          <h1 className="font-cinzel text-3xl font-medium text-bone">
            Log a discovery
          </h1>
          <p className="text-ash mt-2 text-sm leading-relaxed">
            Document a place that time forgot. All submissions are reviewed
            before being added to the public archives.
          </p>
        </header>

        <SubmissionForm />
      </div>
    </main>
  );
}