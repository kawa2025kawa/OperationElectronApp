import { getMasterData } from "@electron/features/spreadsheet/application/masterDataManager";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const spreadsheetRouter = router({
  getMasterData: publicProcedure.query(async () => {
    return getMasterData();
  }),
});
