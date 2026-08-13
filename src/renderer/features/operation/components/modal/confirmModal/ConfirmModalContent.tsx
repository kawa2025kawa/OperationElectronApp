// src/renderer/features/operation/components/modal/confirmModal/ConfirmModalContent.tsx

import React from "react";

import type { ModalContentProps } from "../useOperationModalLogic";

import { useConfirmModalLogic } from "./useConfirmModalLogic";

import * as styles from "./confirmModalContent.css";

interface ConfirmModalContentProps extends ModalContentProps {
  url?: string | null;
  label?: string;
  baseUrl?: string;
}

export const ConfirmModalContent: React.FC<ConfirmModalContentProps> =
  React.memo(({ url, label = "URL", baseUrl, registerPrimaryAction }) => {
    const { finalUrl, hasUrl } = useConfirmModalLogic({
      url,
      baseUrl,
      registerPrimaryAction,
    });

    return (
      <div className={styles.container}>
        <p className={styles.mainMessage}>{label}</p>

        <div className={styles.urlDisplayBox}>
          {hasUrl ? (
            <p className={styles.urlText}>{finalUrl}</p>
          ) : (
            <p className={styles.urlText}>{label}が設定されていません</p>
          )}
        </div>
      </div>
    );
  });

ConfirmModalContent.displayName = "ConfirmModalContent";

export default ConfirmModalContent;
