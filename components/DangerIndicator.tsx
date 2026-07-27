import { Skull } from "lucide-react";

interface Props {
  level: number;
}

export default function DangerIndicator({ level }: Props) {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skull
          key={i}
          size={10}
          className={
            i < level ? "text-warning" : "text-fog/40"
          }
        />
      ))}
    </span>
  );
}