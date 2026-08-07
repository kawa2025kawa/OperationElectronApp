//src\renderer\components\layout\sidebar\Sidebar.tsx

import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@shared/store/index";
import { Overlay } from "@renderer/components/ui/overlay/Overlay";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";

import { useSidebarLogic } from "./hooks/useSidebarLogic";
// ⭕ 修正: @shared ではなく @renderer/registry/appRegistry からインポート
import { APP_REGISTRY } from "@renderer/registry/appRegistry";

import * as styles from "./sidebar.css";

// レジストリからサイドバー表示対象を抽出し、並び順（order）でソート
// レジストリからサイドバー表示対象を抽出し、並び順（order）でソート
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
  } = useAppStore(
    useShallow((s) => ({
      currentView: s.currentView,
      isSidebarOpen: s.isSidebarOpen,
      theme: s.theme,
      toggleSidebar: s.toggleSidebar,
      setSidebarOpen: s.setSidebarOpen,
      toggleTheme: s.toggleTheme,
    })),
  );

  const { handleItemClick } = useSidebarLogic();

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
            className={styles.toggleTrack}
            onClick={toggleTheme}
            aria-label="テーマ切り替え"
            style={{
              border: "none",
              padding: 0,
            }}
          >
            <div className={styles.toggleThumb} data-state={theme} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
