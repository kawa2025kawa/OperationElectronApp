// electron/features/operation/polling/pollingLoop.ts

import { BrowserWindow } from "electron";
import { evaluateAllTargetStatuses } from "./pollingStatusEvaluator";
import { syncTrackerStatuses } from "./trackerMonitor";
import { getAllTargets } from "@electron/features/operation/statusManager";
import { getActiveFlags } from "@electron/features/operation/activeFlagsManager";
import { triggerAutoStartJcJobs } from "@electron/features/operation/runners/jcRunner";
import { triggerAutoStartScriptJobs } from "@electron/features/operation/runners/scriptRunner";
import { JOB_STATUS } from "@shared/types/operation";

let timer: NodeJS.Timeout | null = null;
let resolveSleep: (() => void) | null = null;
let running = false;
let isCycleRunning = false;

const clearTimer = (): void => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (resolveSleep) {
    resolveSleep();
    resolveSleep = null;
  }
};

const sleepUntilNextMinute = (): Promise<void> => {
  const now = Date.now();
  const next = new Date(now).setSeconds(0, 0) + 60000;
  return new Promise((resolve) => {
    resolveSleep = resolve;
    timer = setTimeout(
      () => {
        timer = null;
        resolveSleep = null;
        resolve();
      },
      Math.max(0, next - now),
    );
  });
};

const notifyPollingCycleComplete = (): void => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send("polling-cycle-complete");
  }
};

export async function runCycle(): Promise<void> {
  const targets = getAllTargets();
  if (!targets.length || !running || isCycleRunning) return;
  isCycleRunning = true;

  try {
    // 1. 全対象の依存関係評価（メモリ上）
    evaluateAllTargetStatuses(targets, () => running);
    if (!running) return;

    // 2. 自動起動対象の安全網チェック
    void triggerAutoStartJcJobs(targets, () => running);
    void triggerAutoStartScriptJobs(targets, () => running);

    // 3. 🎯 RUNNING ジョブの定期同期（統一エントリーポイント経由で並列同期＆一括ログ出力）
    const runningTargets = targets.filter(
      (t) => t.status === JOB_STATUS.RUNNING,
    );
    if (runningTargets.length > 0) {
      await syncTrackerStatuses(runningTargets);
    }
  } finally {
    isCycleRunning = false;
  }
}

async function pollingLoop(): Promise<void> {
  while (running) {
    try {
      await runCycle();
      notifyPollingCycleComplete();
    } catch (error) {
      console.error("[Polling] cycle failed", error);
    }
    if (running) await sleepUntilNextMinute();
  }
}

export const isPollingRunning = (): boolean => running;

export function startPolling(): void {
  if (running) return;
  running = true;
  void pollingLoop();
}

export function stopPolling(): void {
  if (!running) return;
  running = false;
  clearTimer();
}
