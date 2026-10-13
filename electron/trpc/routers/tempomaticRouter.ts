//electron\trpc\routers\tempomaticRouter.ts

import { z } from "zod";
import { format, addDays } from "date-fns";
import fs from "fs-extra";
import path from "node:path";
import { uploadPdfDocuments } from "@electron/features/tempomatic/tempomaticService";
import { publicProcedure, router } from "@electron/trpc/trpc";

function calculateExpireDate(offsetDays = 7): string {
  const date = addDays(new Date(), offsetDays);
  return format(date, "yyyy/MM/dd");
}

export const tempomaticRouter = router({
  uploadDocument: publicProcedure
    .input(
      z.object({
        filePaths: z.array(z.string()).min(1, "ファイルが選択されていません"),
        expireDate: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // 1. 重複パスの排除とPDF拡張子バリデーション（ビジネスロジックをMainに集約）
      const uniquePaths = Array.from(
        new Set(input.filePaths.map((p) => p.trim())),
      ).filter(Boolean);
      const validPdfPaths = uniquePaths.filter((p) =>
        p.toLowerCase().endsWith(".pdf"),
      );

      if (validPdfPaths.length === 0) {
        throw new Error(
          "アップロード対象に有効なPDFファイル (.pdf) が含まれていません",
        );
      }

      // 2. 実ファイルの存在確認
      for (const filePath of validPdfPaths) {
        if (!(await fs.pathExists(filePath))) {
          throw new Error(
            `指定されたファイルが存在しません: ${path.basename(filePath)}`,
          );
        }
      }

      const expireDate = input.expireDate?.trim()
        ? input.expireDate.trim()
        : calculateExpireDate();

      return uploadPdfDocuments(validPdfPaths, expireDate);
    }),
});
