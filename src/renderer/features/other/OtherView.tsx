import React, { useCallback } from "react";
import { clsx } from "clsx";
import { animateFadeIn } from "@renderer/styles/tokens";
import { useAppStore } from "@shared/store";
import { GmailModalContent } from "./components/modal/gmailModal/GmailModalContent";
import { PdfUploadModalContent } from "./components/modal/pdfUploadModal/PdfUploadModalContent";
import * as styles from "./otherView.css";

export const OtherView: React.FC = () => {
  const openGlobalModal = useAppStore((s) => s.openGlobalModal);
  const closeGlobalModal = useAppStore((s) => s.closeGlobalModal);

  const handleOpenPdfUpload = useCallback(() => {
    openGlobalModal(<PdfUploadModalContent onClose={closeGlobalModal} />, {
      title: "Tempomatic",
      width: "min(80vw, 850px)",
      height: "min(75vh, 650px)",
    });
  }, [openGlobalModal, closeGlobalModal]);

  const handleOpenGmailDraft = useCallback(() => {
    openGlobalModal(<GmailModalContent onClose={closeGlobalModal} />, {
      title: "Gmail下書き作成",
      width: "min(80vw, 850px)",
      height: "min(75vh, 750px)",
    });
  }, [openGlobalModal, closeGlobalModal]);

  const tools = [
    {
      id: "pdfUpload",
      name: "Tempomatic PDFアップロード",
      onClick: handleOpenPdfUpload,
    },
    {
      id: "gmailDraft",
      name: "Gmail下書き作成",
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
            {tool.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OtherView;
