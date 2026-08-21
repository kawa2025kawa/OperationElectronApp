// src/renderer/features/operation/components/modal/contents/linkModal/useLinkModalLogic.ts

import { useCallback } from "react";
import { toast } from "sonner";
import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";

export const useLinkModalLogic = () => {
  const selectedItem = useAppStore(selectActiveSelectedItem);
  const links = selectedItem?.link ?? {};
  const linkEntries = Object.entries(links);

  const handleOpenUrl = useCallback(async (rawUrl: string) => {
    try {
      await commands.openExternal(rawUrl.trim());
    } catch (error) {
      console.error(
        "[LinkModalContent.handleOpenUrl] Failed to open link:",
        error,
      );
      toast.error(
        "指定のパスが開けませんでした。ネットワーク接続やパスの存在を確認してください。",
      );
    }
  }, []);

  return {
    linkEntries,
    handleOpenUrl,
  };
};

export default useLinkModalLogic;
