// src/renderer/layout/MainView.tsx

import React, { useEffect } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";

import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { commands } from "@renderer/services/commands";
import { showToast } from "@renderer/utils/toastUtils";

import { Footer } from "@renderer/components/layout/footer/Footer";
import { Navbar } from "@renderer/components/layout/navbar/Navbar";
import { Sidebar } from "@renderer/components/layout/sidebar/Sidebar";
import { UnknownView } from "./UnknownView";

// 🎯 正しいスタイルファイル名（mainView.css）でインポート
import * as styles from "./mainView.css";

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

    if (!confirmed) return false;

    const targetPath =
      (updateInfo as { installerPath?: string }).installerPath ??
      DEFAULT_UPDATE_EXE_PATH;

    await commands.openExternal(targetPath);
    return true;
  } catch (error) {
    console.error("[MainView] Update check or execution failed:", error);
    showToast("アップデートインストーラーの起動に失敗しました", "error");
    return false;
  }
}

export const MainView: React.FC = React.memo(() => {
  const { currentView, isSidebarOpen } = useAppStore(
    useShallow((state: AppState) => ({
      currentView: state.currentView,
      isSidebarOpen: state.isSidebarOpen ?? false,
    })),
  );

  const ViewComponent = APP_REGISTRY[currentView]?.component ?? null;

  useEffect(() => {
    void checkAndApplyUpdate();
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className={styles.appContainer}>
        <Navbar />

        <div className={styles.contentWrapper}>
          <aside
            className={clsx(
              styles.sidebarBase,
              styles.sidebarCollapsed[
                String(!isSidebarOpen) as "true" | "false"
              ],
            )}
          >
            <Sidebar />
          </aside>

          <main className={styles.mainContent}>
            <div className={styles.viewWrapper}>
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={currentView || "default"}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ width: "100%", height: "100%" }}
                >
                  {ViewComponent ? (
                    <ViewComponent />
                  ) : (
                    <UnknownView view={currentView} />
                  )}
                </m.div>
              </AnimatePresence>
            </div>

            <Footer />
          </main>
        </div>
      </div>
    </LazyMotion>
  );
});

MainView.displayName = "MainView";
