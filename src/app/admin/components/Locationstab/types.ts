import type { BusinessLocation } from "@/components/LocationsSection";

export interface AdminLocation extends BusinessLocation {
  isActive: boolean;
}

export interface LocationsTabProps {
  initialLocations: AdminLocation[];
}

export type Banner = { type: "success" | "error"; message: string } | null;

export type FieldErrors = Record<string, string[] | undefined>;

export type ReorderDirection = "up" | "down";

export type PendingAction = {
  kind: "save" | "toggle" | "delete" | "reorder";
  id?: string;
};
