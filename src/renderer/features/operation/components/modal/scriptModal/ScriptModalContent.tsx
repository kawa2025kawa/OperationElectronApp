import React, { useEffect } from "react";

import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";

import type { ModalContentProps } from "../useOperationModalLogic";
import { InfoField } from "../shared/InfoField";

import { useScriptModalLogic } from "./useScriptModalLogic";
import * as styles from "./scriptModalContent.css";

export const ScriptModalContent: React.FC<ModalContentProps> = React.memo(
  ({ registerPrimaryAction }) => {
    const { item, handleExecute } = useScriptModalLogic();

    useEffect(() => {
      registerPrimaryAction(() => {
        void handleExecute();
      });
      return () => {
        registerPrimaryAction(undefined);
      };
    }, [handleExecute, registerPrimaryAction]);

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
      </div>
    );
  },
);

ScriptModalContent.displayName = "ScriptModalContent";

export default ScriptModalContent;
