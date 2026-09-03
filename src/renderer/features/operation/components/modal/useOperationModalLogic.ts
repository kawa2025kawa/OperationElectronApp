// electron/features/operation/components/modal/useOperationModalLogic.ts

import { useCallback, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import type { ExtraModalType } from "@shared/types/ui";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";

// ============================================================
// Types
// ============================================================

type PrimaryAction = () => void | string | Promise<void | string>;

interface PrimaryActionOptions {
  disabled?: boolean;
}

export type RegisterPrimaryAction = (
  action?: PrimaryAction,
  options?: PrimaryActionOptions,
) => void;

export interface ModalContentProps {
  onClose: () => void;
  setTitle: (title: string) => void;
  registerPrimaryAction: RegisterPrimaryAction;
  kanriNo?: string;
}

interface UseOperationModalLogicParams {
  type: ExtraModalType;
  onClose: () => void;
}

interface OperationModalLogic {
  title: string;
  selectedItem: ReturnType<typeof selectActiveItemStatusFlags>["item"];
  kanriNo?: string;
  isExecuted: boolean;
  isPrimaryDisabled: boolean;
  executionResult: string | null;
  setTitle: (title: string) => void;
  registerPrimaryAction: RegisterPrimaryAction;
  handlePrimaryClick: () => Promise<void>;
  handleClose: () => void;
}

const MODAL_TITLE_MAP: Record<string, string> = {
  link: "Link",
  gmail: "Gmail",
  pdfUpload: "店舗maticアップロード",
};

export const useOperationModalLogic = ({
  type,
  onClose,
}: UseOperationModalLogicParams): OperationModalLogic => {
  const [customTitle, setCustomTitle] = useState("");
  const [isExecuted, setIsExecuted] = useState(false);
  const [isPrimaryDisabled, setIsPrimaryDisabled] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const primaryActionRef = useRef<PrimaryAction | undefined>(undefined);

  // ★ modalConfig.title からストア内のタイトル（"実施可", "完了" 等）を安全に取得
  const storeModalTitle = useAppStore(
    (state) => state.modalConfig?.title ?? "",
  );

  const { selectedItem, resetPdfUpload } = useAppStore(
    useShallow((state) => {
      const flags = selectActiveItemStatusFlags(state);
      return {
        selectedItem: flags.item,
        resetPdfUpload: state.resetPdfUpload,
      };
    }),
  );

  const registerPrimaryAction = useCallback<RegisterPrimaryAction>(
    (action, options) => {
      primaryActionRef.current = action;
      setIsPrimaryDisabled(options?.disabled ?? !action);
    },
    [],
  );

  const handlePrimaryClick = useCallback(async (): Promise<void> => {
    const action = primaryActionRef.current;

    if (!action) {
      console.warn("[OperationModal] Primary action is not registered.");
      return;
    }

    try {
      const result = await action();
      if (typeof result === "string") {
        setExecutionResult(result);
      }
      setIsExecuted(true);
    } catch (error) {
      console.error("[OperationModal] Primary action failed.", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setExecutionResult(errorMsg);
      setIsExecuted(true);
    }
  }, []);

  const setTitle = useCallback((title: string) => {
    setCustomTitle(title);
  }, []);

  const title = useMemo(() => {
    // 1. 子からの setTitle(customTitle) -> ストアの modalConfig.title(storeModalTitle) の順で優先
    const activeTitle = (customTitle || storeModalTitle).trim();
    if (activeTitle) {
      return activeTitle;
    }

    const workName = selectedItem?.workName?.trim();

    if (type === "script") {
      return workName || "Script";
    }

    // 2. タイトル指定がない場合のフォールバック（"summary" という生の文字を出さない）
    const baseTitle = MODAL_TITLE_MAP[type] ?? "";
    return workName && baseTitle
      ? `${baseTitle} - ${workName}`
      : baseTitle || workName || "";
  }, [customTitle, storeModalTitle, selectedItem?.workName, type]);

  const handleClose = useCallback(() => {
    primaryActionRef.current = undefined;
    setIsExecuted(false);
    setIsPrimaryDisabled(false);
    setExecutionResult(null);

    if (type === "pdfUpload") {
      resetPdfUpload();
    }
    onClose();
  }, [onClose, resetPdfUpload, type]);

  return {
    title,
    selectedItem,
    kanriNo: selectedItem?.kanriNo ? String(selectedItem.kanriNo) : undefined,
    isExecuted,
    isPrimaryDisabled,
    executionResult,
    setTitle,
    registerPrimaryAction,
    handlePrimaryClick,
    handleClose,
  };
};

useOperationModalLogic;
