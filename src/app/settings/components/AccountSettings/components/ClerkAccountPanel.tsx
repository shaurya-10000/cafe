"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const CLERK_PANEL_ID = "clerk-account";

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function ClerkAccountPanel() {
  const isDark = useIsDark();

  return (
    <section
      id={CLERK_PANEL_ID}
      aria-label="Account and security"
      className="scroll-mt-6"
    >
      <UserProfile
        routing="hash"
        appearance={{
          baseTheme: isDark ? dark : undefined,
          variables: {
            borderRadius: "0.875rem",
            colorBackground: isDark ? "#18181b" : "#ffffff",
          },
          elements: {
            rootBox: { width: "100%" },
            cardBox: {
              width: "100%",
              maxWidth: "100%",
              boxShadow: "none",
              borderRadius: "2rem",
              border: isDark
                ? "1px solid rgba(255,255,255,0.05)"
                : "1px solid #e4e4e7",
            },
          },
        }}
      />
    </section>
  );
}
