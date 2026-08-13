// electron/services/operation/jobRunner.ts

import type { JobStatus } from "@shared/types/operationType";

import { updateStatus } from "../statusManager";
import { dispatchScript } from "./jobs/scripts";

const runningJobs = new Set<string>();

export async function executeJob(rawKanriNo: string | number): Promise<string> {
  const kanriNo = String(rawKanriNo).trim();

  if (!kanriNo) {
    throw new Error("kanriNo is required");
  }

  if (runningJobs.has(kanriNo)) {
    console.warn(`[JobRunner] already running: ${kanriNo}`);
    return "Already running";
  }

  runningJobs.add(kanriNo);
  const startTime = new Date().toISOString();

  try {
    updateJobStatus(kanriNo, "scriptRunning", "実行中", { startTime });

    const result = await dispatchScript(kanriNo);

    updateJobStatus(kanriNo, "success", result, {
      startTime,
      endTime: new Date().toISOString(),
    });

    console.log(`[JobRunner] completed: ${kanriNo}`);

    return result;
  } catch (error) {
    updateJobStatus(
      kanriNo,
      "error",
      error instanceof Error ? error.message : String(error),
      {
        startTime,
        endTime: new Date().toISOString(),
      },
    );

    console.error(`[JobRunner] failed: ${kanriNo}`, error);

    throw error;
  } finally {
    runningJobs.delete(kanriNo);
  }
}

function updateJobStatus(
  kanriNo: string,
  status: JobStatus,
  comment: string,
  options: {
    startTime?: string;
    endTime?: string;
  } = {},
): void {
  updateStatus({
    kanriNo,
    status,
    comment,
    ...options,
  });
}
