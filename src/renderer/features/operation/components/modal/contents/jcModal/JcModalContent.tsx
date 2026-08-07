// src/renderer/features/operation/components/modal/contents/jcModal/JcModalContent.tsx
import React, { useEffect } from "react";
import { ErrorState } from "@renderer/components/ui/state/StateContainer";
import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { useJcModalLogic } from "./useJcModalLogic";
import type { ModalContentProps } from "../../OperationModal";
import { InfoField } from "../../shared/InfoField";
import * as styles from "./jcModalContent.css";

export const JcModalContent: React.FC<ModalContentProps> = React.memo(
  ({ onClose, setFooterConfig }) => {
    const {
      item,
      isExecuting,
      isError,
      isSuccess,
      handleExecute,
      handleRetry,
    } = useJcModalLogic();

    useEffect(() => {
      setFooterConfig({
        primaryText: isSuccess ? "OK" : "実行",
        onPrimary: isSuccess ? onClose : handleExecute,
        hidePrimary: false,
        primaryDisabled: isExecuting,
      });
    }, [isSuccess, isExecuting, onClose, handleExecute, setFooterConfig]);

    if (isError) {
      return (
        <ErrorState
          errorMessage={item?.comment || "エラーが発生しました"}
          onClickRetry={handleRetry}
        />
      );
    }

    return (
      <div className={styles.container}>
        <p className={styles.mainMessage}>
          {isSuccess
            ? "完了しました"
            : `実行しますか？ JobID: ${item?.jobId ?? ""}`}
        </p>
        <div className={styles.gridBox}>
          <InfoField label="管理No" value={item?.kanriNo} span={2} />
          <InfoField label="Job ID" value={item?.jobId} span={2} />
          <InfoField label="ジョブ名" value={item?.workName} span={2} />
          <InfoField
            label="開始日時"
            value={formatToJapaneseDateTime(item?.startTime)}
            span={3}
          />
          <InfoField
            label="終了日時"
            value={formatToJapaneseDateTime(item?.endTime)}
            span={3}
          />
          <InfoField
            label="ステータス"
            value={getStatusLabel(item?.status)}
            span={6}
          />
          <InfoField
            label="コメント"
            value={item?.comment}
            span={6}
            isComment
          />
        </div>
      </div>
    );
  },
);

JcModalContent.displayName = "JcModalContent";
export default JcModalContent;
