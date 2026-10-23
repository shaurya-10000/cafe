export function markdownToSpeech(markdown: string): string {
  let text = markdown;
  text = text.replace(/```[\s\S]*?```/g, " code block ");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "");
  text = text.replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, " ");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, "$1");
  text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_, inner: string) => inner.split("|").map((cell) => cell.trim()).filter((cell) => cell.length > 0).join(", "));
  text = text.replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, " ");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
