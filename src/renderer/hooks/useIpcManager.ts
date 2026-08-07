// src/renderer/hooks/useIpcManager.ts

import { useEffect } from "react";
import { useAppStore } from "@shared/store/index";
import type { OperationItem } from "@shared/types/operationType";

export const useIpcManager = (): void => {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    try {
      // Function から具体的な関数型 (...args: any[]) => any または (...args: unknown[]) => (() => void) へ変更
      const api = (
        window as unknown as {
          electronAPI?: {
            on?: (
              channel: string,
              callback: (...args: unknown[]) => void,
            ) => () => void;
          };
        }
      ).electronAPI;

      if (!api || typeof api.on !== "function") {
        console.warn("[IPC] electronAPI.on is not available on window.");
        return;
      }

      cleanup = api.on("operationStatusUpdated", (...args: unknown[]) => {
        const payload = args[0] as { status?: OperationItem };
        const update = payload?.status;
        if (!update) return;

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
