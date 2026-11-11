// src/renderer/layout/MainView.tsx

import { memo } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useAppStore } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";

import { Footer } from "@renderer/components/layout/footer/Footer";
import { Navbar } from "@renderer/components/layout/navbar/Navbar";
import { Sidebar } from "@renderer/components/layout/sidebar/Sidebar";
import { UnknownView } from "./UnknownView";

import * as styles from "./mainView.css";

export const MainView = memo(() => {
  const currentView = useAppStore((state) => state.currentView);

  const ViewComponent = APP_REGISTRY[currentView]?.component ?? null;

  return (
    <div className={styles.appContainer}>
      <Navbar />

      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>
          <div className={styles.viewWrapper}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView || "default"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.15,
                  ease: "linear",
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

      <Sidebar />
    </div>
  );
});

MainView.displayName = "MainView";
