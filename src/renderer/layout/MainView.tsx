//src\renderer\layout\MainView.tsx

import { memo } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";

import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";

import { Footer } from "@renderer/components/layout/footer/Footer";
import { Navbar } from "@renderer/components/layout/navbar/Navbar";
import { Sidebar } from "@renderer/components/layout/sidebar/Sidebar";
import { UnknownView } from "./UnknownView";

import * as styles from "./mainView.css";

export const MainView = memo(() => {
  const { currentView, isSidebarOpen } = useAppStore(
    useShallow((state: AppState) => ({
      currentView: state.currentView,
      isSidebarOpen: state.isSidebarOpen ?? false,
    })),
  );

  const ViewComponent = APP_REGISTRY[currentView]?.component ?? null;

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
                  initial={{
                    opacity: 0,
                    x: 12,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -12,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
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
