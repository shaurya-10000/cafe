import { memo } from "react";

import { Sparkles } from "lucide-react";

import type { TimeRange } from "../types";
import { TimeRangeSelector } from "./TimeRangeSelector";

interface AnalyticsHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onOpenAssistant?: () => void;
}

export const AnalyticsHeader = memo(function AnalyticsHeader({
  timeRange,
  onTimeRangeChange,
  onOpenAssistant,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-cafe-border bg-cafe-fg/[0.02] p-6 md:flex-row md:items-center">
      <div>
        <h2 className="text-2xl font-bold tracking-tighter text-cafe-fg">
          Performance Engine
        </h2>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Cafe Analytics Protocol
        </p>
      </div>

      <div className="flex items-center gap-3">
        {onOpenAssistant && (
          <button
            type="button"
            onClick={onOpenAssistant}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Sparkles size={14} aria-hidden="true" />
            Ask Analytics AI
          </button>
        )}

        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
      </div>
    </div>
  );
});
