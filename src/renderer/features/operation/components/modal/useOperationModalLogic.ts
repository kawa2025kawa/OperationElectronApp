import { useCallback, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@shared/store";
import { selectActiveItemStatusFlags } from "@shared/store/selectors/operationSelectors";
import type { OperationModalType } from "@shared/types/uiType";

import { operationViewConfig } from "@renderer/features/operation/config/operationView";

// ============================================================
// Types
// ============================================================

export type PrimaryAction = () => void | Promise<void>;

export interface ModalContentProps {
  onClose: () => void;
  setTitle: (title: string) => void;
  registerPrimaryAction: (action?: PrimaryAction) => void;
}

interface UseOperationModalLogicParams {
  type: OperationModalType;
  onClose: () => void;
}

interface OperationModalLogic {
  title: string;
  selectedItem: ReturnType<typeof selectActiveItemStatusFlags>["item"];
  urlValue: string;
  isExecuted: boolean;
  setTitle: (title: string) => void;
  registerPrimaryAction: (action?: PrimaryAction) => void;
  handlePrimaryClick: () => Promise<void>;
  handleClose: () => void;
}

// ============================================================
// Constants
// ============================================================

const PDF_UPLOAD_TITLE = "PDF処理";

// ============================================================
// Helpers
// ============================================================

const getActionLabel = (type: OperationModalType): string => {
  return (
    operationViewConfig.actions?.find((action) => action.key === type)?.label ??
    ""
  );
};

const getDefaultModalTitle = (type: OperationModalType): string => {
  if (type === "pdfUpload") {
    return PDF_UPLOAD_TITLE;
  }

  return getActionLabel(type);
};

const getFirstUrlValue = (
  url: Record<string, string> | null | undefined,
): string => {
  if (!url) {
    return "";
  }

  const firstUrl = Object.values(url)[0];

  return firstUrl == null ? "" : String(firstUrl);
};

// ============================================================
// Hook
// ============================================================

export const useOperationModalLogic = ({
  type,
  onClose,
}: UseOperationModalLogicParams): OperationModalLogic => {
  const [customTitle, setCustomTitle] = useState("");
  const [isExecuted, setIsExecuted] = useState(false);

  const primaryActionRef = useRef<PrimaryAction | undefined>(undefined);

  const { selectedItem, resetPdfUpload } = useAppStore(
    useShallow((state) => {
      const flags = selectActiveItemStatusFlags(state);

      return {
        selectedItem: flags.item,
        resetPdfUpload: state.resetPdfUpload,
      };
    }),
  );

  // ==========================================================
  // Primary Action
  // ==========================================================

  const registerPrimaryAction = useCallback((action?: PrimaryAction) => {
    primaryActionRef.current = action;
  }, []);

  const handlePrimaryClick = useCallback(async (): Promise<void> => {
    const action = primaryActionRef.current;

    if (!action) {
      console.warn("[OperationModal] Primary action is not registered.");
      return;
    }

    try {
      await action();
      setIsExecuted(true);
    } catch (error) {
      console.error("[OperationModal] Primary action failed.", error);
      throw error;
    }
  }, []);

  // ==========================================================
  // Title
  // ==========================================================

  const setTitle = useCallback((title: string) => {
    setCustomTitle(title);
  }, []);

  const title = useMemo(() => {
    const trimmedTitle = customTitle.trim();

    if (trimmedTitle) {
      return trimmedTitle;
    }

    return getDefaultModalTitle(type);
  }, [customTitle, type]);

  // ==========================================================
  // Selected Item Data
  // ==========================================================

  const urlValue = useMemo(
    () => getFirstUrlValue(selectedItem?.url),
    [selectedItem?.url],
  );

  // ==========================================================
  // Close
  // ==========================================================

  const handleClose = useCallback(() => {
    primaryActionRef.current = undefined;
    setIsExecuted(false);

    if (type === "pdfUpload") {
      resetPdfUpload();
    }

    onClose();
  }, [onClose, resetPdfUpload, type]);

  // ==========================================================
  // Return
  // ==========================================================

  return {
    title,
    selectedItem,
    urlValue,
    isExecuted,
    setTitle,
    registerPrimaryAction,
    handlePrimaryClick,
    handleClose,
  };
};

export default useOperationModalLogic;
