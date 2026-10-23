import { useEffect } from "react";

import {
  applyScrollLock,
  installScrollLockInfrastructure,
  releaseScrollLock,
  touchWatchdogGrace,
  uninstallScrollLockInfrastructure,
} from "../lib/scrollLockStore";

export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    installScrollLockInfrastructure();

    if (!locked) {
      return () => {
        uninstallScrollLockInfrastructure();
      };
    }

    touchWatchdogGrace();
    applyScrollLock();

    return () => {
      touchWatchdogGrace();
      releaseScrollLock();
      uninstallScrollLockInfrastructure();
    };
  }, [locked]);
}
