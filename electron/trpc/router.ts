import { publicProcedure, router } from "@electron/trpc/trpc";
import { systemRouter } from "@electron/trpc/routers/systemRouter";
import { authRouter } from "@electron/trpc/routers/authRouter";
import { gmailRouter } from "@electron/trpc/routers/gmailRouter";
import { spreadsheetRouter } from "@electron/trpc/routers/spreadsheetRouter";
import { rdpRouter } from "@electron/trpc/routers/rdpRouter";
import { tempomaticRouter } from "@electron/trpc/routers/tempomaticRouter";
import { otherRouter } from "@electron/trpc/routers/otherRouter";
import { operationRouter } from "@electron/trpc/routers/operationRouter";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "pong";
  }),
  system: systemRouter,
  auth: authRouter,
  gmail: gmailRouter,
  spreadsheet: spreadsheetRouter,
  rdp: rdpRouter,
  tempomatic: tempomaticRouter,
  other: otherRouter,
  operation: operationRouter,
});

export type AppRouter = typeof appRouter;
