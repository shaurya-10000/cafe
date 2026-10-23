import { MessageSquare } from "lucide-react";

import { NOTE_CLASS } from "../styles";

export function SpecialRequests({ text }: { text: string }) {
  return (
    <div className={NOTE_CLASS}>
      <MessageSquare
        size={14}
        className="mt-0.5 shrink-0 text-gray-500"
        aria-hidden="true"
      />
      <p className="text-[10px] font-bold text-gray-500">
        <span className="mr-1 text-[8px] font-black uppercase tracking-wider text-gray-500">
          Note:
        </span>
        {text}
      </p>
    </div>
  );
}