import { z } from "zod";
import { launchRdp } from "@electron/features/rdp/rdpConnection";
import {
  findRdpTarget,
  getRdpTargets,
} from "@electron/features/rdp/rdpResolver";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const rdpRouter = router({
  getMasters: publicProcedure.query(async () => {
    return getRdpTargets();
  }),

  startSession: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const target = await findRdpTarget(input.name);
      await launchRdp({
        ipAddress: target.ipAddress,
        userName: target.userName,
        password: target.password,
      });
    }),
});
