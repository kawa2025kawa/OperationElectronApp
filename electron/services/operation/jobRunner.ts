// electron/services/operation/jobRunner.ts
import { dispatchScript } from "@electron/services/operation/jobs/scripts/index";
import { getStatus, updateStatus } from "@electron/services/statusManager";

const runningJobs = new Set<string>();

export async function executeJob(kanriNo: string): Promise<string> {
  if (runningJobs.has(kanriNo)) {
    console.warn(`[JobRunner] already running ${kanriNo}`);
    return "Already running";
  }

  const target = getStatus(kanriNo);
  if (!target) {
    throw new Error(`Target not found: ${kanriNo}`);
  }

  if (!target.script) {
    console.warn(`[JobRunner] script disabled ${kanriNo}`);
    return "Script disabled";
  }

  runningJobs.add(kanriNo);

  try {
    updateStatus({
      ...target,
      status: "scriptRunning",
      startTime: new Date().toISOString(),
      comment: "実行中",
    });

    // TS7006: 暗黙のanyエラーを解消するため message: string を明示
    const result = await dispatchScript(kanriNo, (message: string) => {
      const latest = getStatus(kanriNo);
      updateStatus({
        ...(latest ?? target),
        status: "scriptRunning",
        comment: message,
      });
    });

    const latest = getStatus(kanriNo);
    updateStatus({
      ...(latest ?? target),
      status: "success",
      comment: result,
      endTime: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    const latest = getStatus(kanriNo);
    updateStatus({
      ...(latest ?? target),
      status: "error",
      comment: error instanceof Error ? error.message : String(error),
      endTime: new Date().toISOString(),
    });
    throw error;
  } finally {
    runningJobs.delete(kanriNo);
  }
}
