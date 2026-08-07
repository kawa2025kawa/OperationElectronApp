// src/renderer/features/operation/components/modal/OperationModal.tsx
import React, { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import { selectActiveItemStatusFlags } from "@shared/store/selectors/operationSelectors";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { operationViewConfig } from "@renderer/features/operation/config/operationView";
import type { OperationModalType } from "@shared/types/uiType";
import type { OperationItem } from "@shared/types/operationType"; // 👈 追加

import { JcModalContent } from "./contents/jcModal/JcModalContent";
import { ScriptModalContent } from "./contents/scriptModal/ScriptModalContent";
import { PdfUploadModalContent } from "./contents/pdfUploadModal/PdfUploadModalContent";
import { LinkModalContent } from "./contents/linkModal/LinkModalContent";
import { ConfirmModalContent } from "./contents/confirmModal/ConfirmModalContent";
import { SummaryModalContent } from "./contents/summaryModal/SummaryModalContent";
import * as styles from "./operationModal.css";

export interface ModalContentProps {
  onClose: () => void;
  setFooterConfig: (config: {
    primaryText?: string;
    primaryDisabled?: boolean;
    onPrimary?: () => void | Promise<void>;
    hidePrimary?: boolean;
  }) => void;
}

interface Props {
  type: OperationModalType;
  items?: OperationItem[]; // 👈 itemsの受け取りを定義
  onClose: () => void;
}

export const OperationModal: React.FC<Props> = React.memo(
  ({ type, items = [], onClose }) => {
    // 👈 items = [] を追加
    const [footerConfig, setFooterConfig] = useState<{
      primaryText?: string;
      primaryDisabled?: boolean;
      onPrimary?: () => void | Promise<void>;
      hidePrimary?: boolean;
    }>({});

    const { selectedItem, isExecuting, resetPdfUpload } = useAppStore(
      useShallow((s) => {
        const flags = selectActiveItemStatusFlags(s);
        return {
          selectedItem: flags.item,
          isExecuting: flags.isExecuting || s.pdfUpload.isProcessing,
          resetPdfUpload: s.resetPdfUpload,
        };
      }),
    );

    const title = useMemo(() => {
      if (type === "pdfUpload") return "PDF アップロード";
      if (type === "jc") {
        return `JobID:${selectedItem?.jobId ?? ""}`;
      }
      const action = operationViewConfig.actions?.find((a) => a.key === type);
      if (action) {
        return action.label;
      }
      return selectedItem?.workName ?? "";
    }, [type, selectedItem]);

    const urlValue = selectedItem?.url
      ? String(Object.values(selectedItem.url)[0] ?? "")
      : "";
    const manualValue =
      typeof selectedItem?.manual === "string" ? selectedItem.manual : "";

    const handleClose = useCallback(() => {
      if (type === "pdfUpload") resetPdfUpload();
      onClose();
    }, [type, resetPdfUpload, onClose]);

    const renderModalContent = () => {
      const commonProps = { onClose: handleClose, setFooterConfig };

      switch (type) {
        case "summary":
          return <SummaryModalContent {...commonProps} items={items} />;
        case "jc":
          return <JcModalContent {...commonProps} />;
        case "script":
          return <ScriptModalContent {...commonProps} />;
        case "pdfUpload":
          return <PdfUploadModalContent {...commonProps} />;
        case "link":
          return <LinkModalContent {...commonProps} />;
        case "url":
          return (
            <ConfirmModalContent
              {...commonProps}
              value={urlValue}
              label="URL"
            />
          );
        case "manual":
          return (
            <ConfirmModalContent
              {...commonProps}
              value={manualValue}
              label="マニュアル"
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <CloseButton onClick={handleClose} disabled={isExecuting} />
        </header>
        <main className={styles.centerContent}>{renderModalContent()}</main>
        <footer className={styles.actionContainer}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleClose}
            disabled={isExecuting}
          >
            閉じる
          </button>
          {!footerConfig.hidePrimary && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={footerConfig.onPrimary}
              disabled={isExecuting || footerConfig.primaryDisabled}
            >
              {isExecuting ? "実行中..." : footerConfig.primaryText || "実行"}
            </button>
          )}
        </footer>
      </div>
    );
  },
);

OperationModal.displayName = "OperationModal";
export default OperationModal;
