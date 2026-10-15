// src/renderer/features/operation/components/modal/linkModal/useLinkModalContent.ts

import { useCallback } from "react";
import { toast } from "sonner";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { LinkConfig } from "@shared/types/operation/operationTypes";

export function useLinkModalContent(link?: LinkConfig[] | null) {
  const linkItems = link && Array.isArray(link) ? link : [];
  const handleOpenUrl = useCallback(async (url: string) => {
    if (!url) return;

    try {
      await window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, {
        urlOrPath: url,
      });
    } catch (error) {
      console.error("[useLinkModalContent.handleOpenUrl] Failed:", error);
      toast.error("URLを開けませんでした");
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
