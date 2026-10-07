//src\renderer\features\operation\components\modal\linkModal\useLinkModalContent.ts

import { useCallback } from "react";
import { toast } from "sonner";
import { systemCommands } from "@renderer/services/commands";
import type { LinkConfig } from "@shared/types/operation/operationTypes";

export function useLinkModalContent(link?: LinkConfig[] | null) {
  const linkItems = link && Array.isArray(link) ? link : [];
  const handleOpenUrl = useCallback(async (url: string) => {
    if (!url) return;

    try {
      await systemCommands.openExternal(url);
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
