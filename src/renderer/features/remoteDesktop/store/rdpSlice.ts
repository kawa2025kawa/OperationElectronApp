// src/renderer/features/remoteDesktop/store/rdpSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { trpc } from "@renderer/lib/trpc";
import type { AppState } from "@renderer/store";
import type { RdpMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

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
      const targets = await trpc.rdp.getMasters.query();
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
      await trpc.rdp.startSession.mutate({ name });
    } catch (error: unknown) {
      toast.error(`RDP起動エラー: ${getErrorMessage(error)}`);
    }
  },
});
