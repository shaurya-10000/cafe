/**
 * Writes text to the clipboard. Uses the async Clipboard API in secure
 * contexts and falls back to execCommand elsewhere. Throws on failure.
 */
export async function writeToClipboard(text: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const successful = document.execCommand("copy");
  textarea.remove();
  if (!successful) throw new Error("Clipboard fallback failed.");
}
