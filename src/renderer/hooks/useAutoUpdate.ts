// src/renderer/hooks/useAutoUpdate.ts

import { useEffect } from "react";
import { commands } from "@renderer/services/commands";
import { showToast } from "@renderer/utils/toastUtils";

const DEFAULT_UPDATE_EXE_PATH =
  "\\\\S0088210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp\\OperationElectronApp-setup.exe";

const CURRENT_VERSION = import.meta.env.APP_VERSION ?? "0.0.0";

const isNewerVersion = (
  latestVersion: string,
  currentVersion: string,
): boolean => {
  const parse = (version: string) =>
    version.replace(/^v/, "").split(".").map(Number);

  const latest = parse(latestVersion);
  const current = parse(currentVersion);

  for (let i = 0; i < Math.max(latest.length, current.length); i++) {
    const latestPart = latest[i] ?? 0;
    const currentPart = current[i] ?? 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
};

export const useAutoUpdate = () => {
  const checkForUpdates = async (): Promise<void> => {
    try {
      const updateInfo = await commands.readUpdateInfo();

      if (!updateInfo) {
        return;
      }

      if (!isNewerVersion(updateInfo.version, CURRENT_VERSION)) {
        return;
      }

      const confirmed = window.confirm(
        `新しいバージョン v${updateInfo.version} が利用可能です。\n\n` +
          `更新内容: ${
            updateInfo.notes ?? "最新バージョンへのアップデート"
          }\n\n` +
          "インストーラーを開きますか？",
      );

      if (!confirmed) {
        return;
      }

      // updateInfo 側にインストーラーパスがあればそれを優先（動的化）
      const targetPath =
        (updateInfo as { installerPath?: string }).installerPath ??
        DEFAULT_UPDATE_EXE_PATH;

      await commands.openExternal(targetPath);
    } catch (error) {
      console.error("[AutoUpdate] Update check or execution failed:", error);
      showToast("アップデートインストーラーの起動に失敗しました", "error");
    }
  };

  useEffect(() => {
    void checkForUpdates();
  }, []);

  return { checkForUpdates };
};
