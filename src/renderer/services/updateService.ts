// src/renderer/services/updateService.ts

import semver from "semver";
import { useAppStore } from "@renderer/store";
import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
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
 * 最新バージョンが現在のバージョンより新しいか判定する
 */
function isNewerVersion(
  latestVersion: string,
  currentVersion: string,
): boolean {
  const latest = semver.coerce(latestVersion);
  const current = semver.coerce(currentVersion);

  if (!latest || !current) {
    return false;
  }

  return semver.gt(latest, current);
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
      // インストーラープロセスの起動完了を待機後、アプリを終了して後続処理を停止
      await new Promise((resolve) => setTimeout(resolve, 500));
      await systemIpcService.quitApp();
      return false;
    } catch (launchError) {
      console.error("[updateService] Failed to launch installer:", launchError);
      usePollingToastStore
        .getState()
        .addToast("アップデートインストーラーの起動に失敗しました", "error");
      setStatus("NG");
      return false;
    }
  } catch (error) {
    console.error("[updateService] Update check failed:", error);
    setStatus("NG");

    // 更新情報を取得できなくても、認証確認と通常の初期化は続行する
    return true;
  }
}

export const updateService = {
  check,
};