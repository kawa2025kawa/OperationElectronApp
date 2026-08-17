//src\renderer\features\operation\components\modal\scriptModal\ScriptModalContent.tsx

import React, { useEffect } from "react";
import { getStatusLabel } from "@shared/types/uiType";
import { formatToJapaneseDateTime } from "@shared/utils/dateUtils";
import { InfoField } from "../shared/InfoField";
import type { ModalContentProps } from "../useOperationModalLogic";
import * as styles from "./scriptModalContent.css";
import { useScriptModalLogic } from "./useScriptModalLogic";

export const ScriptModalContent: React.FC<ModalContentProps> = React.memo(
  ({ setTitle, registerPrimaryAction }) => {
    const { item, handleExecute } = useScriptModalLogic();
    // プライマリアクションの登録
    useEffect(() => {
      registerPrimaryAction(() => {
        void handleExecute();
      });
      return () => {
        registerPrimaryAction(undefined);
      };
    }, [handleExecute, registerPrimaryAction]);

    // モーダルのタイトル（ヘッダーメッセージ）を更新
    useEffect(() => {
      setTitle(item?.workName ?? "");
    }, [item?.workName, setTitle]);

    return (
      <div className={styles.container}>
        {/* メッセージ表示をヘッダーへ移動したため削除 */}

        <div className={styles.gridBox}>
          <InfoField label="管理No" value={item?.kanriNo} span={6} />
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
