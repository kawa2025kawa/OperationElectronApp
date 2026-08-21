// src/renderer/features/other/OtherView.tsx

import React, { useCallback } from "react";
import { clsx } from "clsx";
import { animateFadeIn } from "@renderer/styles/tokens";
import { OtherModal } from "./components/modal/OtherModal";
import { useAppStore } from "@shared/store";
import * as styles from "./otherView.css";

interface OtherToolAction {
  id: string;
  name: string;
  onClick: () => void;
}

export const OtherView: React.FC = () => {
  const openGlobalModal = useAppStore((s) => s.openGlobalModal);
  const closeGlobalModal = useAppStore((s) => s.closeGlobalModal);

  // =====================================================
  // 店舗matic
  // =====================================================
  const handleOpenPdfUpload = useCallback(() => {
    openGlobalModal(
      <OtherModal type="pdfUpload" onClose={closeGlobalModal} />,
      {
        title: "店舗matic",
        width: "min(80vw, 850px)",
        height: "min(75vh, 650px)",
      },
    );
  }, [openGlobalModal, closeGlobalModal]);

  // =====================================================
  // 下書きメール
  // =====================================================
  const handleOpenGmailDraft = useCallback(() => {
    openGlobalModal(
      <OtherModal
        type="gmail"
        onClose={closeGlobalModal}
        gmailTemplateSelection
      />,
      {
        title: "下書きメール",
        width: "min(80vw, 850px)",
        height: "min(75vh, 750px)",
      },
    );
  }, [openGlobalModal, closeGlobalModal]);

  // =====================================================
  // Tools
  // =====================================================
  const tools: OtherToolAction[] = [
    {
      id: "pdfUpload",
      name: "店舗matic",
      onClick: handleOpenPdfUpload,
    },
    {
      id: "gmailDraft",
      name: "下書きメール",
      onClick: handleOpenGmailDraft,
    },
  ];

  return (
    <div className={clsx(styles.container, animateFadeIn)}>
      <div className={styles.grid}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={styles.card}
            onClick={tool.onClick}
            type="button"
          >
            <span className={styles.cardTitle}>{tool.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OtherView;
