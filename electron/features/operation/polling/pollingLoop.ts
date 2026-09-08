// electron/features/operation/polling/pollingLoop.ts
import { BrowserWindow } from "electron";
import { evaluateAllTargetStatuses } from "./pollingStatusEvaluator";
import { syncTrackerStatuses } from "./trackerMonitor";
import {
  getAllTargets,
  getActiveFlags,
} from "@electron/features/operation/statusManager";
import { triggerAutoStartJobs } from "@electron/features/operation/jobRunner";

let timer: NodeJS.Timeout | null = null;
let resolveSleep: (() => void) | null = null;
let running = false;
let isCycleRunning = false;

const clearTimer = () => {
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
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return new Promise((resolve) => {
    resolveSleep = resolve;
    timer = setTimeout(
      () => {
        timer = null;
        resolveSleep = null;
        resolve();
      },
      Math.max(0, next.getTime() - now.getTime()),
    );
  });
};

const notifyPollingCycleComplete = () => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send("polling-cycle-complete");
  });
};

export async function runCycle(): Promise<void> {
  const targets = getAllTargets();
  if (!targets.length || !running || isCycleRunning) return;
  isCycleRunning = true;

  try {
    const activeFlags = getActiveFlags() as unknown as Record<string, boolean>;
    evaluateAllTargetStatuses(targets, () => running, activeFlags);
    if (!running) return;
    await syncTrackerStatuses(targets);
    if (!running) return;
    await triggerAutoStartJobs(targets, () => running);
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

export const isPollingRunning = () => running;

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
