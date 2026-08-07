// src/renderer/components/layout/navbar/Navbar.tsx

import React, { useCallback } from "react";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { TantouButton } from "@renderer/components/ui/button/tantouButton/TantouButton";
import { HamburgerButton } from "@renderer/components/ui/button/hamburgerButton/HamburgerButton";
import { SearchField } from "@renderer/components/ui/searchField/SearchField";
import { StatusSummary } from "@renderer/components/ui/statusSummary/StatusSummary";
import { PollingToggleButton } from "@renderer/components/ui/button/pollingToggleButton/PollingToggleButton";
import { useNavbarLogic } from "./useNavbarLogic";

import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";
import { TantouModalContent } from "@renderer/features/spreadSheet/components/modal/contents/tantou/TantouModalContent";

import * as styles from "./navbar.css";

export const Navbar: React.FC = () => {
  const {
    currentView,
    searchTerm,
    summary,
    isInitialLoaded,
    isPolling,
    navbarTitle,
    isOperation,
    isIrregular,
    isShowSummary,
    searchPlaceholder,
    searchWrapperStyle,
    getSummaryData,
    fetchTantouModalData,
    handlePollingClick,
    handleSearchChange,
    toggleSidebar,
    openGlobalModal,
    closeGlobalModal,
  } = useNavbarLogic();

  // JSXを組み立てて表示する処理を View 側に配置
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

  // JSXを組み立てて表示する処理を View 側に配置
  const handleTantouClick = useCallback(async () => {
    const { tantouData, tantouConfig } = await fetchTantouModalData();

    if (tantouData) {
      openGlobalModal(
        <TantouModalContent
          data={tantouData}
          title={getAppViewConfig(APP_VIEW_IDS.TANTOU).title}
          onClose={closeGlobalModal}
        />,
        {
          width: tantouConfig?.modalSize.width ?? "800px",
          height: tantouConfig?.modalSize.height ?? "600px",
        },
      );
    }
  }, [fetchTantouModalData, openGlobalModal, closeGlobalModal]);

  return (
    <nav className={styles.container}>
      <HamburgerButton onClick={toggleSidebar} />

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
        {currentView === APP_VIEW_IDS.KOKYUHYO && (
          <TantouButton onClick={handleTantouClick} />
        )}

        <PollingToggleButton active={isPolling} onClick={handlePollingClick} />
      </div>
    </nav>
  );
};

export default Navbar;
