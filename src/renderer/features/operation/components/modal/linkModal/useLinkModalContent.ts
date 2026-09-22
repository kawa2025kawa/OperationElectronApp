import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { commands } from "@renderer/services/commands";
import type { LinkConfig } from "@shared/types/operation/operationTypes";

export function useLinkModalContent(link?: LinkConfig[] | null) {
  const linkItems = useMemo(() => {
    if (!link || !Array.isArray(link)) return [];
    return link;
  }, [link]);

  const handleOpenUrl = useCallback(async (rawUrl: string) => {
    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) {
      toast.error("URLが存在しません");
      return;
    }
    try {
      await commands.openExternal(trimmedUrl);
    } catch (error) {
      console.error("[useLinkModalContent.handleOpenUrl] Failed:", error);
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
