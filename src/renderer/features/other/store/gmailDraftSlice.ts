import type { StateCreator } from "zustand";
import type {
  GmailDraftFormValues,
  GmailDraftState,
} from "@renderer/features/other/types/gmailDraftTypes";
import type { AppState } from "@renderer/store";

export interface GmailMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}

export interface ExtendedGmailDraftState extends GmailDraftState {
  infoMessage: GmailMessage;
}

export interface GmailDraftSlice {
  gmailDraft: ExtendedGmailDraftState;
  updateGmailDraftForm(update: Partial<GmailDraftFormValues>): void;
  setGmailDraft(update: Partial<GmailDraftState>): void;
  setGmailDraftProcessing(value: boolean): void;
  setGmailDraftMessage(message: GmailMessage): void;
  resetGmailDraft(): void;
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

export const createGmailDraftSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  GmailDraftSlice
> = (set) => ({
  gmailDraft: {
    templateKey: null,
    formValues: createInitialFormValues(),
    isProcessing: false,
    infoMessage: DEFAULT_GMAIL_MESSAGE,
  },

  updateGmailDraftForm: (update) => {
    set((state) => {
      Object.assign(state.gmailDraft.formValues, update);
    });
  },

  setGmailDraft: (update) => {
    set((state) => {
      if (update.templateKey !== undefined) {
        state.gmailDraft.templateKey = update.templateKey;
      }
      if (update.formValues !== undefined) {
        state.gmailDraft.formValues = update.formValues;
      }
      if (update.isProcessing !== undefined) {
        state.gmailDraft.isProcessing = update.isProcessing;
      }
    });
  },

  setGmailDraftProcessing: (value) => {
    set((state) => {
      state.gmailDraft.isProcessing = value;
    });
  },

  setGmailDraftMessage: (message) => {
    set((state) => {
      state.gmailDraft.infoMessage = message;
    });
  },

  resetGmailDraft: () => {
    set((state) => {
      state.gmailDraft.templateKey = null;
      state.gmailDraft.formValues = createInitialFormValues();
      state.gmailDraft.isProcessing = false;
      state.gmailDraft.infoMessage = DEFAULT_GMAIL_MESSAGE;
    });
  },
});
