// C:\Users\C3088091\Desktop\OperationElectronApp\src\renderer\components\layout\navbar\Navbar.tsx

import React, { useCallback } from "react";
import { TantouButton } from "./components/tantouButton/TantouButton";
import { StatusSummary } from "@renderer/components/ui/statusSummary/StatusSummary";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";
import { HamburgerButton } from "./components/hamburgerButton/HamburgerButton";
import { PollingToggleButton } from "./components/pollingToggleButton/PollingToggleButton";
import { useAppStore } from "@shared/store";
import { STATUS_LABEL } from "@shared/types/uiType";

import { SUMMARY_MODAL_SIZE } from "./navbar.css";
import { useNavbarLogic } from "./useNavbarLogic";
import * as styles from "./navbar.css";

export const Navbar: React.FC = () => {
  const {
    summary,
    navbarTitle,
    summaryDisplayType,
    isKokyuhyo,
    getSummaryModalData,
  } = useNavbarLogic();

  const openGlobalModal = useAppStore((state) => state.openGlobalModal);
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const handleSummaryClick = useCallback(
    (label: string) => {
      const modalData = getSummaryModalData(label);

      if (!modalData) {
        return;
      }

      const { lowerLabel, items } = modalData;

      const title = `${
        STATUS_LABEL[lowerLabel as keyof typeof STATUS_LABEL] ?? label
      } 一覧`;

      openGlobalModal(
        <OperationModal
          type="summary"
          items={items}
          onClose={closeGlobalModal}
        />,
        {
          title,
          width: SUMMARY_MODAL_SIZE.width,
          height: SUMMARY_MODAL_SIZE.height,
        },
      );
    },
    [getSummaryModalData, openGlobalModal, closeGlobalModal],
  );

  return (
    <nav className={styles.container}>
      <HamburgerButton />

      <div className={styles.logoText}>{navbarTitle}</div>

      <div className={styles.centerItem}>
        {summaryDisplayType === "summary" && (
          <div className={styles.centerSummaryWrapper}>
            <StatusSummary data={summary} onItemClick={handleSummaryClick} />
          </div>
        )}

        {summaryDisplayType === "placeholder" && (
          <div className={styles.summaryPlaceholder} />
        )}
      </div>

      <div className={styles.rightGroup}>
        {isKokyuhyo && <TantouButton />}

        <PollingToggleButton />
      </div>
    </nav>
  );
};

export default Navbar;
