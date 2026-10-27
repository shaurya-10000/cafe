import { Suspense } from "react";

import SettingsDashboard from "./components/SettingsDashboard";
import { SettingsLoading } from "./components/SettingsDashboard/components/SettingsLoading";

/**
 * Auth is enforced server-side by ./layout.tsx before this renders.
 * All interactive state lives in the client SettingsDashboard, which reads
 * `?tab=` (hence the Suspense boundary).
 */
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsDashboard />
    </Suspense>
  );
}
