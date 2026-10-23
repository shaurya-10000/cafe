import SettingsDashboard from "./components/SettingsDashboard";

/**
 * Auth is enforced server-side by ./layout.tsx before this renders.
 * All interactive state lives in the client SettingsDashboard.
 */
export default function SettingsPage() {
  return <SettingsDashboard />;
}
