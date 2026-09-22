import type { AppState } from "@renderer/store";

const MIN_GLOBAL_PROCESSING_DISPLAY_TIME_MS = 3000;

export async function runJobWithGlobalProcessing<T = void>(
  state: AppState,
  message: string,
  target: string,
  executeFn: () => Promise<T>,
): Promise<T> {
  const alreadyProcessing = state.globalProcessing !== null;
  if (!alreadyProcessing) {
    state.setGlobalProcessing({ message, target });
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
      state.setGlobalProcessing(null);
    }
  }
}
