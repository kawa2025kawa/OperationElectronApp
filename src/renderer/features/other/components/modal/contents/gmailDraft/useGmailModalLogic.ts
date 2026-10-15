import { useCallback, useEffect, type ChangeEvent } from "react";
import { useShallow } from "zustand/shallow";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { EMAIL_TEMPLATE_OPTIONS } from "@renderer/features/other/types/gmailDraftTypes";
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
    infoMessage,
    updateGmailDraftForm,
    setGmailDraft,
    setGmailDraftProcessing,
    setGmailDraftMessage,
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
      infoMessage: state.gmailDraft.infoMessage,
      updateGmailDraftForm: state.updateGmailDraftForm,
      setGmailDraft: state.setGmailDraft,
      setGmailDraftProcessing: state.setGmailDraftProcessing,
      setGmailDraftMessage: state.setGmailDraftMessage,
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
      },
    [updateGmailDraftForm],
  );

  const handleTemplateChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (!value) {
        setGmailDraft({
          templateKey: null,
          formValues: { to: "", cc: "", subject: "", body: "" },
        });
        setGmailDraftMessage({
          text: "Gmail下書き作成用の宛先・件名・本文を入力してください。",
          type: "info",
        });
        return;
      }

      const option = EMAIL_TEMPLATE_OPTIONS.find((item) => item.key === value);
      if (!option) return;

      const key: EmailTemplateKey = option.key;
      try {
        const draft = (await window.electronAPI.invoke(
          IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE,
          { templateKey: key, familyName: familyName ?? "" },
        )) as GmailDraftFormValues;
        setGmailDraft({
          templateKey: key,
          formValues: draft,
        });
        setGmailDraftMessage({
          text: `テンプレート (${option.label}) を読み込みました。`,
          type: "info",
        });
      } catch (error) {
        console.error("[useGmailModalLogic] Failed to create template:", error);
        setGmailDraftMessage({
          text:
            error instanceof Error
              ? error.message
              : "テンプレートの生成に失敗しました。",
          type: "error",
        });
      }
    },
    [familyName, setGmailDraft, setGmailDraftMessage],
  );

  const handleExecute = useCallback(async () => {
    if (!formValues.to.trim()) {
      setGmailDraftMessage({
        text: "送信先 (To) を入力してください。",
        type: "warning",
      });
      return;
    }

    setGmailDraftProcessing(true);
    setGmailDraftMessage({
      text: "Gmail下書きを作成しています...",
      type: "info",
    });

    try {
      await window.electronAPI.invoke(
        IPC_CHANNELS.GMAIL.CREATE_DRAFT,
        formValues,
      );
      setGmailDraftMessage({
        text: "Gmailの下書きを正常に作成しました。",
        type: "success",
      });
    } catch (error) {
      console.error("[useGmailModalLogic] Failed to create draft:", error);
      setGmailDraftMessage({
        text:
          error instanceof Error
            ? error.message
            : "下書き作成中にエラーが発生しました。",
        type: "error",
      });
    } finally {
      setGmailDraftProcessing(false);
    }
  }, [formValues, setGmailDraftProcessing, setGmailDraftMessage]);

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
