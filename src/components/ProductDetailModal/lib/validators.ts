import type { PublicReview, ReviewStats } from "../types";

interface StatsRow {
  review_count: number;
  average_rating: number | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  remark: string | null;
  created_at: string;
}

export function isValidStatsRow(value: unknown): value is StatsRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.review_count === "number" &&
    (row.average_rating === null || typeof row.average_rating === "number")
  );
}

export function isValidReviewRow(value: unknown): value is ReviewRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.rating === "number" &&
    (row.remark === null || typeof row.remark === "string") &&
    typeof row.created_at === "string"
  );
}

export function mapStatsRow(row: StatsRow): ReviewStats {
  return { reviewCount: row.review_count, averageRating: row.average_rating };
}

export function mapReviewRow(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    rating: row.rating,
    remark: row.remark,
    createdAt: row.created_at,
  };
}
