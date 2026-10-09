// electron/trpc/routers/authRouter.ts

import { z } from "zod";
import {
  authService,
  type AuthPublicSession,
} from "@electron/features/auth/authService";
import { publicProcedure, router } from "@electron/trpc/trpc";

function toPublicSession(
  session: Awaited<ReturnType<typeof authService.loadSession>>,
): AuthPublicSession | null {
  if (!session) {
    return null;
  }
  return {
    email: session.email,
    familyName: session.familyName,
  };
}

export const authRouter = router({
  login: publicProcedure.mutation(async () => {
    const session = await authService.login();
    return {
      email: session.email,
      familyName: session.familyName,
    };
  }),

  loadSession: publicProcedure
    .input(z.object({ forceRefresh: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const session = await authService.loadSession(input?.forceRefresh);
      return toPublicSession(session);
    }),

  logout: publicProcedure.mutation(async () => {
    await authService.clearSession();
    return null;
  }),
});
