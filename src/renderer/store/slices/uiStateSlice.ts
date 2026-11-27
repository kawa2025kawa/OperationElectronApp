// src/renderer/store/slices/uiStateSlice.ts

import type { ReactNode } from "react";
import type { StateCreator } from "zustand";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { AppState } from "@renderer/store";
import type { ActiveFlags } from "@shared/types/operation/operationTypes";
import type { ModalConfig } from "@renderer/types/modal";

export const CenterId = {
  VALUES: ["1C", "2C", "3C"] as const,
} as const;

export type CenterId = (typeof CenterId.VALUES)[number];

interface ModalState {
  isOpen: boolean;
  content: ReactNode | null;
  config: ModalConfig | null;
}

interface GlobalProcessingState {
  message: string;
  target?: string;
}

export interface UiStateSlice extends ActiveFlags {
  // Overlay
  globalProcessing: GlobalProcessingState | null;
  setGlobalProcessing: (processing: GlobalProcessingState | null) => void;

  // Modal
  modal: ModalState;
  openGlobalModal: (content: ReactNode, config?: ModalConfig) => void;
  updateModalConfig: (configPartial: Partial<ModalConfig>) => void;
  closeGlobalModal: () => void;

  // Polling
  isPolling: boolean;
  lastPollTime: number | null;
  updateLastPollTime: () => void;
  startPolling: () => Promise<void>;
  stopPolling: () => Promise<void>;

  // Center Flags
  toggleCenter: (id: CenterId) => Promise<void>;
  applyCenterFlags: (flags: ActiveFlags) => void;
}

const getCenterFlagsSnapshot = (state: ActiveFlags): ActiveFlags => ({
  is1CActive: state.is1CActive,
  is2CActive: state.is2CActive,
  is3CActive: state.is3CActive,
});

export const createUiStateSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  UiStateSlice
> = (set, get) => {
  let centerUpdateRevision = 0;
  let pollingTransitionQueue: Promise<void> = Promise.resolve();

  const enqueuePollingTransition = (
    task: () => Promise<void>,
  ): Promise<void> => {
    const next = pollingTransitionQueue.then(task, task);
    pollingTransitionQueue = next.catch(() => undefined);
    return next;
  };

  return {
    // Overlay
    globalProcessing: null,
    setGlobalProcessing: (processing) =>
      set((state) => {
        state.globalProcessing = processing;
      }),

    // Modal
    modal: {
      isOpen: false,
      content: null,
      config: null,
    },
    openGlobalModal: (content, config) =>
      set((state) => {
        state.modal.isOpen = true;
        state.modal.content = content;
        state.modal.config = config ?? {};
      }),
    updateModalConfig: (configPartial) =>
      set((state) => {
        if (!state.modal.config) return;
        state.modal.config = {
          ...state.modal.config,
          ...configPartial,
        };
      }),
    closeGlobalModal: () =>
      set((state) => {
        state.modal.isOpen = false;
        state.modal.content = null;
        state.modal.config = null;
      }),

    // Polling
    isPolling: false,
    lastPollTime: null,
    updateLastPollTime: () =>
      set((state) => {
        state.lastPollTime = Date.now();
      }),
    startPolling: () =>
      enqueuePollingTransition(async () => {
        if (get().isPolling) return;

        set((state) => {
          state.isPolling = true;
        });

        try {
          await operationService.startPolling();
        } catch (error: unknown) {
          set((state) => {
            state.isPolling = false;
          });
          console.error("[PollingSlice] startPolling failed:", error);
        }
      }),
    stopPolling: () =>
      enqueuePollingTransition(async () => {
        if (!get().isPolling) return;

        try {
          await operationService.stopPolling();
          set((state) => {
            state.isPolling = false;
          });
        } catch (error: unknown) {
          console.error("[PollingSlice] stopPolling failed:", error);
        }
      }),

    // Center Flags
    is1CActive: false,
    is2CActive: false,
    is3CActive: false,
    applyCenterFlags: (flags) =>
      set((state) => {
        Object.assign(state, flags);
      }),
    toggleCenter: async (id) => {
      const previousFlags = getCenterFlagsSnapshot(get());
      const key = `is${id}Active` as keyof ActiveFlags;
      const revision = ++centerUpdateRevision;

      set((state) => {
        state[key] = !state[key];
      });

      const nextFlags = getCenterFlagsSnapshot(get());

      try {
        await operationService.setActiveFlags(nextFlags);
      } catch (error) {
        console.error("[CenterSlice] Failed to update center flags:", error);
        if (revision !== centerUpdateRevision) return;

        try {
          const currentFlags = await operationService.getActiveFlags();
          if (revision === centerUpdateRevision) {
            get().applyCenterFlags(currentFlags);
          }
        } catch (restoreError) {
          console.error(
            "[CenterSlice] Failed to restore center flags:",
            restoreError,
          );
          if (revision === centerUpdateRevision) {
            get().applyCenterFlags(previousFlags);
          }
        }
      }
    },
  };
};
