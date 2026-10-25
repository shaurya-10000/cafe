import { cn } from "@/lib/utils";

export interface FeedbackState {
  readonly kind: "success" | "error";
  readonly message: string;
}

export function Feedback({
  feedback,
}: {
  readonly feedback: FeedbackState | null;
}) {
  if (!feedback) return null;

  return (
    <p
      role={feedback.kind === "error" ? "alert" : "status"}
      className={cn(
        "text-xs font-bold",
        feedback.kind === "error"
          ? "text-red-500"
          : "text-emerald-600 dark:text-emerald-400",
      )}
    >
      {feedback.message}
    </p>
  );
}
