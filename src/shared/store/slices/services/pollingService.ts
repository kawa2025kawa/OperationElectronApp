import { toast } from "sonner";
import { commands } from "@shared/api/commands";
import { unwrapResult } from "@shared/utils/apiUtils";

export const pollingService = {
  /** Polling 開始 */
  async startPolling(): Promise<void> {
    const res = await commands.startPolling();
    unwrapResult(res, "ポーリングの開始に失敗しました");
    toast.success("ポーリングを開始しました");
  },

  /** Polling 停止 */
  async stopPolling(): Promise<void> {
    const res = await commands.stopPolling();
    unwrapResult(res, "ポーリングの停止に失敗しました");
    toast.success("ポーリングを停止しました");
  },
};
