//src\renderer\features\operation\components\modal\linkModal\useLinkModalLogic.ts

import React, { useCallback } from "react";
import { toast } from "sonner";
import { commands } from "@shared/service/commands";
import { useAppStore } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import { OperationModal } from "../OperationModal";

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

export const useLinkModalLogic = () => {
  const selectedItem = useAppStore(selectActiveSelectedItem);
  const openGlobalModal = useAppStore((s) => s.openGlobalModal);
  const closeGlobalModal = useAppStore((s) => s.closeGlobalModal);

  const links = selectedItem?.link ?? {};
  const linkEntries = Object.entries(links);

  const isLinkActive = useCallback((item: OperationItem): boolean => {
    return Boolean(item.link && Object.keys(item.link).length > 0);
  }, []);

  const openLinkModal = useCallback(() => {
    openGlobalModal(
      React.createElement(OperationModal, {
        type: "link",
        onClose: closeGlobalModal,
      }),
      {
        title: "Link",
        ...DEFAULT_MODAL_SIZE,
      },
    );
  }, [openGlobalModal, closeGlobalModal]);

  const handleOpenUrl = useCallback(async (rawUrl: string) => {
    try {
      await commands.openExternal(rawUrl.trim());
    } catch (error) {
      console.error("[LinkModalContent.handleOpenUrl] Failed:", error);
      toast.error("指定のパスが開けませんでした。");
    }
  }, []);

  return {
    linkEntries,
    isLinkActive,
    openLinkModal,
    handleOpenUrl,
  };
};

useLinkModalLogic;
