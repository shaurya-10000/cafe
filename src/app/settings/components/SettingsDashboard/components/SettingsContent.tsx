import { AnimatePresence, motion } from "framer-motion";
import AccountSettings from "../../AccountSettings";
import ThemeSettings from "../../ThemeSettings";
import { getTabPanelMotion } from "../lib/motion";
import type { SettingsTab } from "../types";

interface SettingsContentProps {
  readonly activeTab: SettingsTab;
  readonly reducedMotion: boolean;
}

function TabView({ tab }: { readonly tab: SettingsTab }) {
  switch (tab) {
    case "profile":
      return <AccountSettings activeTab="profile" />;
    case "appearance":
      return <ThemeSettings />;
    case "security":
      return <AccountSettings activeTab="security" />;
    default:
      return null;
  }
}

export function SettingsContent({
  activeTab,
  reducedMotion,
}: SettingsContentProps) {
  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl p-8 lg:p-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeTab} {...getTabPanelMotion(reducedMotion)}>
            <TabView tab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
