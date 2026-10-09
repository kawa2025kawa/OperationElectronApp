// electron/trpc/routers/tempomaticRouter.ts

import { z } from "zod";
import { uploadPdfDocuments } from "@electron/features/tempomatic/tempomaticService";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const tempomaticRouter = router({
  uploadDocument: publicProcedure
    .input(
      z.object({
        filePaths: z.array(z.string()),
        expireDate: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return uploadPdfDocuments(input.filePaths, input.expireDate);
    }),
});
