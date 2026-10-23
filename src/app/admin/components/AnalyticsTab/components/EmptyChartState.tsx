import { memo } from "react";

import { BarChart3 } from "lucide-react";

interface EmptyChartStateProps {
  label: string;
}

export const EmptyChartState = memo(function EmptyChartState({
  label,
}: EmptyChartStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
      <BarChart3 size={28} strokeWidth={1.5} aria-hidden="true" />

      <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
    </div>
  );
});
