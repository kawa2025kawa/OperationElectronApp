// src/renderer/registry/setupRegistry.ts
import React from "react";
import { APP_REGISTRY, EXTRA_MODAL_REGISTRY } from "./appRegistry";
import { APP_VIEW_IDS, EXTRA_MODAL_TYPES } from "@shared/types/uiType";
import { useAppStore } from "@shared/store";

import OperationView from "@renderer/features/operation/OperationView";
import { RdpView } from "@renderer/features/remoteDesktop/RdpView";
import AuthView from "@renderer/features/auth/AuthView";
import SpreadSheetView from "@renderer/features/spreadSheet/SpreadSheetView";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";

const COMPONENT_MAP = {
  [APP_VIEW_IDS.OPERATION]: OperationView,
  [APP_VIEW_IDS.RDP]: RdpView,
  [APP_VIEW_IDS.AUTH]: AuthView,
  [APP_VIEW_IDS.KOKYUHYO]: SpreadSheetView,
  [APP_VIEW_IDS.JUGYOIN]: SpreadSheetView,
  [APP_VIEW_IDS.SHOP]: SpreadSheetView,
  [APP_VIEW_IDS.TANTOU]: SpreadSheetView,
} as const;

interface CustomGlobal {
  useAppStore?: typeof useAppStore;
}

export const setupAppRegistry = (): void => {
  // 1. 各 View コンポーネントのバインド
  Object.entries(COMPONENT_MAP).forEach(([viewId, component]) => {
    const registryItem = APP_REGISTRY[viewId as keyof typeof COMPONENT_MAP];
    if (registryItem) {
      registryItem.component = component;
    }
  });

  // 2. モーダル実行フックの遅延バインド（循環参照防止）
  const pdfUploadModal = EXTRA_MODAL_REGISTRY[EXTRA_MODAL_TYPES.PDF_UPLOAD];
  if (pdfUploadModal) {
    pdfUploadModal.execute = (store) =>
      store.openGlobalModal(
        React.createElement(OperationModal, {
          type: "pdfUpload",
          onClose: store.closeGlobalModal,
        }),
        {
          title: "PDFアップロード",
          width: "min(75vw, 850px)",
          height: "min(75vh, 650px)",
        },
      );
  }

  // 3. デバッグ用に Zustand Store をグローバル領域へ展開
  if (typeof window !== "undefined") {
    (globalThis as unknown as CustomGlobal).useAppStore = useAppStore;
  }
};
