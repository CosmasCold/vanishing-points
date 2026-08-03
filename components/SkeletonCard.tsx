export default function SkeletonCard() {
  return (
    <div
      className="border rounded-lg overflow-hidden animate-flicker"
      style={{
        backgroundColor: "#0c0a08",
        borderColor: "rgba(122,107,82,0.1)",
      }}
    >
      <div className="h-48" style={{ backgroundColor: "rgba(122,107,82,0.06)" }} />
      <div className="p-5 space-y-3">
        <div className="h-5 rounded w-3/4" style={{ backgroundColor: "rgba(122,107,82,0.1)" }} />
        <div className="h-3 rounded w-1/2" style={{ backgroundColor: "rgba(122,107,82,0.08)" }} />
        <div className="h-3 rounded w-full mt-4" style={{ backgroundColor: "rgba(122,107,82,0.06)" }} />
      </div>

      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          32% { opacity: 0.65; }
          33% { opacity: 0.9; }
          41% { opacity: 0.55; }
          42% { opacity: 0.85; }
          61% { opacity: 0.45; }
          62% { opacity: 0.7; }
          80% { opacity: 0.5; }
          81% { opacity: 0.9; }
        }
        .animate-flicker {
          animation: flicker 2.8s infinite;
        }
      `}</style>
    </div>
  );
}