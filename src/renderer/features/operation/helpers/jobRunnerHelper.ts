// src/renderer/features/operation/helpers/jobRunnerHelper.ts

import type { AppState } from "@shared/store";

const MIN_DISPLAY_TIME_MS = 3000; // 最低表示時間（3秒）

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

  // 表示開始時刻を記録
  const startTime = Date.now();

  try {
    await executeFn();
  } finally {
    if (!isAlreadyProcessing) {
      // 経過時間を計算
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_DISPLAY_TIME_MS - elapsedTime;

      // 3秒未満で終わった場合は、残りの時間だけ待機してから閉じる
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      state.setGlobalProcessing(null);
    }
  }
}
