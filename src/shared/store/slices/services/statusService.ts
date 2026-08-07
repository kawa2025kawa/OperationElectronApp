// src/shared/store/slices/services/statusService.ts
import { commands } from "@shared/api/commands";
import { unwrapResult } from "@shared/utils/apiUtils";

export interface UpdateJobStatusParams {
  kanriNo: string;
  status: string;
  comment?: string;
  expectedStartTime?: string;
}

export const statusService = {
  /** 手動でのジョブステータス更新 */
  async updateJobStatus({
    kanriNo,
    status,
  }: UpdateJobStatusParams): Promise<void> {
    console.log(
      `📝 [statusService.updateJobStatus] リクエスト送信: kanriNo=${kanriNo}, status=${status}`,
    );
    try {
      const res = await commands.updateJobStatus(kanriNo, status);
      unwrapResult(res, "ステータスの更新に失敗しました");
      console.log(
        `✅ [statusService.updateJobStatus] 更新成功: kanriNo=${kanriNo}`,
      );
    } catch (error) {
      console.error(
        `🛑 [statusService.updateJobStatus] 更新失敗: kanriNo=${kanriNo}`,
        error,
      );
      throw error;
    }
  },

  /** 全ステータスのリセット（削除） */
  async resetAllStatuses(): Promise<void> {
    console.log(
      `🧹 [statusService.resetAllStatuses] 全ステータス削除コマンド実行中...`,
    );
    try {
      const res = await commands.deleteAllJobStatuses();
      unwrapResult(res, "全ステータスの削除に失敗しました");
      console.log(`✅ [statusService.resetAllStatuses] 全ステータス削除成功`);
    } catch (error) {
      console.error(
        `🛑 [statusService.resetAllStatuses] 全ステータス削除失敗`,
        error,
      );
      throw error;
    }
  },
};
