// src/renderer/components/layout/sidebar/Sidebar.tsx

import { clsx } from "clsx";

import { Overlay } from "@renderer/components/ui/overlay/Overlay";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { useSidebarLogic } from "./useSidebarLogic";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";

import * as styles from "./sidebar.css";

const ORDERED_MENU_ITEMS = Object.values(APP_REGISTRY)
  .filter((item) => item.sidebarMenu?.show)
  .sort((a, b) => (a.sidebarMenu?.order ?? 0) - (b.sidebarMenu?.order ?? 0));

export const Sidebar = () => {
  const {
    currentView,
    isSidebarOpen,
    theme,
    toggleSidebar,
    setSidebarOpen,
    toggleTheme,
    handleItemClick,
  } = useSidebarLogic();

  return (
    <>
      <Overlay isOpen={isSidebarOpen} onClick={() => setSidebarOpen(false)} />

      <aside
        className={clsx(styles.sidebar, isSidebarOpen && styles.sidebarOpen)}
      >
        <div className={styles.header}>
          <span className={styles.headerTitle}>SideMenu</span>

          <CloseButton onClick={toggleSidebar} />
        </div>

        <ul className={styles.menuList}>
          {ORDERED_MENU_ITEMS.map((item) => (
            <li key={item.id} className={styles.menuItem}>
              <button
                className={styles.menuButton}
                data-active={currentView === item.id}
                onClick={() => handleItemClick(item.id)}
              >
                <span className={styles.menuText}>{item.title}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.sidebarFooter}>
          <span className={styles.footerLabel}>Dark Mode</span>

          <button
            type="button"
            className={styles.toggleTrack}
            onClick={toggleTheme}
            aria-label="テーマ切り替え"
          >
            <div className={styles.toggleThumb} data-state={theme} />
          </button>
        </div>
      </aside>
    </>
  );
};

Sidebar.displayName = "Sidebar";

Sidebar;
