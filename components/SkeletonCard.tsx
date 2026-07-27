export default function SkeletonCard() {
  return (
    <div className="bg-shadow border border-fog/20 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-fog/20" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-fog/20 rounded w-3/4" />
        <div className="h-3 bg-fog/20 rounded w-1/2" />
        <div className="h-3 bg-fog/20 rounded w-full mt-4" />
      </div>
    </div>
  );
}