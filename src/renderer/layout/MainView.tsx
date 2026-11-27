// src/renderer/layout/MainView.tsx

import { memo, useEffect, useState } from "react";

import { Footer } from "@renderer/components/layout/footer/Footer";
import { Navbar } from "@renderer/components/layout/navbar/Navbar";
import { Sidebar } from "@renderer/components/layout/sidebar/Sidebar";
import { APP_REGISTRY, type AppViewId } from "@renderer/registry/appRegistry";
import { useAppStore } from "@renderer/store";

import * as styles from "./mainView.css";

export const UnknownView = ({ view }: { readonly view: string }) => (
  <div className={styles.unknownViewContainer}>
    <h2>⚠️ SYSTEM ERROR: Unknown View</h2>
    <p>
      レジストリに登録されていない、または指定された画面 ID（{view}
      ）の実体コンポーネントをバインドできませんでした。
    </p>
    <span>src/renderer/registry/appRegistry.ts の定義を確認してください。</span>
  </div>
);

export const MainView = memo(function MainView() {
  const currentView = useAppStore((state) => state.currentView);
  const [visitedViews, setVisitedViews] = useState<AppViewId[]>(() =>
    currentView ? [currentView] : [],
  );

  useEffect(() => {
    if (!currentView) return;
    setVisitedViews((prev) =>
      prev.includes(currentView) ? prev : [...prev, currentView],
    );
  }, [currentView]);

  const hasRegisteredView = Boolean(APP_REGISTRY[currentView]?.component);

  return (
    <div className={styles.appContainer}>
      <Navbar />

      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>
          <div className={styles.viewWrapper}>
            {visitedViews.map((viewId) => {
              const ViewComponent = APP_REGISTRY[viewId]?.component;
              if (!ViewComponent) return null;

              const isActive = viewId === currentView;

              return (
                <div
                  key={viewId}
                  aria-hidden={!isActive}
                  className={styles.viewPane[isActive ? "active" : "hidden"]}
                >
                  <ViewComponent />
                </div>
              );
            })}

            {!hasRegisteredView && <UnknownView view={currentView} />}
          </div>

          <Footer />
        </main>
      </div>

      <Sidebar />
    </div>
  );
});

MainView.displayName = "MainView";