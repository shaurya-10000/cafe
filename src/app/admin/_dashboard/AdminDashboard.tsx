"use client";

import { Suspense } from "react";

import AdminDashboardContent from "./AdminDashboardContent";
import { DashboardLoading } from "./components/DashboardLoading";

/** `useSearchParams` needs a Suspense boundary above it. */
export default function AdminDashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
