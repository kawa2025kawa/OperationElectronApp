// src/renderer/services/updateService.ts

import { useAppStore } from "@renderer/store";
import { showToast } from "@renderer/utils/toastUtils";
import { systemIpcService } from "@renderer/services/systemIpcService";

const DEFAULT_UPDATE_EXE_PATH =
  "\\\\192.88.1.210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp\\OperationElectronApp-setup.exe";

const CURRENT_VERSION = import.meta.env.APP_VERSION ?? "0.0.0";

/**
 * 初期化ステータスの更新を行う
 */
function setStatus(status: "OK" | "NG"): void {
  useAppStore.getState().setInitStatus({
    update: status,
  });
}

/**
 * バージョン文字列（例: "v1.2.3"）を数値配列 [1, 2, 3] に変換する
 */
function parseVersion(version: string): number[] {
  const cleanVersion = version.replace(/^v/i, "").split("-")[0] ?? "";
  return cleanVersion.split(".").map((part) => {
    const value = Number.parseInt(part, 10);
    return Number.isFinite(value) ? value : 0;
  });
}

/**
 * 最新バージョンが現在のバージョンより新しいか判定する
 */
function isNewerVersion(
  latestVersion: string,
  currentVersion: string,
): boolean {
  const latest = parseVersion(latestVersion);
  const current = parseVersion(currentVersion);
  const maxLength = Math.max(latest.length, current.length);

  for (let index = 0; index < maxLength; index++) {
    const latestPart = latest[index] ?? 0;
    const currentPart = current[index] ?? 0;

    if (latestPart > currentPart) {
      return true;
    }

    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

/**
 * アップデート情報をチェックし、必要に応じてインストーラーを起動する
 */
async function check(): Promise<boolean> {
  try {
    const updateInfo = await systemIpcService.readUpdateInfo();

    // 更新情報が存在しない、または最新版でない場合は正常起動として継続
    if (!updateInfo || !isNewerVersion(updateInfo.version, CURRENT_VERSION)) {
      setStatus("OK");
      return true;
    }

    const confirmed = window.confirm(
      `新しいバージョン v${updateInfo.version} が利用可能です。\n\n` +
        `更新内容: ${
          updateInfo.notes ?? "最新バージョンへのアップデート"
        }\n\n` +
        "インストーラーを開きますか？",
    );

    if (!confirmed) {
      setStatus("OK");
      return true;
    }

    // JSON側に個別のURL/パス指定があれば優先し、無ければデフォルトのUNCパスを使用
    const installerPath =
      updateInfo.platforms?.["windows-x86_64"]?.url ?? DEFAULT_UPDATE_EXE_PATH;

    try {
      await systemIpcService.openExternal(installerPath);
      setStatus("OK");
      return true;
    } catch (launchError) {
      console.error("[updateService] Failed to launch installer:", launchError);
      showToast("アップデートインストーラーの起動に失敗しました", "error");
      setStatus("NG");
      return false;
    }
  } catch (error) {
    console.error("[updateService] Update check failed:", error);
    setStatus("NG");
    return false;
  }
}

export const updateService = {
  check,
};
