/** Thin themed scrollbar used by the main scroll area. */
export function ScrollbarStyles() {
  return (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: var(--accent-muted);
        border-radius: 20px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: var(--accent);
      }
    `}</style>
  );
}
