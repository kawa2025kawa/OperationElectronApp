// electron/trpc/routers/gmailRouter.ts

import { z } from "zod";
import { authService } from "@electron/features/auth/authService";
import { publicProcedure, router } from "@electron/trpc/trpc";

const GMAIL_SIGNATURE_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs";
const GMAIL_DRAFT_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

interface GmailSendAs {
  isPrimary?: boolean;
  signature?: string;
}

interface GmailSendAsResponse {
  sendAs?: GmailSendAs[];
}

export const gmailRouter = router({
  getSignature: publicProcedure.query(async () => {
    try {
      const response = await authService.request(GMAIL_SIGNATURE_URL);
      if (!response.ok) {
        console.warn(
          `[GmailRouter] Signature API failed with status: ${response.status}`,
        );
        return "";
      }
      const data = (await response.json()) as GmailSendAsResponse;
      const primary = data.sendAs?.find((item) => item.isPrimary);
      return primary?.signature ?? "";
    } catch (error) {
      console.error("[GmailRouter] Failed to fetch signature:", error);
      return "";
    }
  }),

  createDraft: publicProcedure
    .input(
      z.object({
        raw: z.string().min(1, "Gmail draft raw message is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const response = await authService.request(GMAIL_DRAFT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { raw: input.raw },
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
    }),
});
