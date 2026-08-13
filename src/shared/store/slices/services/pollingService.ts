// src/shared/store/slices/services/pollingService.ts

import { toast } from "sonner";

import { commands } from "@shared/api/commands";

export const pollingService = {
  async startPolling(): Promise<void> {
    try {
      await commands.startPolling();
      toast.success("ポーリングを開始しました");
    } catch (error) {
      console.error("[pollingService.startPolling] Failed:", error);
      throw error;
    }
  },

  async stopPolling(): Promise<void> {
    try {
      await commands.stopPolling();
      toast.success("ポーリングを停止しました");
    } catch (error) {
      console.error("[pollingService.stopPolling] Failed:", error);
      throw error;
    }
  },
};
