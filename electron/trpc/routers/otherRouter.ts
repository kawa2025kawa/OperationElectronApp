import { z } from "zod";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const otherRouter = router({
  processGiftMd: publicProcedure
    .input(z.union([z.string(), z.array(z.string())]).optional())
    .mutation(async ({ input }) => {
      return runJobE41(input);
    }),
});
