import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { commands } from "@renderer/services/commands";
import { showToast } from "@renderer/utils/toastUtils";

// ============================================================
// 自動アップデート処理（内部ヘルパー）
// ============================================================

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

/**
 * アップデートの有無を確認し、更新がある場合はダイアログを表示してインストーラーを起動する。
 */
export async function checkAndApplyUpdate(): Promise<boolean> {
  try {
    const updateInfo = await commands.readUpdateInfo();

    if (!updateInfo || !isNewerVersion(updateInfo.version, CURRENT_VERSION)) {
      return false;
    }

    const confirmed = window.confirm(
      `新しいバージョン v${updateInfo.version} が利用可能です。\n\n` +
        `更新内容: ${
          updateInfo.notes ?? "最新バージョンへのアップデート"
        }\n\n` +
        "インストーラーを開きますか？",
    );

    if (!confirmed) {
      return false;
    }

    const targetPath =
      (updateInfo as { installerPath?: string }).installerPath ??
      DEFAULT_UPDATE_EXE_PATH;

    await commands.openExternal(targetPath);
    return true;
  } catch (error) {
    console.error("[MainViewLogic] Update check or execution failed:", error);
    showToast("アップデートインストーラーの起動に失敗しました", "error");
    return false;
  }
}

// ============================================================
// メインビューロジックフック
// ============================================================

export const useMainViewLogic = () => {
  const { currentView, isSidebarOpen } = useAppStore(
    useShallow((state: AppState) => ({
      currentView: state.currentView,
      isSidebarOpen: state.isSidebarOpen,
    })),
  );

  const ViewComponent = APP_REGISTRY[currentView]?.component ?? null;

  return {
    currentView,
    ViewComponent,
    isSidebarOpen,
    checkForUpdates: checkAndApplyUpdate,
  };
};
