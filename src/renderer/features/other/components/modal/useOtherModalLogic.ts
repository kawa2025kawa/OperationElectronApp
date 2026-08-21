// src/renderer/features/other/components/modal/useOtherModalLogic.ts

import { useCallback, useState } from "react";

export type OtherModalType = "pdfUpload" | "gmail";

export interface ModalContentProps {
  onClose: () => void;
  setTitle: (title: string) => void;
  registerPrimaryAction: (
    action: (() => void | Promise<void>) | undefined,
  ) => void;
}

interface UseOtherModalLogicParams {
  type: OtherModalType;
  onClose: () => void;
}

export const useOtherModalLogic = ({
  type,
  onClose,
}: UseOtherModalLogicParams) => {
  const [title, setTitle] = useState<string>(() => {
    switch (type) {
      case "pdfUpload":
        return "店舗matic";
      case "gmail":
        return "下書きメール";
      default:
        return "";
    }
  });

  const [isExecuted, setIsExecuted] = useState(false);
  const [primaryAction, setPrimaryAction] = useState<
    (() => void | Promise<void>) | undefined
  >(undefined);

  const registerPrimaryAction = useCallback(
    (action: (() => void | Promise<void>) | undefined) => {
      setPrimaryAction(() => action);
    },
    [],
  );

  const handlePrimaryClick = useCallback(async () => {
    if (!primaryAction) return;

    try {
      await primaryAction();
      setIsExecuted(true); // 成功したら完了表示（OKボタン）に切り替え
    } catch (error) {
      console.error("[useOtherModalLogic] Action failed:", error);
    }
  }, [primaryAction]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    title,
    isExecuted,
    setTitle,
    setIsExecuted,
    registerPrimaryAction,
    handlePrimaryClick,
    handleClose,
  };
};
