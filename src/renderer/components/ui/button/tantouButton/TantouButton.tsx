//src\renderer\components\ui\button\tantouButton\TantouButton.tsx

import { memo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import { selectTantouMasters } from "@renderer/features/spreadSheet/store/spreadsheetSelectors";
import { TantouModalContent } from "@renderer/features/spreadSheet/tantou/modal/TantouModalContent";

import * as styles from "./tantouButton.css";

export const TantouButton = memo(() => {
  const { tantouData, openGlobalModal } = useAppStore(
    useShallow((state) => ({
      tantouData: selectTantouMasters(state),
      openGlobalModal: state.openGlobalModal,
    })),
  );

  const handleClick = useCallback(() => {
    const firstRow = tantouData[0];

    if (!firstRow) return;

    openGlobalModal(() => <TantouModalContent data={firstRow} />, {
      title: "担当表",
    });
  }, [tantouData, openGlobalModal]);

  const isDisabled = tantouData.length === 0;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={isDisabled}
      title="当日の担当者一覧を表示"
    >
      担当表
    </button>
  );
});
