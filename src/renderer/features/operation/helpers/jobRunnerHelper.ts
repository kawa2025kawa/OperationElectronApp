// src/renderer/features/operation/helpers/jobRunnerHelper.ts

import type { AppState } from "@shared/store";

const MIN_DISPLAY_TIME_MS = 3000;

export async function runJobWithGlobalProcessing(
  state: AppState,
  message: string,
  target: string,
  executeFn: () => Promise<void>,
): Promise<void> {
  const isAlreadyProcessing = state.globalProcessing !== null;
  if (!isAlreadyProcessing) {
    state.setGlobalProcessing({ message, target });
  }

  const startTime = Date.now();
  try {
    await executeFn();
  } finally {
    if (!isAlreadyProcessing) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_DISPLAY_TIME_MS - elapsedTime;
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
      state.setGlobalProcessing(null);
    }
  }
}
