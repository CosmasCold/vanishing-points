// utilities/redact.ts
export function redact(text: string): string {
  return text.replace(/[a-zA-Z0-9]/g, '█');
}