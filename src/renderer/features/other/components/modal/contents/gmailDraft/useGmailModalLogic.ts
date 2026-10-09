// src/renderer/features/other/components/modal/contents/gmailDraft/useGmailModalLogic.ts

import { useCallback, useEffect, type ChangeEvent } from "react";
import { useShallow } from "zustand/shallow";

import { gmailDraftService } from "@renderer/features/other/services/gmailDraftService";
import { getNextTuesdayString } from "@renderer/features/other/utils/gmailModalUtils";
import { EMAIL_TEMPLATE_OPTIONS } from "@renderer/features/other/templates/gmailTemplates";
import type {
  EmailTemplateKey,
  GmailDraftFormValues,
} from "@renderer/features/other/types/gmailDraftTypes";
import { useAppStore } from "@renderer/store";

export function useGmailModalLogic() {
  const {
    isAuthenticated,
    familyName,
    userEmail,
    templateKey,
    formValues,
    isProcessing,
    updateGmailDraftForm,
    setGmailDraft,
    setGmailDraftProcessing,
    updateModalConfig,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      familyName: state.familyName,
      userEmail: state.userEmail,

      templateKey: state.gmailDraft.templateKey,
      formValues: state.gmailDraft.formValues,
      isProcessing: state.gmailDraft.isProcessing,

      updateGmailDraftForm: state.updateGmailDraftForm,
      setGmailDraft: state.setGmailDraft,
      setGmailDraftProcessing: state.setGmailDraftProcessing,

      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const handleInputChange = useCallback(
    (field: keyof GmailDraftFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateGmailDraftForm({
          [field]: event.target.value,
        });

        updateModalConfig({
          message: null,
        });
      },
    [updateGmailDraftForm, updateModalConfig],
  );

  const handleTemplateChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;

      updateModalConfig({
        message: null,
      });

      if (!value) {
        setGmailDraft({
          templateKey: null,
          formValues: {
            to: "",
            cc: "",
            subject: "",
            body: "",
          },
        });

        return;
      }

      const option = EMAIL_TEMPLATE_OPTIONS.find((item) => item.key === value);

      if (!option) {
        return;
      }

      const key: EmailTemplateKey = option.key;

      try {
        const draft =
          await gmailDraftService.createDraftFromTemplateWithSignature(key, {
            lastName: familyName ?? "",
            nextTuesdayStr: getNextTuesdayString(),
          });

        setGmailDraft({
          templateKey: key,
          formValues: draft,
        });
      } catch (error) {
        console.error("[useGmailModalLogic] Failed to create template:", error);

        updateModalConfig({
          message: {
            text:
              error instanceof Error
                ? error.message
                : "テンプレートの生成に失敗しました。",
            type: "error",
          },
        });
      }
    },
    [familyName, setGmailDraft, updateModalConfig],
  );

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

    setGmailDraftProcessing(true);

    updateModalConfig({
      isProcessing: true,
      message: null,
    });

    try {
      await gmailDraftService.createDraft(formValues);

      updateModalConfig({
        message: {
          text: "Gmailの下書きを正常に作成しました。",
          type: "success",
        },
      });
    } catch (error) {
      console.error("[useGmailModalLogic] Failed to create draft:", error);

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
      setGmailDraftProcessing(false);

      updateModalConfig({
        isProcessing: false,
      });
    }
  }, [formValues, setGmailDraftProcessing, updateModalConfig]);

  useEffect(() => {
    updateModalConfig({
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
              label: isProcessing ? "処理中..." : "下書き作成",
              onClick: handleExecute,
              disabled: !formValues.to.trim() || isProcessing,
              variant: "default",
            },
          ]
        : [],
    });
  }, [
    isAuthenticated,
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
