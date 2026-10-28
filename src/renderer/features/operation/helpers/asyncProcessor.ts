// src/renderer/features/operation/helpers/asyncProcessor.ts

import { useAppStore } from "@renderer/store";

const MIN_GLOBAL_PROCESSING_DISPLAY_TIME_MS = 3000;

/**
 * グローバルローディング表示を伴って非同期処理を実行する。
 * 最低表示時間を担保し、処理完了後にローディングを解除する。
 */
export async function runJobWithGlobalProcessing<T = void>(
  message: string,
  target: string,
  executeFn: () => Promise<T>,
): Promise<T> {
  const store = useAppStore.getState();
  const alreadyProcessing = store.globalProcessing !== null;

  if (!alreadyProcessing) {
    store.setGlobalProcessing({ message, target });
  }

  const startedAt = Date.now();

  try {
    return await executeFn();
  } finally {
    if (!alreadyProcessing) {
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_GLOBAL_PROCESSING_DISPLAY_TIME_MS - elapsed;

      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, remaining);
        });
      }

      useAppStore.getState().setGlobalProcessing(null);
    }
  }
}
