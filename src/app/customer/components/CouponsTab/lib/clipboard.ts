/**
 * Best-effort clipboard write. It can fail for reasons outside our control
 * (permissions policy, non-secure context where `navigator.clipboard` is
 * undefined, user-gesture timing), so failures are logged rather than
 * surfaced: the user can retry, and an error modal for a failed copy would
 * be more disruptive than helpful.
 */
export async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("[CouponsTab] clipboard write failed", { text }, error);
    return false;
  }
}