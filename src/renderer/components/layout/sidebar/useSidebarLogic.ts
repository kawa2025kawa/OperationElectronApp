// src/renderer/components/layout/sidebar/useSidebarLogic.ts

import { startTransition, useCallback } from "react";
import { useShallow } from "zustand/shallow";

import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { useAppStore } from "@renderer/store";
import type { AppViewId } from "@renderer/registry/appRegistry";

export const ORDERED_MENU_ITEMS = Object.values(APP_REGISTRY)
  .filter((item) => item.sidebarMenu?.show)
  .sort((a, b) => (a.sidebarMenu?.order ?? 0) - (b.sidebarMenu?.order ?? 0));

export const useSidebarLogic = () => {
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

      if (view === currentView) {
        return;
      }

      startTransition(() => {
        setCurrentView(view);
      });
    },
    [currentView, setSidebarOpen, setCurrentView],
  );

  return {
    currentView,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    handleItemClick,
    menuItems: ORDERED_MENU_ITEMS,
  };
};