export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

/** Minimal className joiner (clsx-style) with no external dependency. */
export function cn(...inputs: ClassValue[]): string {
  const output: string[] = [];

  const walk = (value: ClassValue): void => {
    if (!value) return;

    if (typeof value === "string" || typeof value === "number") {
      output.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    Object.entries(value).forEach(([key, enabled]) => {
      if (enabled) output.push(key);
    });
  };

  inputs.forEach(walk);

  return output.join(" ");
}
