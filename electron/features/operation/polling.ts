import { evaluateAllTargetStatuses } from "@electron/features/operation/evaluators/pollingStatusEvaluator";
import { triggerAutoStartJobs } from "@electron/features/operation/jobRunner";
import {
  isTrackerTarget,
  syncTrackerStatuses,
} from "@electron/features/operation/monitors/trackerMonitor";
import { getAllTargets } from "@electron/features/operation/targetManager";

let timer: NodeJS.Timeout | null = null;
let running = false;

const formatTime = (timeMs: number) =>
  new Date(timeMs).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour12: false,
  });

export function isPollingRunning(): boolean {
  return running;
}

export function startPolling(): void {
  if (running) {
    console.warn("[Polling] already running");
    return;
  }
  running = true;
  console.log("[Polling] started");
  void pollingLoop();
}

export function stopPolling(): void {
  if (!running) return;
  running = false;
  clearTimer();
  console.log("[Polling] stopped");
}

async function pollingLoop(): Promise<void> {
  while (running) {
    const startedAt = Date.now();
    const targets = getAllTargets();
    const trackerTargets = targets.filter(isTrackerTarget).map((t) => ({
      kanriNo: t.kanriNo,
      workName: t.workName,
    }));

    console.log(
      `\n=================== [Polling Loop START: ${formatTime(startedAt)}] ===================`,
    );
    console.log("[Polling Debug] (START):", {
      count: trackerTargets.length,
      targets: trackerTargets,
    });

    try {
      await runCycle();
    } catch (error) {
      console.error("[Polling] cycle failed", error);
    }

    const endedAt = Date.now();
    console.log("[Polling Debug] (END):", {
      count: trackerTargets.length,
      targets: trackerTargets,
    });
    console.log(
      `=================== [Polling Loop END: ${formatTime(endedAt)} (Elapsed: ${endedAt - startedAt}ms)] ===================\n`,
    );

    if (running) {
      await sleepUntilNextMinute();
    }
  }
}

async function runCycle(): Promise<void> {
  const startedAt = Date.now();
  const targets = getAllTargets();

  console.log("[Polling] runCycle START", { targets: targets.length });

  if (!targets.length || !running) return;

  evaluateAllTargetStatuses(targets, () => running);
  if (!running) return;

  await syncTrackerStatuses(targets);
  if (!running) return;

  await triggerAutoStartJobs(targets, () => running);

  console.log("[Polling] runCycle END", {
    elapsedMs: Date.now() - startedAt,
  });
}

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function sleepUntilNextMinute(): Promise<void> {
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  return new Promise((resolve) => {
    timer = setTimeout(
      () => {
        timer = null;
        resolve();
      },
      Math.max(0, next.getTime() - now.getTime()),
    );
  });
}
