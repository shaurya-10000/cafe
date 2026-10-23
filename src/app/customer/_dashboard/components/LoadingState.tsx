import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center py-32">
      <Loader2
        className="animate-spin text-blue-600"
        size={40}
        aria-hidden="true"
      />
      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
        Syncing Data...
      </p>
    </div>
  );
}