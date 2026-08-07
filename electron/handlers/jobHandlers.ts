import { ipcMain } from "electron";

import type { JobStatus } from "@shared/types/operationType";

import { fetchTrackerByJobId } from "../services/operation/tracker";

import { getTargetByKanriNo } from "../services/operation/targetManager";

export interface FetchJobStatusResponse {
  kanriNo: string;

  jobId: string;

  status?: JobStatus;

  startTime?: string;

  endTime?: string;

  expectedStartTime?: string;

  expectedEndTime?: string;

  comment?: string;

  substatus?: string[];

  info?: string;

  updatedAt: string;
}

interface FetchJobStatusResult {
  success: boolean;

  data?: FetchJobStatusResponse;

  error?: string;
}

/**
 * Job状態取得 IPC
 *
 * flow:
 *
 * kanriNo
 * ↓
 * OperationItem取得
 * ↓
 * jobId取得
 * ↓
 * Tracker API問い合わせ
 * ↓
 * JobStatus返却
 */
export function setupJobHandlers(): void {
  ipcMain.handle(
    "fetchSingleJobStatus",
    async (
      _event,
      args?: {
        kanriNo?: string;
      },
    ): Promise<FetchJobStatusResult> => {
      const kanriNo = args?.kanriNo;

      console.log("[fetchSingleJobStatus]", {
        kanriNo,
      });

      if (!kanriNo) {
        return {
          success: false,

          error: "kanriNo is required",
        };
      }

      try {
        /**
         * 管理No
         *
         * ↓
         *
         * OperationItem
         */
        const target = getTargetByKanriNo(kanriNo);

        if (!target) {
          throw new Error(`Target not found kanriNo=${kanriNo}`);
        }

        /**
         * jobIdはTracker API必須
         *
         * OperationItem:
         * string | null | undefined
         *
         * ↓
         *
         * stringへ絞り込み
         */
        const jobId = target.jobId;

        if (!jobId || jobId === "-") {
          throw new Error(`Invalid jobId kanriNo=${kanriNo}`);
        }

        console.log("[Tracker Target]", {
          kanriNo,
          jobId,
        });

        /**
         * Tracker API問い合わせ
         *
         * OperationItemをそのまま渡す
         *
         * tracker.ts:
         * - jobId
         * - scheduledTime
         * - kanshiTime
         *
         * からURL生成
         */
        const trackers = await fetchTrackerByJobId(target);

        if (trackers.length === 0) {
          return {
            success: false,

            error: "Tracker data not found",
          };
        }

        const tracker = trackers[0];

        const data: FetchJobStatusResponse = {
          kanriNo,

          jobId,

          status: tracker.status,

          startTime: tracker.start_time,

          endTime: tracker.end_time,

          expectedStartTime: tracker.expected_start_time,

          expectedEndTime: tracker.expected_end_time,

          comment: tracker.comment,

          substatus: tracker.substatus,

          info: tracker.info,

          updatedAt: new Date().toISOString(),
        };

        console.log("[Job Status Result]", data);

        return {
          success: true,

          data,
        };
      } catch (error) {
        console.error("[fetchSingleJobStatus] failed", error);

        return {
          success: false,

          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
}
