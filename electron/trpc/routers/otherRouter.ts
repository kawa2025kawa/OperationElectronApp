import { z } from "zod";
import fs from "fs-extra";
import path from "node:path";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const otherRouter = router({
  processGiftMd: publicProcedure
    .input(z.string().min(1, "ファイルパスが指定されていません"))
    .mutation(async ({ input: filePath }) => {
      const ext = path.extname(filePath).toLowerCase();
      // ビジネスルール: .txt または .dat のみ受け付ける
      if (ext !== ".txt" && ext !== ".dat") {
        throw new Error(
          "サポートされていない形式です (.txt, .DAT ファイルを選択してください)",
        );
      }

      if (!(await fs.pathExists(filePath))) {
        throw new Error(`ファイルが見つかりません: ${path.basename(filePath)}`);
      }

      return runJobE41(filePath);
    }),
});
