// electron/trpc/routers/spreadsheetRouter.ts

import { z } from "zod";
import {
  getFilteredSheetData,
  getSpreadsheetMasterData,
} from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const spreadsheetRouter = router({
  getMasterData: publicProcedure.query(async () => {
    return getSpreadsheetMasterData();
  }),

  getFilteredData: publicProcedure
    .input(
      z.object({
        sheetName: z.string(),
        searchTerm: z.string().optional(),
        searchKeys: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      return getFilteredSheetData(
        input.sheetName,
        input.searchTerm ?? "",
        input.searchKeys ?? [],
      );
    }),
});
