export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function getDangerLabel(level: number): string {
  const labels: Record<number, string> = {
    1: "minimal",
    2: "caution advised",
    3: "hazardous",
    4: "extremely dangerous",
    5: "do not enter",
  };
  return labels[level] || "unknown";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}