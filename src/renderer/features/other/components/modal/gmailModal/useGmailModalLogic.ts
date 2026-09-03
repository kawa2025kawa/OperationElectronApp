// src/renderer/features/other/components/modal/gmailModal/useGmailModalLogic.ts

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const familyName = useAppStore((state) => state.familyName);
  const userEmail = useAppStore((state) => state.userEmail);

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
  const [isExecuted, setIsExecuted] = useState(false);

  // 1. 入力値の変更ハンドラ
  const handleInputChange = useCallback(
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  // 2. テンプレート選択時のハンドラ
  const handleTemplateChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextKey = (event.target.value as EmailTemplateKey) || null;
      setTemplateKey(nextKey);
      setFormValues(createFormValues(nextKey, lastName, nextTuesdayStr));
    },
    [lastName, nextTuesdayStr],
  );

  // 3. Gmail署名の取得と適用（副作用）
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
          return {
            ...prev,
            body: `${currentBody}\n\n--\n${plainSignature}`,
          };
        });
      })
      .catch((err) => console.warn("[GmailModal] Signature error:", err));

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, templateKey]);

  // 4. 下書き作成の実行ロジック
  const handleExecute = useCallback(async () => {
    if (!templateKey) return;
    if (!formValues.to.trim()) {
      toast.error("宛先 (To) を入力してください。");
      return;
    }

    setIsSaving(true);
    const { setGlobalProcessing } = useAppStore.getState();
    setGlobalProcessing({
      message: "Gmail下書き作成中...",
      target: formValues.subject.trim() || "無題",
    });

    const startTime = Date.now();
    try {
      await gmailService.createDraft({
        to: formatEmailAddresses(formValues.to),
        cc: formatEmailAddresses(formValues.cc),
        subject: formValues.subject.trim(),
        body: formValues.body,
      });

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsedTime));
      }

      setIsExecuted(true);
      toast.success("Gmail下書きを作成しました。");
    } catch (error) {
      console.error("[GmailModal] Failed to create draft:", error);
      toast.error(
        error instanceof Error ? error.message : "下書き作成に失敗しました。",
      );
    } finally {
      setIsSaving(false);
      setGlobalProcessing(null);
    }
  }, [templateKey, formValues]);

  return {
    isAuthenticated,
    userEmail,
    templateKey,
    formValues,
    isSaving,
    isExecuted,
    handleInputChange,
    handleTemplateChange,
    handleExecute,
  };
}
