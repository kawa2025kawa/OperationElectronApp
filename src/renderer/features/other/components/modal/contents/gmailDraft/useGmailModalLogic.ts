// src/renderer/features/other/components/modal/contents/gmailDraft/useGmailModalLogic.ts

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useShallow } from "zustand/shallow";
import { EMAIL_TEMPLATE_OPTIONS } from "@renderer/features/other/types/gmailDraftTypes";
import type {
  EmailTemplateKey,
  GmailDraftFormValues,
} from "@renderer/features/other/types/gmailDraftTypes";
import { useAppStore } from "@renderer/store";
import { otherIpcService } from "@renderer/services/otherIpcService";

export interface GmailMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

const DEFAULT_GMAIL_MESSAGE: GmailMessage = {
  text: "Gmail下書き作成用の宛先・件名・本文を入力してください。",
  type: "info",
};

// フォームの初期値を生成する。
const createInitialFormValues = (): GmailDraftFormValues => ({
  to: "",
  cc: "",
  subject: "",
  body: "",
});

// Gmail下書き作成モーダルのローカルフォーム状態および作成ロジックを管理するフック。
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] = useState<GmailMessage>(
    DEFAULT_GMAIL_MESSAGE,
  );

  // フォーム各項目の入力変更をローカル状態に反映する。
  const handleInputChange = useCallback(
    (field: keyof GmailDraftFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormValues((prev) => ({
          ...prev,
          [field]: event.target.value,
        }));
      },
    [],
  );

  // 選択されたテンプレートに基づき下書きテンプレートを取得してフォームに設定する。
  const handleTemplateChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (!value) {
        setTemplateKey(null);
        setFormValues(createInitialFormValues());
        setInfoMessage({
          text: "Gmail下書き作成用の宛先・件名・本文を入力してください。",
          type: "info",
        });
        return;
      }

      const option = EMAIL_TEMPLATE_OPTIONS.find((item) => item.key === value);
      if (!option) return;

      const key: EmailTemplateKey = option.key;
      try {
        const draft = await otherIpcService.generateDraftTemplate({
          templateKey: key,
          familyName: familyName ?? "",
        });

        setTemplateKey(key);
        setFormValues(draft);
        setInfoMessage({
          text: `テンプレート (${option.label}) を読み込みました。`,
          type: "info",
        });
      } catch (error) {
        console.error("[useGmailModalLogic] Failed to create template:", error);
        setInfoMessage({
          text:
            error instanceof Error
              ? error.message
              : "テンプレートの生成に失敗しました。",
          type: "error",
        });
      }
    },
    [familyName],
  );

  // バックエンドのGmail下書き作成APIを呼び出して下書きを作成する。
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
        text:
          error instanceof Error
            ? error.message
            : "下書き作成中にエラーが発生しました。",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [formValues]);

  useEffect(() => {
    updateModalConfig({
      message: infoMessage,
      rightActions: isAuthenticated
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
              variant: "default",
            },
          ]
        : [],
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
