// src/renderer/components/ui/modal/GlobalModalManager.tsx

import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";
import * as styles from "./globalModalManager.css";

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } },
};

export const GlobalModalManager: React.FC = () => {
  const modalRoot =
    typeof window !== "undefined"
      ? document.getElementById("modal-root")
      : null;

  const { modalContent, modalConfig, closeModal } = useAppStore(
    useShallow((s) => ({
      modalContent: s.modalContent,
      modalConfig: s.modalConfig,
      closeModal: s.closeGlobalModal,
    })),
  );

  if (!modalRoot || !modalContent) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="global-modal-overlay"
        className={styles.overlay}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={closeModal}
      >
        <motion.div
          className={styles.contentWrapper}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          // ★ modalConfigに指定がない場合は undefined を渡してCSSの85vw/85vhを優先させる
          style={{
            width: modalConfig?.width ?? undefined,
            height: modalConfig?.height ?? undefined,
          }}
        >
          {modalContent}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    modalRoot,
  );
};

GlobalModalManager;
