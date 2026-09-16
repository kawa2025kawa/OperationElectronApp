// scripts/release.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const APP_NAME = "OperationElectronApp";
const EXE_NAME = `${APP_NAME}-setup.exe`;
const UPDATE_JSON_NAME = `${APP_NAME}_update.json`;

const RELEASE_DIR = path.join(projectRoot, "release");

const DISTRIBUTION_DIR =
  "\\\\S0088210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp";

const EXE_PATH = path.join(DISTRIBUTION_DIR, EXE_NAME);
const UPDATE_JSON_PATH = path.join(DISTRIBUTION_DIR, UPDATE_JSON_NAME);

const UPDATE_URL =
  "file://///S0088210/情報システム/チェックリスト/05_作業マニュアル/オペレーション関連/ソフトウェア/OperationApp/OperationElectronApp-setup.exe";

/**
 * package.json から現在のバージョンを取得
 */
function getVersion() {
  const packageJsonPath = path.join(projectRoot, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  if (!packageJson.version) {
    throw new Error("[Release] package.json に version がありません。");
  }

  return packageJson.version;
}

/**
 * release ディレクトリから最新の Setup.exe を取得
 *
 * ⚠️【重要警告・変更厳禁】⚠️
 * ここでファイル名の文字列比較やバージョン番号（version）でのフィルター判定を行わないこと！
 * electron-builder の出力名変更やスペーシングの違い、過去ビルドの残骸により、
 * 正しい最新 EXE を誤検知・取得失敗してアップデート通知が壊れる原因になります。
 * 絶対に `mtimeMs`（ファイルの最終更新日時）によるソートロジックを変更しないでください。
 */
function findInstaller(version) {
  if (!fs.existsSync(RELEASE_DIR)) {
    throw new Error(
      `[Release] release ディレクトリが存在しません: ${RELEASE_DIR}`,
    );
  }

  // 🎯 【重要】ファイル名文字列ではなく、ファイルの更新日時（mtimeMs）で最新の EXE を特定する
  const exeFiles = fs
    .readdirSync(RELEASE_DIR, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".exe"),
    )
    .map((entry) => {
      const fullPath = path.join(RELEASE_DIR, entry.name);
      return {
        path: fullPath,
        name: entry.name,
        mtime: fs.statSync(fullPath).mtimeMs,
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // 更新日時が新しい順（降順）にソート

  if (exeFiles.length === 0) {
    throw new Error(
      `[Release] release ディレクトリに .exe ファイルが見つかりません: ${RELEASE_DIR}`,
    );
  }

  const latestInstaller = exeFiles[0].path;

  // バージョン番号チェック（警告ログのみ。取得ロジックには絶対に介入させない）
  if (!exeFiles[0].name.includes(version)) {
    console.warn(
      `[Release] Warning: 最新の EXE (${exeFiles[0].name}) にバージョン文字列 (${version}) が含まれていない可能性があります。`,
    );
  }

  return latestInstaller;
}

/**
 * インストーラーを共有フォルダへコピー
 */
function copyInstaller(sourcePath) {
  fs.mkdirSync(DISTRIBUTION_DIR, { recursive: true });

  fs.copyFileSync(sourcePath, EXE_PATH);

  console.log(
    `[Release] Installer copied:\n` + `  ${sourcePath}\n` + `  -> ${EXE_PATH}`,
  );
}

/**
 * update JSON を生成
 */
function writeUpdateManifest(version) {
  const updateData = {
    version,
    notes: `${APP_NAME} バージョン ${version} アップデート`,
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: "",
        url: UPDATE_URL,
      },
    },
  };

  fs.writeFileSync(
    UPDATE_JSON_PATH,
    `${JSON.stringify(updateData, null, 2)}\n`,
    "utf-8",
  );

  console.log(
    `[Release] Update manifest generated:\n` + `  ${UPDATE_JSON_PATH}`,
  );
}

/**
 * Release
 */
function main() {
  console.log(`[Release] Starting ${APP_NAME} release...`);

  const version = getVersion();
  const installerPath = findInstaller(version);

  console.log(`[Release] Version: v${version}`);
  console.log(`[Release] Installer: ${path.basename(installerPath)}`);
  console.log(`[Release] Distribution: ${DISTRIBUTION_DIR}`);

  copyInstaller(installerPath);
  writeUpdateManifest(version);

  console.log(`[Release] Completed successfully: v${version}`);
}

try {
  main();
} catch (error) {
  console.error("[Release] Failed:", error);
  process.exitCode = 1;
}
