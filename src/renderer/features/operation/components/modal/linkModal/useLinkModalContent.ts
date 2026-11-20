// src/renderer/features/operation/components/modal/linkModal/useLinkModalContent.ts

import { useCallback, useMemo } from "react";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { LinkConfig } from "@shared/types/operation/operationTypes";

const LINK_MODAL_EMPTY_MESSAGE = "リンクがありません" as const;
const OPEN_ERROR_PREFIX = "リンクを開けませんでした" as const;

export function useLinkModalContent(link?: LinkConfig[] | null) {
  const linkItems = useMemo(() => (Array.isArray(link) ? link : []), [link]);

  const handleOpenUrl = useCallback((url: string) => {
    void operationService
      .openExternal(url, OPEN_ERROR_PREFIX)
      .catch(() => undefined);
  }, []);

  return {
    linkItems,
    isEmpty: linkItems.length === 0,
    emptyMessage: LINK_MODAL_EMPTY_MESSAGE,
    handleOpenUrl,
  };
}
