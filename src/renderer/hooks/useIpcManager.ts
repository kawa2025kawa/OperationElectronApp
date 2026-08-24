// src/renderer/hooks/useIpcManager.ts

import { useEffect } from "react";
import { useAppStore } from "@shared/store/index";
import { commands } from "@shared/api/commands";

export const useIpcManager = (): void => {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    try {
      cleanup = commands.onOperationStatusUpdated((update) => {
        useAppStore.getState().updateItemStatus(update);
      });
    } catch (error) {
      console.error("[IPC] Listener Error:", error);
    }
    return () => {
      cleanup?.();
    };
  }, []);
};
