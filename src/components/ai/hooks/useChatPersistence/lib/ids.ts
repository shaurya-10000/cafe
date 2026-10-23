export function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Insecure-context fallback (plain http on a LAN, very old browsers).
  return `local-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}