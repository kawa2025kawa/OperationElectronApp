// src/shared/store/slices/services/jcService.ts

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

/**
 * API status → frontend JobStatus
 *
 * API:
 *   running
 *
 * その他:
 *   scriptRunning
 */
const mapApiStatusToJobStatus = (status?: string): JobStatus => {
  if (status === "running") {
    return JOB_STATUS.RUNNING;
  }

  return JOB_STATUS.scriptRunning;
};

export const jcService = {
  /**
   * JCステータス取得
   */
  async refreshJobStatus(kanriNo: string, jobId?: string): Promise<string> {
    const targetId = jobId ?? kanriNo;

    return commands.getJobStatus(targetId);
  },

  /**
   * JC実行
   */
  async executeJcJob(
    kanriNo: string,
    allEntities: Record<string, OperationItem>,
    jobDependencies: JobDependenciesJson | null,
    updateStatus: (status: OperationItem) => void,
  ): Promise<void> {
    const item = allEntities[kanriNo];

    if (!item) {
      throw new Error(`対象アイテムが存在しません: ${kanriNo}`);
    }

    /**
     * 依存チェック
     */
    if (jobDependencies) {
      const dependencyOk = checkJobDependencies(
        kanriNo,
        allEntities,
        jobDependencies,
      );

      if (!dependencyOk) {
        const message = "依存ジョブが未完了です";

        updateStatus(createErrorStatus(kanriNo, item, message));

        toast.error(message);

        return;
      }
    }

    try {
      /**
       * Electron IPC
       *
       * ↓
       * jobHandlers
       *
       * ↓
       * Tracker API
       */
      const result = await commands.fetchSingleJobStatus(kanriNo);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "JCステータス取得失敗");
      }

      const apiStatus = result.data.status;

      const nextStatus = mapApiStatusToJobStatus(apiStatus);

      updateStatus({
        ...item,

        status: nextStatus,

        startTime: result.data.startTime ?? item.startTime,

        endTime: result.data.endTime ?? item.endTime,

        expectedStartTime:
          result.data.expectedStartTime ?? item.expectedStartTime,

        expectedEndTime: result.data.expectedEndTime ?? item.expectedEndTime,

        comment:
          result.data.comment ??
          (nextStatus === JOB_STATUS.RUNNING ? "JC実行中" : "Script実行中"),

        substatus: result.data.substatus ?? item.substatus,

        info: result.data.info ?? item.info,
      });

      toast.info(`No.${kanriNo} JC実行開始`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      updateStatus(
        createErrorStatus(kanriNo, item, `JC実行エラー: ${message}`),
      );

      toast.error(`JC実行エラー: ${message}`);

      throw error;
    }
  },
};
