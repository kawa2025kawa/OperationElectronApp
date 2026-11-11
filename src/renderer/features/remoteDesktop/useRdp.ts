// src/renderer/features/remoteDesktop/useRdp.ts

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { rdpIpcService } from "@renderer/services/rdpIpcService";
import type { RdpTarget } from "@shared/types/rdp/rdpTypes";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** RDP 接続先の取得・起動を管理する */
export const useRdp = () => {
  const [rdpTargets, setRdpTargets] = useState<readonly RdpTarget[]>([]);
  const [isRdpLoading, setIsRdpLoading] = useState(false);
  const isFetchingRef = useRef(false);

  /** RDP 接続先一覧を取得する */
  const fetchRdpTargets = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRdpLoading(true);

    try {
      const targets = await rdpIpcService.getMasters();
      setRdpTargets(targets);
    } catch (error: unknown) {
      toast.error(`RDP取得エラー: ${getErrorMessage(error)}`);
    } finally {
      isFetchingRef.current = false;
      setIsRdpLoading(false);
    }
  }, []);

  /** 指定名称の端末へ RDP セッションを開始する */
  const runRdp = useCallback(async (name: string) => {
    try {
      await rdpIpcService.startSession(name);
    } catch (error: unknown) {
      toast.error(`RDP起動エラー: ${getErrorMessage(error)}`);
    }
  }, []);

  return {
    rdpTargets,
    isRdpLoading,
    fetchRdpTargets,
    runRdp,
  };
};
