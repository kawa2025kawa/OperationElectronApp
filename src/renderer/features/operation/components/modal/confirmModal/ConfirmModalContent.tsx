import React from "react";
import type { ModalContentProps } from "@renderer/features/operation/components/modal/useOperationModalLogic";
import * as styles from "./confirmModalContent.css";
import { useConfirmModalLogic } from "./useConfirmModalLogic";

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
            <p className={styles.urlText}>{label}未設定</p>
          )}
        </div>
      </div>
    );
  });

ConfirmModalContent.displayName = "ConfirmModalContent";

export default ConfirmModalContent;
