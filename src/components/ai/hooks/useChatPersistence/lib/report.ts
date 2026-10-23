export function reportDev(label: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(label, error);
  }
}