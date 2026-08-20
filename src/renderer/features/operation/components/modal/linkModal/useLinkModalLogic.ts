//src\renderer\features\operation\components\modal\linkModal\useLinkModalLogic.ts

import { useCallback } from "react";
import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";

export const useLinkModalLogic = () => {
  const selectedItem = useAppStore(selectActiveSelectedItem);
  const links = selectedItem?.link ?? {};
  const linkEntries = Object.entries(links);

  const handleOpenUrl = useCallback(async (url: string) => {
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.open(url, "_blank");
        return;
      }
      await commands.openExternal(url);
    } catch (error) {
      console.error(
        "[LinkModalContent.handleOpenUrl] Failed to open link:",
        error,
      );
    }
  }, []);

  return {
    linkEntries,
    handleOpenUrl,
  };
};

export default useLinkModalLogic;
