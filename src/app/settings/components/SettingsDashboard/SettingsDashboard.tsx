"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { SettingsContent } from "./components/SettingsContent";
import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsLoading } from "./components/SettingsLoading";
import { SettingsSidebar } from "./components/SettingsSidebar";
import { SidebarBackdrop } from "./components/SidebarBackdrop";
import { MENU_ITEMS } from "./constants";
import { useDrawer } from "./hooks/useDrawer";
import { useSignOut } from "./hooks/useSignOut";
import type { SettingsTab } from "./types";

export default function SettingsDashboard() {
  const { isLoaded } = useUser();
  const reducedMotion = useReducedMotion() ?? false;
  const sidebarId = useId();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { isOpen, open, close, drawerRef, triggerRef } = useDrawer();
  const { signOut, isSigningOut, error: signOutError } = useSignOut();

  // The dashboard scrolls inside its own container, so lock the page-level
  // scroll. This removes the browser scrollbar (and its reserved gutter) and
  // lets the inner scrollbar sit flush against the right edge.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      gutter: html.style.getPropertyValue("scrollbar-gutter"),
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.setProperty("scrollbar-gutter", "auto");

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      if (prev.gutter) html.style.setProperty("scrollbar-gutter", prev.gutter);
      else html.style.removeProperty("scrollbar-gutter");
    };
  }, []);

  const handleSelectTab = useCallback(
    (tab: SettingsTab) => {
      setActiveTab(tab);
      close();
    },
    [close],
  );

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  if (!isLoaded) return <SettingsLoading />;

  return (
    <div className="flex h-screen overflow-hidden bg-cafe-bg font-sans text-cafe-fg">
      <SidebarBackdrop
        isOpen={isOpen}
        reducedMotion={reducedMotion}
        onClose={close}
      />

      <SettingsSidebar
        id={sidebarId}
        drawerRef={drawerRef}
        isOpen={isOpen}
        items={MENU_ITEMS}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onClose={close}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        signOutError={signOutError}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <SettingsHeader
          sidebarId={sidebarId}
          isSidebarOpen={isOpen}
          triggerRef={triggerRef}
          activeTabLabel={activeTab}
          onOpenSidebar={open}
        />

        <SettingsContent activeTab={activeTab} reducedMotion={reducedMotion} />
      </main>
    </div>
  );
}
