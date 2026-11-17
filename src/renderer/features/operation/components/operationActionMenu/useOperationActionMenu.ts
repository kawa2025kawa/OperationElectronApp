// src/renderer/features/operation/components/operationActionMenu/useOperationActionMenu.ts

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

import {
  buildOperationMenuActions,
  type OperationActionItem,
} from "@renderer/features/operation/utils/operationActionUtils";
import { useAppStore } from "@renderer/store";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";

const EMPTY_ACTIONS: readonly OperationActionItem[] = Object.freeze([]);

export function useOperationActionMenu(item?: OperationViewItem) {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);
  const currentMode = useAppStore((state) => state.currentMode);
  const fetchTableData = useAppStore((state) => state.fetchTableData);

  const handleRefreshTable = useCallback(
    () => fetchTableData(currentMode, true),
    [fetchTableData, currentMode],
  );

  const actions = useMemo(
    () =>
      item
        ? buildOperationMenuActions(item, {
            openGlobalModal,
            onRefreshTable: handleRefreshTable,
          })
        : (EMPTY_ACTIONS as OperationActionItem[]),
    [item, openGlobalModal, handleRefreshTable],
  );

  const isMenuEnabled = Boolean(item && actions.length > 0);

  const itemRef = useRef(item);
  const actionsRef = useRef(actions);

  useLayoutEffect(() => {
    itemRef.current = item;
    actionsRef.current = actions;
  }, [item, actions]);

  const handleActionSelect = useCallback((key: string) => {
    requestAnimationFrame(() => {
      const currentItem = itemRef.current;
      if (!currentItem) {
        return;
      }

      const targetAction = actionsRef.current.find(
        (candidate) => candidate.key === key,
      );

      if (targetAction) {
        void targetAction.execute(currentItem);
      }
    });
  }, []);

  return {
    actions,
    isMenuEnabled,
    handleActionSelect,
  };
}
