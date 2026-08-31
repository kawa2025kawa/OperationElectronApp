// electron/features/operation/polling.ts

import { evaluateAllTargetStatuses } from "@electron/features/operation/evaluators/pollingStatusEvaluator";
import {
  getAllTargets,
  getActiveFlags,
} from "@electron/features/operation/statusManager";
import { triggerAutoStartJobs } from "@electron/features/operation/jobRunner";
import {
  getActiveTrackerTargets,
  syncTrackerStatuses,
} from "@electron/features/operation/monitors/trackerMonitor";

// ============================================================
// State
// ============================================================
let timer: NodeJS.Timeout | null = null;
let resolveSleep: (() => void) | null = null;
let running = false;

// ============================================================
// Helpers
// ============================================================
const formatTime = (timeMs: number): string =>
  new Date(timeMs).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour12: false,
  });

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  if (resolveSleep !== null) {
    resolveSleep();
    resolveSleep = null;
  }
}

function sleepUntilNextMinute(): Promise<void> {
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  const delay = Math.max(0, next.getTime() - now.getTime());

  return new Promise((resolve) => {
    resolveSleep = resolve;
    timer = setTimeout(() => {
      timer = null;
      resolveSleep = null;
      resolve();
    }, delay);
  });
}

// ============================================================
// Main Execution Functions
// ============================================================

/**
 * ステータス評価 ➔ Tracker API同期 ➔ 自動起動スクリプト実行の一連サイクルを動かす
 */
export async function runCycle(): Promise<void> {
  const startedAt = Date.now();
  const targets = getAllTargets();

  console.log("[Polling] runCycle START", { count: targets.length });

  if (!targets.length || !running) return;

  // 1. 依存関係および予定時刻に基づくステータス評価
  evaluateAllTargetStatuses(targets, () => running, getActiveFlags());
  if (!running) return;

  // 2. Tracker API ステータス即時同期
  await syncTrackerStatuses(targets);
  if (!running) return;

  // 3. READY 状態ジョブの自動起動実行
  await triggerAutoStartJobs(targets, () => running);

  console.log("[Polling] runCycle END", {
    elapsedMs: Date.now() - startedAt,
  });
}

async function pollingLoop(): Promise<void> {
  while (running) {
    const startedAt = Date.now();
    const targets = getAllTargets();
    const trackerTargets = getActiveTrackerTargets(targets);

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

// ============================================================
// Public APIs
// ============================================================
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
