// src/renderer/components/layout/navbar/Navbar.tsx

import React, { useCallback } from "react";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { TantouButton } from "@renderer/components/ui/button/tantouButton/TantouButton";
import { HamburgerButton } from "@renderer/components/ui/button/hamburgerButton/HamburgerButton";
import { SearchField } from "@renderer/components/ui/searchField/SearchField";
import { StatusSummary } from "@renderer/components/ui/statusSummary/StatusSummary";
import { PollingToggleButton } from "@renderer/components/ui/button/pollingToggleButton/PollingToggleButton";
import { useNavbarLogic } from "./useNavbarLogic";

import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";
import * as styles from "./navbar.css";

export const Navbar: React.FC = () => {
  const {
    currentView,
    searchTerm,
    summary,
    isInitialLoaded,
    navbarTitle,
    isOperation,
    isIrregular,
    isShowSummary,
    searchPlaceholder,
    searchWrapperStyle,
    getSummaryData,
    handleSearchChange,
    openGlobalModal,
    closeGlobalModal,
  } = useNavbarLogic();

  const handleSummaryClick = useCallback(
    (label: string) => {
      const data = getSummaryData(label);
      if (!data) return;

      openGlobalModal(
        <OperationModal
          type="summary"
          items={data.items}
          onClose={closeGlobalModal}
        />,
        {
          title: data.title,
          width: "min(80vw, 850px)",
          height: "min(75vh, 600px)",
        },
      );
    },
    [getSummaryData, openGlobalModal, closeGlobalModal],
  );

  return (
    <nav className={styles.container}>
      {/* 🎯 Props不要（Smart Component化） */}
      <HamburgerButton />

      <div className={styles.logoText}>{navbarTitle}</div>

      <div className={styles.centerItem}>
        {isOperation && (
          <>
            {isShowSummary && isInitialLoaded ? (
              <div className={styles.centerSummaryWrapper}>
                <StatusSummary
                  data={summary}
                  onItemClick={handleSummaryClick}
                />
              </div>
            ) : isIrregular ? null : (
              <div
                className={styles.centerSummaryWrapper}
                style={{ height: "48px" }}
              />
            )}
          </>
        )}

        {searchPlaceholder && (
          <div
            className={styles.centerSearchWrapper}
            style={searchWrapperStyle}
          >
            <SearchField
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
      </div>

      <div className={styles.rightGroup}>
        {/* 🎯 Props不要（Smart Component化） */}
        {currentView === APP_VIEW_IDS.KOKYUHYO && <TantouButton />}

        {/* 🎯 Props不要（Smart Component化） */}
        <PollingToggleButton />
      </div>
    </nav>
  );
};

export default Navbar;
