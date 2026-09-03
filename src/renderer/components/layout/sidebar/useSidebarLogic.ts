// src/renderer/components/layout/sidebar/useSidebarLogic.ts

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { useAppStore } from "@renderer/store";
import type { AppViewId } from "@shared/types/ui";

const ORDERED_MENU_ITEMS = Object.values(APP_REGISTRY)
  .filter((item) => item.sidebarMenu?.show)
  .sort((a, b) => (a.sidebarMenu?.order ?? 0) - (b.sidebarMenu?.order ?? 0));

export const useSidebarLogic = () => {
  const {
    currentView,
    isSidebarOpen,
    theme,
    toggleSidebar,
    setSidebarOpen,
    toggleTheme,
    setCurrentView,
  } = useAppStore(
    useShallow((s) => ({
      currentView: s.currentView,
      isSidebarOpen: s.isSidebarOpen,
      theme: s.theme,
      toggleSidebar: s.toggleSidebar,
      setSidebarOpen: s.setSidebarOpen,
      toggleTheme: s.toggleTheme,
      setCurrentView: s.setCurrentView,
    })),
  );

  const handleItemClick = useCallback(
    (view: AppViewId) => {
      setSidebarOpen(false);
      setCurrentView(view);
    },
    [setSidebarOpen, setCurrentView],
  );

  return {
    currentView,
    isSidebarOpen,
    theme,
    toggleSidebar,
    setSidebarOpen,
    toggleTheme,
    handleItemClick,
    menuItems: ORDERED_MENU_ITEMS,
  };
};
