import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { gmailService } from "@renderer/features/other/services/gmailService";
import { useAppStore } from "@shared/store";
import {
  EMAIL_TEMPLATE_OPTIONS,
  getEmailTemplate,
  type EmailTemplateKey,
} from "./templates";

interface FormValues {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

function getNextTuesdayString(): string {
  const now = new Date();
  const daysUntilNextTuesday = (2 - now.getDay() + 7) % 7 || 7;
  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilNextTuesday);
  return `${nextTuesday.getMonth() + 1}月${nextTuesday.getDate()}日`;
}

function stripHtmlTags(html: string): string {
  if (!html) return "";
  const formattedHtml = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n");
  const doc = new DOMParser().parseFromString(formattedHtml, "text/html");
  const textContent = doc.body.textContent || "";
  return textContent
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function createFormValues(
  templateKey: EmailTemplateKey | null,
  lastName: string,
  nextTuesdayStr: string,
): FormValues {
  if (!templateKey) return { to: "", cc: "", subject: "", body: "" };
  const template = getEmailTemplate(templateKey);
  return {
    to: template.to,
    cc: template.cc ?? "",
    subject: template.subject,
    body: template.generateBody({ lastName, nextTuesdayStr }),
  };
}

export function useGmailModalContent() {
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

  const handleInputChange = useCallback(
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const handleTemplateChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextKey = (event.target.value as EmailTemplateKey) || null;
      setTemplateKey(nextKey);
      setFormValues(createFormValues(nextKey, lastName, nextTuesdayStr));
    },
    [lastName, nextTuesdayStr],
  );

  useEffect(() => {
    if (!templateKey) return;
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
  }, [templateKey]);

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
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      await gmailService.createDraft({
        to: formValues.to.trim(),
        cc: formValues.cc.trim(),
        subject: formValues.subject.trim(),
        body: formValues.body,
      });
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
    userEmail,
    templateKey,
    ...formValues,
    isSaving,
    isExecuted,
    templateOptions: EMAIL_TEMPLATE_OPTIONS,
    handleTemplateChange,
    handleInputChange,
    handleExecute,
  };
}
