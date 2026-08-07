// src/renderer/features/operation/components/modal/contents/scriptModal/ScriptModalContent.tsx

import React, { useEffect } from "react";
import { DropArea } from "@renderer/components/ui/dropArea/DropArea";
import { ErrorState } from "@renderer/components/ui/state/StateContainer";
import { LoadingContent } from "@renderer/components/ui/overlay/Overlay";
import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { useScriptModalLogic } from "./useScriptModalLogic";
import type { ModalContentProps } from "../../OperationModal";
import { InfoField } from "../../shared/InfoField";
import * as styles from "./scriptModalContent.css";

export const ScriptModalContent: React.FC<ModalContentProps> = React.memo(
  ({ setFooterConfig }) => {
    const {
      item,
      csvFiles,
      setCsvFiles,
      requiresFile,
      isPrimaryDisabled,
      isExecuting,
      isError,
      handleExecute,
      handleRetry,
    } = useScriptModalLogic();

    useEffect(() => {
      setFooterConfig({
        primaryText: "実行",
        primaryDisabled: isPrimaryDisabled || isExecuting,
        onPrimary: handleExecute,
        hidePrimary: isExecuting,
      });
    }, [isPrimaryDisabled, isExecuting, handleExecute, setFooterConfig]);

    if (isExecuting) {
      return (
        <div className={styles.container}>
          <LoadingContent
            message="スクリプトを実行中です..."
            statusMessage="RUNNING SCRIPT"
          />
        </div>
      );
    }

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
        <p className={styles.mainMessage}>{`対象: ${item?.workName ?? ""}`}</p>

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

        {requiresFile && (
          <div className={styles.dropAreaContainer}>
            <DropArea
              files={csvFiles}
              onDrop={setCsvFiles}
              placeholder="CSVファイルをドロップ"
              multiple
            />
          </div>
        )}
      </div>
    );
  },
);

ScriptModalContent.displayName = "ScriptModalContent";

export default ScriptModalContent;
