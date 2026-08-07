// src/shared/store/slices/services/csvService.ts

import { commands } from "@shared/api/commands";
import { unwrapResult } from "@shared/utils/apiUtils";

export interface ImportCsvResult {
  fileName: string;
  rowCount: number;
}

export const csvService = {
  /** CSVファイルの取り込み */
  async importCsv(files: File[]): Promise<ImportCsvResult[]> {
    console.log(
      `📁 [csvService.importCsv] CSV取り込み開始: ファイル数=${files.length}`,
    );
    if (files.length === 0) {
      console.warn(`⚠️ [csvService.importCsv] ファイルが選択されていません`);
      return [];
    }

    const filePaths = files
      .map((f) => (f as unknown as { path?: string }).path)
      .filter((p): p is string => Boolean(p));

    console.log(`📄 [csvService.importCsv] 抽出ファイルパス一覧:`, filePaths);

    const rawCommands = commands as unknown as Record<
      string,
      (args: { filePaths: string[] }) => Promise<unknown>
    >;

    if (typeof rawCommands.importCsv !== "function") {
      console.error(
        `❌ [csvService.importCsv] Rustコマンド 'import_csv' 未定義`,
      );
      throw new Error("Rust側に 'import_csv' コマンドが実装されていません");
    }

    try {
      const result = await rawCommands.importCsv({ filePaths });
      const unwrapped = unwrapResult(
        result as
          | { status: "ok"; data: ImportCsvResult[] }
          | { status: "error"; error: string },
        "CSVの読み込みに失敗しました",
      );
      console.log(`✅ [csvService.importCsv] インポート成功:`, unwrapped);
      return unwrapped;
    } catch (error) {
      console.error(`🛑 [csvService.importCsv] インポート失敗`, error);
      throw error;
    }
  },
};
