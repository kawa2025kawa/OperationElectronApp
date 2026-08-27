import { useEffect } from "react";
import { useAppStore } from "@shared/store/index";
import { commands } from "@shared/service/commands";
import { handleStatusToastNotification } from "@renderer/components/ui/toast/statusToastHandler";

export const useIpcManager = (): void => {
  useEffect(() => {
    let cleanupStatus: (() => void) | undefined;
    let cleanupTheme: (() => void) | undefined;

    try {
      // 1. ステータス更新受信
      cleanupStatus = commands.onOperationStatusUpdated((update) => {
        useAppStore.getState().updateItemStatus(update);
        handleStatusToastNotification(update);
      });

      // 2. テーマ変更受信
      cleanupTheme = commands.onThemeChanged((theme) => {
        useAppStore.getState().setTheme(theme);
      });
    } catch (error) {
      console.error("[IPC] Listener Error:", error);
    }

    return () => {
      cleanupStatus?.();
      cleanupTheme?.();
    };
  }, []);
};
