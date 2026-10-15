// src/renderer/features/remoteDesktop/store/rdpSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AppState } from "@renderer/store";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

export interface RdpSlice {
  rdpTargets: RdpMaster[];
  isRdpLoading: boolean;
  fetchRdpTargets: () => Promise<void>;
  runRdp: (name: string) => Promise<void>;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const createRdpSlice: StateCreator<AppState, [], [], RdpSlice> = (
  set,
  get,
) => ({
  rdpTargets: [],
  isRdpLoading: false,

  fetchRdpTargets: async () => {
    get().setGlobalProcessing({
      message: "RDP 接続先を取得中...",
      target: "RDP Master",
    });

    set({ isRdpLoading: true });

    try {
      const targets = await window.electronAPI.invoke(
        IPC_CHANNELS.RDP.GET_MASTERS,
      );
      set({ rdpTargets: targets });
    } catch (error: unknown) {
      toast.error(`RDP取得エラー: ${getErrorMessage(error)}`);
    } finally {
      set({ isRdpLoading: false });
      get().setGlobalProcessing(null);
    }
  },

  runRdp: async (name: string) => {
    try {
      await window.electronAPI.invoke(IPC_CHANNELS.RDP.START_SESSION, { name });
    } catch (error: unknown) {
      toast.error(`RDP起動エラー: ${getErrorMessage(error)}`);
    }
  },
});
