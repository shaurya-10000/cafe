import { AnimatePresence, motion } from "framer-motion";
import AccountSettings from "../../AccountSettings";
import NotificationSettings from "../../NotificationSettings/NotificationSettings";
import OrderPreferences from "../../OrderPreferences/OrderPreferences";
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
      return <AccountSettings />;
    case "orders":
      return <OrderPreferences />;
    case "notifications":
      return <NotificationSettings />;
    case "appearance":
      return <ThemeSettings />;
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
      <div className="mx-auto max-w-4xl p-5 lg:p-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeTab} {...getTabPanelMotion(reducedMotion)}>
            <TabView tab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
