// scripts/afterPack.js

import fs from "node:fs";
import path from "node:path";

/**
 * electron-builder の afterPack フック
 * 社内専用クローズドアプリにおいて不要な巨大ライセンス文書を削除して容量を削減する
 */
export default async function afterPack(context) {
  const appOutDir = context.appOutDir;
  const targetFiles = ["LICENSES.chromium.html", "LICENSE.electron.txt"];

  for (const fileName of targetFiles) {
    const filePath = path.join(appOutDir, fileName);
    if (fs.existsSync(filePath)) {
      const sizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
      fs.unlinkSync(filePath);
      console.log(`[afterPack] Removed ${fileName} (${sizeMb} MB)`);
    }
  }
}
