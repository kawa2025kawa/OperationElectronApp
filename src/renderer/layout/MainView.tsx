// src/renderer/layout/MainView.tsx

import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";

import { useAppStore } from "@renderer/store";
import { APP_REGISTRY, type AppViewId } from "@renderer/registry/appRegistry";

import { Footer } from "@renderer/components/layout/footer/Footer";
import { Navbar } from "@renderer/components/layout/navbar/Navbar";
import { Sidebar } from "@renderer/components/layout/sidebar/Sidebar";
import { UnknownView } from "./UnknownView";

import * as styles from "./mainView.css";

export const MainView = memo(() => {
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
                <motion.div
                  key={viewId}
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{
                    duration: 0.12,
                    ease: "easeOut",
                  }}
                  aria-hidden={!isActive}
                  style={{
                    display: isActive ? "block" : "none",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <ViewComponent />
                </motion.div>
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
