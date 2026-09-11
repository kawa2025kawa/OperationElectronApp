import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { gmailService } from "../services/gmailService";
import {
  getEmailTemplate,
  type EmailTemplateKey,
} from "../components/modal/contents/gmailDraft/gmailTemplates"; // 👈 パスに合わせて参照

export interface GmailDraftFormValues {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export interface GmailDraftState {
  templateKey: EmailTemplateKey | null;
  formValues: GmailDraftFormValues;
  isProcessing: boolean;
}

export interface GmailDraftSlice {
  gmailDraft: GmailDraftState;

  updateGmailDraftForm(update: Partial<GmailDraftFormValues>): void;
  setGmailTemplate(key: EmailTemplateKey | null): Promise<void>;
  resetGmailDraft(): void;
  createGmailDraftJob(): Promise<void>;
}

const initialFormValues: GmailDraftFormValues = {
  to: "",
  cc: "",
  subject: "",
  body: "",
};

export const createGmailDraftSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  GmailDraftSlice
> = (set, get) => ({
  gmailDraft: {
    templateKey: null,
    formValues: initialFormValues,
    isProcessing: false,
  },

  updateGmailDraftForm: (update) => {
    set((state) => {
      Object.assign(state.gmailDraft.formValues, update);
    });
  },

  setGmailTemplate: async (key) => {
    if (!key) {
      set((state) => {
        state.gmailDraft.templateKey = null;
        state.gmailDraft.formValues = initialFormValues;
      });
      return;
    }

    try {
      // 🎯 getEmailTemplate(key) 関数を使ってテンプレートを取得
      const template = getEmailTemplate(key);

      // 本文の生成（文脈データが必要な場合はここで渡す）
      const generatedBody = template.generateBody({
        lastName: "", // 必要に応じてストアや設定値から取得
        nextTuesdayStr: "",
      });

      let signature = "";
      try {
        signature = await gmailService.getPrimarySignature();
      } catch {
        // 署名取得失敗時は空文字列で継続
      }

      const bodyWithSignature = signature
        ? `${generatedBody}\n\n${signature}`
        : generatedBody;

      set((state) => {
        state.gmailDraft.templateKey = key;
        state.gmailDraft.formValues = {
          to: template.to,
          cc: template.cc ?? "",
          subject: template.subject,
          body: bodyWithSignature,
        };
      });
    } catch (error) {
      console.error("[setGmailTemplate] Failed to load template:", error);
    }
  },

  resetGmailDraft: () => {
    set((state) => {
      state.gmailDraft.templateKey = null;
      state.gmailDraft.formValues = initialFormValues;
      state.gmailDraft.isProcessing = false;
    });
  },

  createGmailDraftJob: async () => {
    const { formValues, isProcessing } = get().gmailDraft;
    if (isProcessing) return;

    set((state) => {
      state.gmailDraft.isProcessing = true;
    });

    try {
      await gmailService.createDraft({
        to: formValues.to,
        cc: formValues.cc,
        subject: formValues.subject,
        body: formValues.body,
      });
      toast.success("Gmail下書きを作成しました");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Gmail下書き作成失敗: ${message}`);
      throw error;
    } finally {
      set((state) => {
        state.gmailDraft.isProcessing = false;
      });
    }
  },
});
