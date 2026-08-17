//src\renderer\features\operation\components\modal\jcModal\JcModalContent.tsx

import React, { useEffect } from "react";
import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { InfoField } from "../shared/InfoField";
import type { ModalContentProps } from "../useOperationModalLogic";
import * as styles from "./jcModalContent.css";
import { useJcModalLogic } from "./useJcModalLogic";

export const JcModalContent: React.FC<ModalContentProps> = React.memo(
  ({ setTitle, registerPrimaryAction }) => {
    const { item, isExecuting, isSuccess, handleExecute } = useJcModalLogic();

    // ユニオン型(IrregularDataItem)対策: 安全に jobId を抽出
    const jobId = item && "jobId" in item ? item.jobId : undefined;

    // プライマリアクションの登録
    useEffect(() => {
      registerPrimaryAction(() => {
        void handleExecute();
      });

      return () => {
        registerPrimaryAction(undefined);
      };
    }, [handleExecute, registerPrimaryAction]);

    // モーダルのタイトル（ヘッダーメッセージ）を状態に合わせて更新
    useEffect(() => {
      if (isExecuting) {
        setTitle("処理を実行中...");
      } else if (isSuccess) {
        setTitle("処理が完了しました");
      } else {
        setTitle(jobId ?? "");
      }
    }, [isExecuting, isSuccess, jobId, setTitle]);

    return (
      <div className={styles.container}>
        {/* メッセージ表示をヘッダーへ移動したため削除 */}

        <div className={styles.gridBox}>
          <InfoField label="管理No" value={item?.kanriNo} span={3} />
          <InfoField label="ジョブ名" value={item?.workName} span={3} />
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
