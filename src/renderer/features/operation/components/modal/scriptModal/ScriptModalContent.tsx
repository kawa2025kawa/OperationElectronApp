import React from "react";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useScriptModalContent } from "./useScriptModalContent";
import { useOperationModalContext } from "../OperationModalContext";
import * as styles from "./scriptModalContent.css";

export const ScriptModalContent: React.FC = React.memo(() => {
  const { registerPrimaryAction } = useOperationModalContext();
  const {
    selectedFiles,
    isCompleted,
    isDropZoneVisible,
    executionResult,
    handleFileSelect,
    handleRemoveFile,
  } = useScriptModalContent({ registerPrimaryAction });

  const isErrorResult = executionResult?.includes("【相違あり】") ?? false;

  const messageText = isCompleted
    ? isErrorResult
      ? "相違が発生しました"
      : "処理が完了しました"
    : isDropZoneVisible
      ? "実行対象のファイルを選択またはドロップしてください"
      : "「実行」ボタンを押して処理を開始してください";

  return (
    <div className={styles.contentFlexContainer}>
      {/* 上部：メッセージ枠 */}
      <div className={styles.messageContainer}>
        <p className={styles.mainMessage}>{messageText}</p>
      </div>

      {/* 下部：コメント/ドロップゾーン枠 */}
      <div className={styles.bottomArea}>
        {isCompleted && executionResult ? (
          <div
            className={
              isErrorResult ? styles.commentBoxError : styles.commentBox
            }
          >
            {executionResult}
          </div>
        ) : (
          isDropZoneVisible && (
            <FileDropZone
              files={selectedFiles}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              accept=".xlsx,.csv"
            />
          )
        )}
      </div>
    </div>
  );
});

ScriptModalContent.displayName = "ScriptModalContent";

export default ScriptModalContent;
