import { toast } from "sonner";

import { commands } from "@shared/api/commands";
import type {
  JobDependenciesJson,
  JobStatus,
  OperationItem,
} from "@shared/types/operationType";
import { JOB_STATUS } from "@shared/types/operationType";

import { checkJobDependencies } from "../helpers/dependencyHelper";
import { createErrorStatus } from "../helpers/statusFactory";

const mapApiStatus = (status: JobStatus | null | undefined): JobStatus =>
  status ?? JOB_STATUS.SCHEDULED;

export const jcService = {
  async executeJcJob(
    kanriNo: string,
    entities: Record<string, OperationItem>,
    dependencies: JobDependenciesJson | null,
    updateStatus: (status: OperationItem) => void,
  ): Promise<void> {
    const item = entities[kanriNo];

    if (!item) {
      throw new Error(`対象が存在しません: ${kanriNo}`);
    }

    if (
      dependencies &&
      !checkJobDependencies(kanriNo, entities, dependencies).ok
    ) {
      const message = "依存ジョブが未完了です。";

      updateStatus(createErrorStatus(kanriNo, item, message));
      toast.error(message);
      return;
    }

    try {
      const result = await commands.fetchSingleJobStatus(kanriNo);
      const status = mapApiStatus(result.status);

      updateStatus({
        ...item,
        status,
        startTime: result.startTime ?? item.startTime,
        endTime: result.endTime ?? item.endTime,
        expectedStartTime: result.expectedStartTime ?? item.expectedStartTime,
        expectedEndTime: result.expectedEndTime ?? item.expectedEndTime,
        comment:
          result.comment ??
          (status === JOB_STATUS.RUNNING ? "JC実行中" : "Script実行中"),
        substatus: result.substatus ?? item.substatus,
        info: result.info ?? item.info,
      });

      toast.info(`No.${kanriNo} JC実行を開始しました`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      updateStatus(
        createErrorStatus(kanriNo, item, `JC実行取得エラー: ${message}`),
      );

      toast.error(`JC実行取得エラー: ${message}`);
      throw error;
    }
  },
};
