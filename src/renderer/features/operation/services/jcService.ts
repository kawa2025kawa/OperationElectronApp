// src/renderer/features/operation/services/jcService.ts

import { toast } from "sonner";
import { commands } from "@shared/api/commands";
import { checkJobDependencies } from "@renderer/features/operation/helpers/dependencyHelper";
import { createErrorStatus } from "@renderer/features/operation/helpers/statusFactory";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";

export const jcService = {
  async executeJcJob(
    kanriNo: string,
    entities: Record<string, OperationItem>,
    updateStatus: (item: OperationItem) => void,
  ): Promise<void> {
    const item = entities[kanriNo];
    if (!item) {
      throw new Error(`対象データが存在しません: ${kanriNo}`);
    }

    if (item.dependency && !checkJobDependencies(kanriNo, entities).ok) {
      const message = "前提作業が完了していません";
      updateStatus(createErrorStatus(kanriNo, item, message));
      toast.error(message);
      return;
    }

    try {
      const result = await commands.fetchSingleJobStatus(kanriNo);
      const status = result.status ?? JOB_STATUS.SCHEDULED;

      updateStatus({
        ...item,
        status,
        startTime: result.startTime ?? item.startTime,
        endTime: result.endTime ?? item.endTime,
        expectedStartTime: result.expectedStartTime ?? item.expectedStartTime,
        expectedEndTime: result.expectedEndTime ?? item.expectedEndTime,
        comment:
          result.comment ??
          (status === JOB_STATUS.RUNNING ? "JC実行中..." : "Script実行完了"),
        substatus: result.substatus ?? item.substatus,
        info: result.info ?? item.info,
      });

      toast.info(`No.${kanriNo} JCステータスを更新しました`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errText = `JC照会失敗: ${message}`;
      updateStatus(createErrorStatus(kanriNo, item, errText));
      toast.error(errText);
      throw error;
    }
  },
};
