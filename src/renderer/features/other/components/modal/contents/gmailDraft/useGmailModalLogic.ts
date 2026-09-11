// src/renderer/features/other/components/modal/contents/gmailDraft/useGmailModalLogic.ts

import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { gmailService } from "@renderer/features/other/services/gmailService";
import { useAppStore } from "@renderer/store";
import { type EmailTemplateKey } from "./gmailTemplates";
import {
  type FormValues,
  getNextTuesdayString,
  stripHtmlTags,
  createFormValues,
  formatEmailAddresses,
} from "./gmailModalUtils";

export function useGmailModalLogic() {
  const {
    isAuthenticated,
    familyName,
    userEmail,
    updateModalConfig,
    updateGmailDraftForm,
  } = useAppStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      familyName: s.familyName,
      userEmail: s.userEmail,
      updateModalConfig: s.updateModalConfig,
      updateGmailDraftForm: s.updateGmailDraftForm,
    })),
  );

  const lastName = familyName || "担当者";
  const nextTuesdayStr = getNextTuesdayString();

  const [templateKey, setTemplateKey] = useState<EmailTemplateKey | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({
    to: "",
    cc: "",
    subject: "",
    body: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // 1. 下書き作成の実行ロジック
  const handleExecute = useCallback(async () => {
    if (!formValues.to.trim()) {
      updateModalConfig({
        message: {
          text: "宛先 (To) を入力してください。",
          type: "warning",
        },
      });
      return;
    }

    setIsSaving(true);
    updateModalConfig({ isProcessing: true, message: null });

    try {
      await gmailService.createDraft({
        to: formatEmailAddresses(formValues.to),
        cc: formatEmailAddresses(formValues.cc),
        subject: formValues.subject.trim(),
        body: formValues.body,
      });

      updateModalConfig({
        message: {
          text: "Gmailの下書きを正常に作成しました。",
          type: "success",
        },
      });
    } catch (error) {
      console.error("[GmailModal] Failed to create draft:", error);
      updateModalConfig({
        message: {
          text:
            error instanceof Error
              ? error.message
              : "下書き作成に失敗しました。",
          type: "error",
        },
      });
    } finally {
      setIsSaving(false);
      updateModalConfig({ isProcessing: false });
    }
  }, [formValues, updateModalConfig]);

  // 2. 入力値の変更ハンドラ
  const handleInputChange = useCallback(
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        setFormValues((prev) => {
          const next = { ...prev, [field]: val };
          updateGmailDraftForm(next);
          return next;
        });
        updateModalConfig({ message: null });
      },
    [updateGmailDraftForm, updateModalConfig],
  );

  // 3. テンプレート選択ハンドラ
  const handleTemplateChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextKey = (event.target.value as EmailTemplateKey) || null;
      setTemplateKey(nextKey);
      const nextValues = createFormValues(nextKey, lastName, nextTuesdayStr);

      setFormValues(nextValues);
      updateGmailDraftForm(nextValues);
      updateModalConfig({ message: null });
    },
    [lastName, nextTuesdayStr, updateGmailDraftForm, updateModalConfig],
  );

  // 4. Gmail署名自動適用
  useEffect(() => {
    if (!isAuthenticated || !templateKey) return;
    let mounted = true;

    void gmailService
      .getPrimarySignature()
      .then((signature) => {
        const plainSignature = stripHtmlTags(signature || "");
        if (!mounted || !plainSignature) return;

        setFormValues((prev) => {
          if (prev.body.includes(plainSignature)) return prev;
          const currentBody = prev.body.trimEnd();
          const nextValues = {
            ...prev,
            body: `${currentBody}\n\n--\n${plainSignature}`,
          };
          updateGmailDraftForm(nextValues);
          return nextValues;
        });
      })
      .catch((err) => console.warn("[GmailModal] Signature error:", err));

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, templateKey, updateGmailDraftForm]);

  return {
    isAuthenticated,
    userEmail,
    templateKey,
    formValues,
    isSaving,
    handleInputChange,
    handleTemplateChange,
    handleExecute,
  };
}
