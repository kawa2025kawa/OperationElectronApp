import { toast } from "sonner";
import type { StateCreator } from "zustand";
import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store/index";

export interface PollingSlice {
  isPolling: boolean;
  lastPollTime: number | null;

  setIsPolling: (status: boolean) => void;
  updateLastPollTime: () => void;
  startPolling: () => Promise<void>;
  stopPolling: () => Promise<void>;
}

export const createPollingSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  PollingSlice
> = (set, get) => {
  return {
    isPolling: false,
    lastPollTime: null,

    setIsPolling: (status: boolean) =>
      set((state: AppState) => {
        state.isPolling = status;
      }),

    updateLastPollTime: () =>
      set((state: AppState) => {
        state.lastPollTime = Date.now();
      }),

    startPolling: async () => {
      console.log(
        "[PollingSlice] startPolling()",
        "current=",
        get().isPolling,
      );

      if (get().isPolling) {
        console.warn(
          "[PollingSlice] 監視はすでに開始されています。",
        );
        return;
      }

      try {
        const result = await commands.startPolling();

        console.log(
          "[PollingSlice] Main プロセスから応答",
          result,
        );

        set({
          isPolling: true,
        });

        console.log(
          "[PollingSlice] 自動監視を開始しました",
          "isPolling=",
          get().isPolling,
        );
      } catch (error: unknown) {
        console.error(
          "[PollingSlice] startPolling failed:",
          error,
        );

        toast.error("自動監視の開始に失敗しました");
      }
    },

    stopPolling: async () => {
      console.log(
        "[PollingSlice] stopPolling()",
        "current=",
        get().isPolling,
      );

      if (!get().isPolling) {
        return;
      }

      try {
        await commands.stopPolling();

        set({
          isPolling: false,
        });

        toast.success("自動監視を停止しました");

        console.log(
          "[PollingSlice] 自動監視を停止しました",
        );
      } catch (error: unknown) {
        console.error(
          "[PollingSlice] stopPolling failed:",
          error,
        );

        toast.error("自動監視の停止に失敗しました");
      }
    },
  };
};
