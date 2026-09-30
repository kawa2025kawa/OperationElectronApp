// src/renderer/services/updateService.ts

import { systemCommands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import { showToast } from "@renderer/utils/toastUtils";

const DEFAULT_UPDATE_EXE_PATH =
  "\\\\S0088210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp\\OperationElectronApp-setup.exe";

const CURRENT_VERSION = import.meta.env.APP_VERSION ?? "0.0.0";

function setStatus(status: "OK" | "NG"): void {
  useAppStore.getState().setInitStatus({
    update: status,
  });
}

function parseVersion(version: string): number[] {
  return version
    .replace(/^v/, "")
    .split(".")
    .map((part) => {
      const value = Number(part);
      return Number.isFinite(value) ? value : 0;
    });
}

function isNewerVersion(
  latestVersion: string,
  currentVersion: string,
): boolean {
  const latest = parseVersion(latestVersion);
  const current = parseVersion(currentVersion);
  const length = Math.max(latest.length, current.length);

  for (let index = 0; index < length; index++) {
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

async function check(): Promise<boolean> {
  try {
    const updateInfo = await systemCommands.readUpdateInfo();

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

    await systemCommands.openExternal(DEFAULT_UPDATE_EXE_PATH);

    setStatus("OK");
    return true;
  } catch (error) {
    console.error("[updateService] Update check failed:", error);

    showToast("アップデートインストーラーの起動に失敗しました", "error");

    setStatus("NG");
    return false;
  }
}

export const updateService = {
  check,
};
