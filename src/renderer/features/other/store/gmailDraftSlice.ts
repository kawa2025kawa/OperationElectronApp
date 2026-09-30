// src/renderer/features/other/store/gmailDraftSlice.ts

import type { StateCreator } from "zustand";

import type {
  GmailDraftFormValues,
  GmailDraftState,
} from "@renderer/features/other/types/gmailDraftTypes";
import type { AppState } from "@renderer/store";

export interface GmailDraftSlice {
  gmailDraft: GmailDraftState;

  updateGmailDraftForm(
    update: Partial<GmailDraftFormValues>,
  ): void;

  setGmailDraft(
    update: Partial<GmailDraftState>,
  ): void;

  setGmailDraftProcessing(
    value: boolean,
  ): void;

  resetGmailDraft(): void;
}

const createInitialFormValues = (): GmailDraftFormValues => ({
  to: "",
  cc: "",
  subject: "",
  body: "",
});

const createInitialGmailDraftState = (): GmailDraftState => ({
  templateKey: null,
  formValues: createInitialFormValues(),
  isProcessing: false,
});

export const createGmailDraftSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  GmailDraftSlice
> = (set) => ({
  gmailDraft: createInitialGmailDraftState(),

  updateGmailDraftForm: (update) => {
    set((state) => {
      Object.assign(
        state.gmailDraft.formValues,
        update,
      );
    });
  },

  setGmailDraft: (update) => {
    set((state) => {
      if (update.templateKey !== undefined) {
        state.gmailDraft.templateKey =
          update.templateKey;
      }

      if (update.formValues !== undefined) {
        state.gmailDraft.formValues =
          update.formValues;
      }

      if (update.isProcessing !== undefined) {
        state.gmailDraft.isProcessing =
          update.isProcessing;
      }
    });
  },

  setGmailDraftProcessing: (value) => {
    set((state) => {
      state.gmailDraft.isProcessing = value;
    });
  },

  resetGmailDraft: () => {
    set((state) => {
      state.gmailDraft =
        createInitialGmailDraftState();
    });
  },
});