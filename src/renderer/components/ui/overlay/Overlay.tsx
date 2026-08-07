// src/renderer/components/ui/overlay/Overlay.tsx
import React from "react";
import { motion } from "framer-motion";
import * as styles from "./overlay.css";

interface OverlayProps {
  isOpen: boolean;
  onClick?: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ isOpen, onClick }) => {
  return (
    <motion.div
      // ★ 修正: fullScreenLoaderBase (1200) ではなく backdropBase (900) を使用する
      className={`${styles.backdropBase} ${styles.backdropStates[isOpen ? "open" : "closed"]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    />
  );
};

export interface LoadingContentProps {
  message?: string;
  statusMessage?: string;
}

const DOT_DELAYS = [0, 0.2, 0.4];

export const LoadingContent: React.FC<LoadingContentProps> = ({
  message = "LOADING...",
  statusMessage = "INITIALIZING SYSTEM CORE",
}) => {
  return (
    <div className={styles.contentWrapper}>
      <div className={styles.grid}>
        <div className={styles.scanline} />
        <div className={styles.content}>
          <div className={styles.title}>{message}</div>
          <div className={styles.dots}>
            {DOT_DELAYS.map((delay, i) => (
              <span key={i} className={styles.dot} style={{ animationDelay: `${delay}s` }} />
            ))}
          </div>
          <div className={styles.status}>{statusMessage}</div>
        </div>
      </div>
    </div>
  );
};
