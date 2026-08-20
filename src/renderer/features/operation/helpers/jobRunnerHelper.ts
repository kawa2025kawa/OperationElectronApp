// src/renderer/features/operation/helpers/jobRunnerHelper.ts

import type { AppState } from "@shared/store";

export async function runJobWithGlobalProcessing(
  state: AppState,
  message: string,
  target: string,
  executeFn: () => Promise<void>,
): Promise<void> {
  const isAlreadyProcessing = state.globalProcessing !== null;

  if (!isAlreadyProcessing) {
    state.setGlobalProcessing({
      message,
      target,
    });
  }

  try {
    await executeFn();
  } finally {
    if (!isAlreadyProcessing) {
      state.setGlobalProcessing(null);
    }
  }
}
