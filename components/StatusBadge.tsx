import { PlaceCategory } from "@/types";

interface Props {
  category: PlaceCategory;
}

export default function StatusBadge({ category }: Props) {
  const styles: Record<PlaceCategory, string> = {
    abandoned: "bg-ember/15 text-ember border-ember/30",
    haunted: "bg-bone/10 text-bone border-bone/20",
    both: "bg-specter/15 text-specter border-specter/30",
  };

  const labels: Record<PlaceCategory, string> = {
    abandoned: "Abandoned",
    haunted: "Haunted",
    both: "Abandoned & Haunted",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-mono uppercase tracking-wider ${styles[category]}`}
    >
      {labels[category]}
    </span>
  );
}