// src/renderer/features/other/components/modal/contents/gmailDraft/useGmailModalLogic.ts

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useShallow } from "zustand/shallow";

import {
  EMAIL_TEMPLATE_OPTIONS,
  type EmailTemplateKey,
  type GmailDraftFormValues,
} from "@renderer/features/other/types/gmailDraftUiTypes";
import { otherIpcService } from "@renderer/services/otherIpcService";
import { useAppStore } from "@renderer/store";

export interface GmailMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

const DEFAULT_GMAIL_MESSAGE: GmailMessage = {
  text: "Gmail下書き作成用の宛先・件名・本文を入力してください。",
  type: "info",
};

const createInitialFormValues = (): GmailDraftFormValues => ({
  to: "",
  cc: "",
  subject: "",
  body: "",
});

const getErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error ? error.message : fallbackMessage;

// Gmail下書き作成モーダルのフォーム状態と作成処理を管理する。
export function useGmailModalLogic() {
  const {
    isAuthenticated,
    familyName,
    userEmail,
    updateModalConfig,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      familyName: state.familyName,
      userEmail: state.userEmail,
      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const [templateKey, setTemplateKey] = useState<EmailTemplateKey | null>(null);
  const [formValues, setFormValues] = useState<GmailDraftFormValues>(
    createInitialFormValues,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [infoMessage, setInfoMessage] = useState<GmailMessage>(
    DEFAULT_GMAIL_MESSAGE,
  );

  // テンプレート取得リクエストの競合を防止する。
  const templateRequestIdRef = useRef(0);

  // フォーム各項目の入力変更を処理する。
  const handleInputChange = useCallback(
    (field: keyof GmailDraftFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;

        setFormValues((prev) => ({
          ...prev,
          [field]: value,
        }));
      },
    [],
  );

  // 選択されたテンプレートをフォームに反映する。
  const handleTemplateChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      const requestId = ++templateRequestIdRef.current;

      if (!value) {
        setTemplateKey(null);
        setFormValues(createInitialFormValues());
        setInfoMessage(DEFAULT_GMAIL_MESSAGE);
        return;
      }

      const option = EMAIL_TEMPLATE_OPTIONS.find((item) => item.key === value);

      if (!option) return;

      try {
        const draft = await otherIpcService.generateDraftTemplate({
          templateKey: option.key,
          familyName: familyName ?? "",
        });

        // 後から開始されたリクエストがある場合は反映しない。
        if (requestId !== templateRequestIdRef.current) return;

        setTemplateKey(option.key);
        setFormValues(draft);
        setInfoMessage({
          text: `テンプレート (${option.label}) を読み込みました。`,
          type: "info",
        });
      } catch (error) {
        if (requestId !== templateRequestIdRef.current) return;

        console.error("[useGmailModalLogic] Failed to create template:", error);

        setInfoMessage({
          text: getErrorMessage(error, "テンプレートの生成に失敗しました。"),
          type: "error",
        });
      }
    },
    [familyName],
  );

  // Gmail下書きを作成する。
  const handleExecute = useCallback(async () => {
    if (!formValues.to.trim()) {
      setInfoMessage({
        text: "送信先 (To) を入力してください。",
        type: "warning",
      });
      return;
    }

    setIsProcessing(true);
    setInfoMessage({
      text: "Gmail下書きを作成しています...",
      type: "info",
    });

    try {
      await otherIpcService.createGmailDraft(formValues);

      setInfoMessage({
        text: "Gmailの下書きを正常に作成しました。",
        type: "success",
      });
    } catch (error) {
      console.error("[useGmailModalLogic] Failed to create draft:", error);

      setInfoMessage({
        text: getErrorMessage(error, "下書き作成中にエラーが発生しました。"),
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [formValues]);

  // モーダルのメッセージとアクションを同期する。
  useEffect(() => {
    const rightActions = isAuthenticated
      ? [
          {
            id: "cancel",
            label: "キャンセル",
            onClick: closeGlobalModal,
            disabled: isProcessing,
          },
          {
            id: "create-draft",
            label: isProcessing ? "作成中..." : "下書き作成",
            onClick: handleExecute,
            disabled: !formValues.to.trim() || isProcessing,
            variant: "default" as const,
          },
        ]
      : [];

    updateModalConfig({
      message: infoMessage,
      rightActions,
    });
  }, [
    isAuthenticated,
    infoMessage,
    formValues.to,
    isProcessing,
    handleExecute,
    updateModalConfig,
    closeGlobalModal,
  ]);

  return {
    isAuthenticated,
    userEmail,
    templateKey,
    formValues,
    isSaving: isProcessing,
    handleInputChange,
    handleTemplateChange,
  };
}
