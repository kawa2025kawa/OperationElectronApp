// src/renderer/features/other/components/modal/contents/gmailDraft/useGmailModalLogic.ts

import { useCallback, useState, type ChangeEvent } from "react";
import { useShallow } from "zustand/shallow";

import { EMAIL_TEMPLATE_OPTIONS } from "@renderer/features/other/types/gmailDraftUiTypes";
import type {
  EmailTemplateKey,
  GmailDraftFormValues,
} from "@renderer/features/other/types/gmailDraftUiTypes";
import { useModalFooterSync } from "@renderer/hooks/useModalFooterSync";
import { otherIpcService } from "@renderer/services/otherIpcService";
import { useAppStore } from "@renderer/store";
import { toErrorMessage } from "@renderer/utils/errorUtils";

export interface GmailMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

const TEMPLATE_SELECT_ITEMS = [
  { value: null, label: "手動作成" },
  ...EMAIL_TEMPLATE_OPTIONS.map(({ key, label }) => ({
    value: key,
    label,
  })),
];

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

export function useGmailModalLogic() {
  const { isAuthenticated, userEmail } = useAppStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      userEmail: state.userEmail,
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

  const handleTemplateChange = useCallback(async (value: unknown) => {
    const nextKey = (value as EmailTemplateKey | null) ?? null;

    if (!nextKey) {
      setTemplateKey(null);
      setFormValues(createInitialFormValues());
      setInfoMessage(DEFAULT_GMAIL_MESSAGE);
      return;
    }

    const option = EMAIL_TEMPLATE_OPTIONS.find((item) => item.key === nextKey);
    if (!option) return;

    const key: EmailTemplateKey = option.key;

    try {
      const draft = await otherIpcService.generateDraftTemplate({
        templateKey: key,
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
        text: toErrorMessage(error, "テンプレートの生成に失敗しました。"),
        type: "error",
      });
    }
  }, []);

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
        text: toErrorMessage(error, "下書き作成中にエラーが発生しました。"),
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [formValues]);

  useModalFooterSync({
    message: infoMessage,
    hideActions: !isAuthenticated,
    isCancelDisabled: isProcessing,
    executeLabel: isProcessing ? "作成中..." : "下書き作成",
    isExecuteDisabled: !formValues.to.trim() || isProcessing,
    onExecute: handleExecute,
  });

  return {
    isAuthenticated,
    userEmail,
    templateKey,
    templateItems: TEMPLATE_SELECT_ITEMS,
    formValues,
    isSaving: isProcessing,
    handleInputChange,
    handleTemplateChange,
  };
}