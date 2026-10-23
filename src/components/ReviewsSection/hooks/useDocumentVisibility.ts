import { useEffect, useState } from "react";

export function useDocumentVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const update = (): void => {
      setIsVisible(document.visibilityState === "visible");
    };

    update();
    document.addEventListener("visibilitychange", update);

    return () => {
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return isVisible;
}
