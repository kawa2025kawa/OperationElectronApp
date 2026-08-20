// src/renderer/features/operation/components/modal/gmailModal/useGmailModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { gmailService } from "@renderer/features/operation/services/gmailService";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import { useAppStore } from "@shared/store";

import type { ModalContentProps } from "../useOperationModalLogic";

import {
  EMAIL_TEMPLATE_OPTIONS,
  getEmailTemplate,
  getEmailTemplateKey,
  type EmailTemplateKey,
} from "./templates";

// =====================================================
// Types
// =====================================================

interface UseGmailModalContentParams {
  registerPrimaryAction: ModalContentProps["registerPrimaryAction"];
  forceTemplateSelection?: boolean;
}

interface FormValues {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

// =====================================================
// Helpers
// =====================================================

function getNextTuesdayString(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const daysUntilNextTuesday = (2 - dayOfWeek + 7) % 7 || 7;

  const nextTuesday = new Date(now);

  nextTuesday.setDate(now.getDate() + daysUntilNextTuesday);

  return `${nextTuesday.getMonth() + 1}月${nextTuesday.getDate()}日(火)`;
}

function createFormValues(
  templateKey: EmailTemplateKey | null,
  lastName: string,
  nextTuesdayStr: string,
  links?: Record<string, string> | null,
): FormValues {
  if (!templateKey) {
    return {
      to: "",
      cc: "",
      subject: "",
      body: "",
    };
  }

  const template = getEmailTemplate(templateKey);

  return {
    to: template.to,
    cc: template.cc ?? "",
    subject: template.subject,
    body: template.generateBody({
      lastName,
      nextTuesdayStr,
      links,
    }),
  };
}

// =====================================================
// Hook
// =====================================================

export function useGmailModalContent({
  registerPrimaryAction,
  forceTemplateSelection = false,
}: UseGmailModalContentParams) {
  const selectedItem = useAppStore(selectActiveSelectedItem);

  const userEmail = useAppStore((state) => state.userEmail);

  const familyName = useAppStore((state) => state.familyName);

  const selectedKanriNo = selectedItem?.kanriNo;

  const lastName = familyName || "担当";

  const [nextTuesdayStr] = useState(getNextTuesdayString);

  const initialTemplateKey = forceTemplateSelection
    ? null
    : getEmailTemplateKey(selectedKanriNo);

  const [templateKey, setTemplateKey] = useState<EmailTemplateKey | null>(
    initialTemplateKey,
  );

  const [formValues, setFormValues] = useState<FormValues>(() =>
    createFormValues(
      initialTemplateKey,
      lastName,
      nextTuesdayStr,
      selectedItem?.link,
    ),
  );

  const [isSaving, setIsSaving] = useState(false);

  // ===================================================
  // Template
  // ===================================================

  const handleTemplateChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextTemplateKey = event.target.value
        ? (event.target.value as EmailTemplateKey)
        : null;

      setTemplateKey(nextTemplateKey);

      setFormValues(
        createFormValues(
          nextTemplateKey,
          lastName,
          nextTuesdayStr,
          selectedItem?.link,
        ),
      );
    },
    [lastName, nextTuesdayStr, selectedItem?.link],
  );

  // ===================================================
  // Form
  // ===================================================

  const handleToChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        to: event.target.value,
      }));
    },
    [],
  );

  const handleCcChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        cc: event.target.value,
      }));
    },
    [],
  );

  const handleSubjectChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        subject: event.target.value,
      }));
    },
    [],
  );

  const handleBodyChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFormValues((prev) => ({
        ...prev,
        body: event.target.value,
      }));
    },
    [],
  );

  // ===================================================
  // Gmail Signature
  // ===================================================

  useEffect(() => {
    if (!templateKey) {
      return;
    }

    let mounted = true;

    void gmailService
      .getPrimarySignature()
      .then((signature) => {
        if (!mounted || !signature?.trim()) {
          return;
        }

        setFormValues((prev) => {
          if (prev.body.includes(signature)) {
            return prev;
          }

          return {
            ...prev,
            body: `${prev.body.trim()}\n\n--\n${signature}`,
          };
        });
      })
      .catch((error) => {
        console.warn("[GmailModal] Failed to load signature:", error);
      });

    return () => {
      mounted = false;
    };
  }, [templateKey]);

  // ===================================================
  // Execute
  // ===================================================

  const handleExecute = useCallback(async () => {
    if (!templateKey) {
      toast.error("メールテンプレートを選択してください");

      throw new Error("メールテンプレート未選択");
    }

    if (!formValues.to.trim()) {
      toast.error("宛先(To)を入力してください");

      throw new Error("宛先未入力");
    }

    setIsSaving(true);

    try {
      await gmailService.createDraft({
        to: formValues.to.trim(),
        cc: formValues.cc.trim(),
        subject: formValues.subject.trim(),
        body: formValues.body,
      });

      toast.success("Gmailの下書きに保存しました");
    } catch (error) {
      console.error("[GmailModal] Failed to create draft:", error);

      toast.error(
        error instanceof Error ? error.message : "下書き保存に失敗しました",
      );

      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [templateKey, formValues]);

  // ===================================================
  // Primary Action
  // ===================================================

  useEffect(() => {
    registerPrimaryAction(handleExecute);

    return () => {
      registerPrimaryAction(undefined);
    };
  }, [handleExecute, registerPrimaryAction]);

  return {
    userEmail,
    templateKey,

    to: formValues.to,
    cc: formValues.cc,
    subject: formValues.subject,
    body: formValues.body,

    isSaving,

    templateOptions: EMAIL_TEMPLATE_OPTIONS,

    handleTemplateChange,
    handleToChange,
    handleCcChange,
    handleSubjectChange,
    handleBodyChange,
  };
}
