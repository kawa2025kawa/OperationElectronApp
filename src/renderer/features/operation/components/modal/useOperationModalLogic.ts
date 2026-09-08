// electron/features/operation/components/modal/useOperationModalLogic.ts

import { useCallback, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import type { ExtraModalType } from "@shared/types/ui";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";

// ============================================================
// Types
// ============================================================

type ActionHandler = () => void | string | Promise<void | string>;

interface ActionOptions {
  disabled?: boolean;
  label?: string;
}

export type RegisterPrimaryAction = (
  action?: ActionHandler,
  options?: ActionOptions,
) => void;

export type RegisterSecondaryAction = (
  action?: ActionHandler,
  options?: ActionOptions,
) => void;

export interface ModalContentProps {
  onClose: () => void;
  setTitle: (title: string) => void;
  registerPrimaryAction: RegisterPrimaryAction;
  registerSecondaryAction?: RegisterSecondaryAction;
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
  secondaryLabel: string;
  isSecondaryDisabled: boolean;
  hasSecondaryAction: boolean;
  executionResult: string | null;
  setTitle: (title: string) => void;
  registerPrimaryAction: RegisterPrimaryAction;
  registerSecondaryAction: RegisterSecondaryAction;
  handlePrimaryClick: () => Promise<void>;
  handleSecondaryClick: () => Promise<void>;
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
  const [secondaryLabel, setSecondaryLabel] = useState("送信済みデータの確認");
  const [isSecondaryDisabled, setIsSecondaryDisabled] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const primaryActionRef = useRef<ActionHandler | undefined>(undefined);
  const secondaryActionRef = useRef<ActionHandler | undefined>(undefined);

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

  // プライマリアクション（「実行」ボタン）の登録
  const registerPrimaryAction = useCallback<RegisterPrimaryAction>(
    (action, options) => {
      primaryActionRef.current = action;
      setIsPrimaryDisabled(options?.disabled ?? !action);
    },
    [],
  );

  // セカンダリアクション（「送信済みデータの確認」ボタン等）の登録
  const registerSecondaryAction = useCallback<RegisterSecondaryAction>(
    (action, options) => {
      secondaryActionRef.current = action;
      if (options?.label) {
        setSecondaryLabel(options.label);
      }
      setIsSecondaryDisabled(options?.disabled ?? !action);
    },
    [],
  );

  // プライマリアクション実行
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

  // セカンダリアクション実行
  const handleSecondaryClick = useCallback(async (): Promise<void> => {
    const action = secondaryActionRef.current;

    if (!action) {
      console.warn("[OperationModal] Secondary action is not registered.");
      return;
    }

    try {
      const result = await action();
      if (typeof result === "string") {
        setExecutionResult(result);
      }
      setIsExecuted(true);
    } catch (error) {
      console.error("[OperationModal] Secondary action failed.", error);
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
    secondaryActionRef.current = undefined;
    setIsExecuted(false);
    setIsPrimaryDisabled(false);
    setIsSecondaryDisabled(false);
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
    secondaryLabel,
    isSecondaryDisabled,
    hasSecondaryAction: Boolean(secondaryActionRef.current),
    executionResult,
    setTitle,
    registerPrimaryAction,
    registerSecondaryAction,
    handlePrimaryClick,
    handleSecondaryClick,
    handleClose,
  };
};
