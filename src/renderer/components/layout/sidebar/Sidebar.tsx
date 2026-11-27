// src/renderer/components/layout/sidebar/Sidebar.tsx

import { memo, startTransition, useCallback } from "react";
import { clsx } from "clsx";
import { useShallow } from "zustand/shallow";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import {
  SIDEBAR_VIEW_ITEMS,
  type AppViewId,
} from "@renderer/registry/appRegistry";
import { useAppStore } from "@renderer/store";

import * as styles from "./sidebar.css";

export const Sidebar = memo(function Sidebar() {
  const {
    currentView,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    setCurrentView,
  } = useAppStore(
    useShallow((s) => ({
      currentView: s.currentView,
      isSidebarOpen: s.isSidebarOpen,
      toggleSidebar: s.toggleSidebar,
      setSidebarOpen: s.setSidebarOpen,
      setCurrentView: s.setCurrentView,
    })),
  );

  const handleItemClick = useCallback(
    (view: AppViewId) => {
      setSidebarOpen(false);
      if (view === currentView) return;

      startTransition(() => {
        setCurrentView(view);
      });
    },
    [currentView, setSidebarOpen, setCurrentView],
  );

  return (
    <aside
      className={clsx(styles.sidebar, isSidebarOpen && styles.sidebarOpen)}
    >
      <div className={styles.header}>
        <span className={styles.headerTitle}>SideMenu</span>
        <CloseButton onClick={toggleSidebar} />
      </div>

      <ul className={styles.menuList}>
        {SIDEBAR_VIEW_ITEMS.map((item) => (
          <li key={item.id} className={styles.menuItem}>
            <button
              type="button"
              className={styles.menuButton}
              data-active={currentView === item.id}
              onClick={() => handleItemClick(item.id)}
            >
              <span className={styles.menuText}>{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";