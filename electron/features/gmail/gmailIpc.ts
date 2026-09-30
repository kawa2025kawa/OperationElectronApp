// electron/features/gmail/gmailIpc.ts

import { ipcMain } from "electron";
import { authService } from "@electron/features/auth/authIpc";

const GMAIL_SIGNATURE_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs";

const GMAIL_DRAFT_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

let registered = false;

interface CreateGmailDraftParams {
  raw: string;
}

interface GmailSendAs {
  isPrimary?: boolean;
  signature?: string;
}

interface GmailSendAsResponse {
  sendAs?: GmailSendAs[];
}

export function registerGmailIpc(): void {
  if (registered) return;
  registered = true;

  ipcMain.handle("gmail:getSignature", async () => {
    try {
      const response = await authService.request(GMAIL_SIGNATURE_URL);

      if (!response.ok) {
        console.warn(
          `[GmailIPC] Signature API failed with status: ${response.status}`,
        );

        return "";
      }

      const data = (await response.json()) as GmailSendAsResponse;
      const primary = data.sendAs?.find((item) => item.isPrimary);

      return primary?.signature ?? "";
    } catch (error) {
      console.error("[GmailIPC] Failed to fetch signature:", error);
      return "";
    }
  });

  ipcMain.handle(
    "gmail:createDraft",
    async (_event, params: CreateGmailDraftParams) => {
      const raw = params?.raw;

      if (typeof raw !== "string" || !raw) {
        throw new Error("Gmail draft raw message is required");
      }

      const response = await authService.request(GMAIL_DRAFT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { raw },
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Gmail API Error (${response.status}): ${responseText}`,
        );
      }

      try {
        return JSON.parse(responseText);
      } catch (error) {
        throw new Error("Gmail API response is not valid JSON", {
          cause: error,
        });
      }
    },
  );
}
