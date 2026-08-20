// src/renderer/layout/MainView.tsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { Footer } from "@renderer/components/layout/footer/Footer";
import { Navbar } from "@renderer/components/layout/navbar/Navbar";
import { Sidebar } from "@renderer/components/layout/sidebar/Sidebar";
import { UnknownView } from "./UnknownView";
import { useMainViewLogic } from "@renderer/hooks/useMainViewLogic";
import * as styles from "./mainView.css";

export const MainView: React.FC = React.memo(() => {
  const { currentView, ViewComponent, isSidebarOpen } = useMainViewLogic();

  return (
    <div className={styles.appContainer}>
      <Navbar />

      <div className={styles.contentWrapper}>
        <aside
          className={clsx(
            styles.sidebarBase,
            styles.sidebarCollapsed[String(!isSidebarOpen) as "true" | "false"],
          )}
        >
          <Sidebar />
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.viewWrapper}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView}
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
              </motion.div>
            </AnimatePresence>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
});

MainView.displayName = "MainView";

export default MainView;
