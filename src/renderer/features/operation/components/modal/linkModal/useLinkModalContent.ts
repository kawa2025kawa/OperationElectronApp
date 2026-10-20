// src/renderer/features/operation/components/modal/linkModal/useLinkModalContent.ts

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { LinkConfig } from "@shared/types/operation/operationTypes";

// リンク一覧モーダルの表示アイテム管理およびURL起動を行うフック。
export function useLinkModalContent(link?: LinkConfig[] | null) {
  const linkItems = useMemo(() => (Array.isArray(link) ? link : []), [link]);

  const handleOpenUrl = useCallback(async (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    try {
      await window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, {
        urlOrPath: cleanUrl,
      });
    } catch (error) {
      console.error(
        "[useLinkModalContent] Failed to open external URL:",
        error,
      );
      toast.error("リンクを開けませんでした");
    }
  }, []);

  return {
    state: {
      linkItems,
      isEmpty: linkItems.length === 0,
    },
    actions: {
      handleOpenUrl,
    },
  };
}
