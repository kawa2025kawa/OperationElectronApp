// electron/services/operation/polling.ts

import type { OperationItem } from "@shared/types/operationType";

import { getStatus, updateStatus } from "../statusManager";
import { executeJob } from "./jobRunner";
import { getAllTargets } from "./targetManager";
import { applyTrackerItem, fetchTrackerByJobId } from "./tracker";

let timer: NodeJS.Timeout | null = null;
let running = false;

// ============================================================
// Public
// ============================================================

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
  if (!running) {
    return;
  }

  running = false;
  clearTimer();

  console.log("[Polling] stopped");
}

// ============================================================
// Polling
// ============================================================

async function pollingLoop(): Promise<void> {
  while (running) {
    const startedAt = Date.now();

    console.log("[Polling] 1分間隔監視 START", {
      startedAt: new Date(startedAt).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour12: false,
      }),
    });

    try {
      await runCycle();
    } catch (error) {
      console.error("[Polling] cycle failed", error);
    }

    if (!running) {
      return;
    }

    const now = new Date();
    const nextMinute = new Date(now);

    nextMinute.setSeconds(0, 0);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);

    await sleep(nextMinute.getTime() - now.getTime());
  }
}

async function runCycle(): Promise<void> {
  const startedAt = Date.now();

  console.log("[Polling] runCycle START");

  const targets = getAllTargets();

  console.log("[Polling] targets", {
    count: targets.length,
  });

  if (targets.length === 0) {
    console.log("[Polling] runCycle SKIP: no targets");
    return;
  }

  console.log("[Polling] updateTrackers START");

  const trackerPromise = updateTrackers(targets);

  console.log("[Polling] updateScheduledReady START");

  const scheduledPromise = updateScheduledReady(targets);

  await Promise.all([trackerPromise, scheduledPromise]);

  console.log("[Polling] tracker/scheduled COMPLETE", {
    elapsedMs: Date.now() - startedAt,
  });

  console.log("[Polling] executeAutoStart START");

  await executeAutoStart(targets);

  console.log("[Polling] executeAutoStart COMPLETE");

  console.log("[Polling] runCycle END", {
    elapsedMs: Date.now() - startedAt,
  });
}

// ============================================================
// Tracker
// ============================================================

async function updateTrackers(targets: OperationItem[]): Promise<void> {
  const trackerTargets = targets.filter(isTrackerTarget);

  console.log("[Polling] tracker targets", {
    count: trackerTargets.length,
  });

  await Promise.all(trackerTargets.map(updateTracker));

  console.log("[Polling] updateTrackers END");
}

async function updateTracker(target: OperationItem): Promise<void> {
  const startedAt = Date.now();

  console.log("[Polling] Tracker START", {
    kanriNo: target.kanriNo,
    jobId: target.jobId,
  });

  try {
    const [tracker] = await fetchTrackerByJobId(target);

    if (!tracker) {
      console.log("[Polling] Tracker EMPTY", {
        kanriNo: target.kanriNo,
        jobId: target.jobId,
        elapsedMs: Date.now() - startedAt,
      });

      return;
    }

    const item = applyTrackerItem(tracker, target);

    updateStatus({
      kanriNo: target.kanriNo,
      status: item.status,
      comment: item.comment,
      startTime: item.startTime,
      endTime: item.endTime,
      expectedStartTime: item.expectedStartTime,
      expectedEndTime: item.expectedEndTime,
      substatus: item.substatus,
      info: item.info,
    });

    console.log("[Polling] Tracker END", {
      kanriNo: target.kanriNo,
      jobId: target.jobId,
      status: item.status,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[Polling] Tracker FAILED", {
      kanriNo: target.kanriNo,
      jobId: target.jobId,
      elapsedMs: Date.now() - startedAt,
      error,
    });
  }
}

function isTrackerTarget(target: OperationItem): boolean {
  return hasJobId(target) && !isCompleted(getStatus(target.kanriNo)?.status);
}

// ============================================================
// Scheduled
// ============================================================

async function updateScheduledReady(targets: OperationItem[]): Promise<void> {
  const now = new Date();

  let updatedCount = 0;

  for (const target of targets) {
    if (!isScheduledReadyTarget(target, now)) {
      continue;
    }

    updateStatus({
      kanriNo: target.kanriNo,
      status: "ready",
    });

    updatedCount++;
  }

  console.log("[Polling] updateScheduledReady END", {
    updatedCount,
  });
}

function isScheduledReadyTarget(target: OperationItem, now: Date): boolean {
  if (target.jobId || target.script === true || !target.scheduledTime) {
    return false;
  }

  const status = getStatus(target.kanriNo)?.status;

  if (status && status !== "scheduled" && status !== "waiting") {
    return false;
  }

  const [hour, minute] = target.scheduledTime.split(":").map(Number);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return false;
  }

  const scheduled = new Date(now);

  scheduled.setHours(hour, minute, 0, 0);

  return now >= scheduled;
}

// ============================================================
// Auto Start
// ============================================================

async function executeAutoStart(targets: OperationItem[]): Promise<void> {
  const jobs = targets.filter(
    (target) =>
      target.autoStart === true &&
      !isCompleted(getStatus(target.kanriNo)?.status),
  );

  console.log("[Polling] auto-start jobs", {
    count: jobs.length,
  });

  for (const job of jobs) {
    if (!running) {
      return;
    }

    console.log("[Polling] Auto-start START", {
      kanriNo: job.kanriNo,
    });

    try {
      await executeJob(job.kanriNo);

      console.log("[Polling] Auto-start END", {
        kanriNo: job.kanriNo,
      });
    } catch (error) {
      console.error("[Polling] Auto-start FAILED", {
        kanriNo: job.kanriNo,
        error,
      });
    }
  }
}

// ============================================================
// Helpers
// ============================================================

function hasJobId(target: OperationItem): boolean {
  return (
    typeof target.jobId === "string" &&
    target.jobId.trim() !== "" &&
    target.jobId !== "-"
  );
}

function isCompleted(status?: string | null): boolean {
  return status === "success" || status === "error";
}

function clearTimer(): void {
  if (timer === null) {
    return;
  }

  clearTimeout(timer);
  timer = null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    timer = setTimeout(() => {
      timer = null;
      resolve();
    }, ms);
  });
}
