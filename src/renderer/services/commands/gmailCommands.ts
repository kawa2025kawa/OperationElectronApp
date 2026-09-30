// src/renderer/services/commands/gmailCommands.ts

export interface CreateGmailDraftParams {
  raw: string;
}

export const gmailCommands = {
  getGmailSignature() {
    return window.electronAPI.invoke<string>("gmail:getSignature");
  },

  createGmailDraft(params: CreateGmailDraftParams) {
    return window.electronAPI.invoke("gmail:createDraft", params);
  },
} as const;
