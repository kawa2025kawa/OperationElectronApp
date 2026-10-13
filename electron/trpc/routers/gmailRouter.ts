// electron/trpc/routers/gmailRouter.ts

import { z } from "zod";
import {
  createGmailDraft,
  fetchPrimarySignature,
  generateDraftTemplate,
} from "@electron/features/gmail/gmailService";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const gmailRouter = router({
  getSignature: publicProcedure.query(async () => {
    return fetchPrimarySignature();
  }),

  generateDraftTemplate: publicProcedure
    .input(
      z.object({
        templateKey: z.enum(["E8", "E9", "E10"]),
        familyName: z.string().optional(),
        links: z.record(z.string(), z.string()).nullable().optional(),
      }),
    )
    .query(async ({ input }) => {
      return generateDraftTemplate(input);
    }),

  createDraft: publicProcedure
    .input(
      z.object({
        to: z.string().optional(),
        cc: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        raw: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return createGmailDraft(input);
    }),
});
