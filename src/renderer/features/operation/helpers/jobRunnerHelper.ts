import type { AppState } from "@shared/store";

export async function runJobWithGlobalProcessing(
  state: AppState,
  message: string,
  targetName: string | null,
  executeFn: () => Promise<void>,
): Promise<void> {
  state.setGlobalProcessing(true, message, targetName);
  try {
    await executeFn();
  } finally {
    state.setGlobalProcessing(false);
  }
}
