// src/renderer/features/operation/components/modal/scriptModal/ExecutionResultView.tsx

import { memo, useCallback } from "react";
import type {
  JobArtifact,
  JobResult,
} from "@shared/types/operation/operationTypes";
import { trpc } from "@renderer/lib/trpc";
import * as styles from "./scriptModalContent.css";

interface ExecutionResultViewProps {
  result: JobResult;
  highlightError: boolean;
}

export const ExecutionResultView = memo(function ExecutionResultView({
  result,
  highlightError,
}: ExecutionResultViewProps) {
  return (
    <div>
      <div
        className={highlightError ? styles.commentBoxError : styles.commentBox}
        style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
      >
        {result.message}
      </div>

      {result.artifacts && result.artifacts.length > 0 && (
        <ArtifactList artifacts={result.artifacts} />
      )}
    </div>
  );
});

ExecutionResultView.displayName = "ExecutionResultView";

interface ArtifactListProps {
  artifacts: JobArtifact[];
}

const ArtifactList = memo(function ArtifactList({
  artifacts,
}: ArtifactListProps) {
  if (artifacts.length === 0) return null;

  const handleOpenArtifact = useCallback(async (path: string) => {
    try {
      await trpc.system.openExternal.mutate({ urlOrPath: path });
    } catch (error) {
      console.error("Failed to open artifact:", error);
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "12px",
      }}
    >
      {artifacts.map((artifact, index) => {
        if (!artifact.path) return null;

        return (
          <button
            key={artifact.path || index}
            type="button"
            className={styles.linkCardButton}
            onClick={() => void handleOpenArtifact(artifact.path!)}
          >
            <span className={styles.linkLabel}>
              {artifact.name ?? "成果物"}:
            </span>
            <span className={styles.linkValue}>{artifact.path}</span>
          </button>
        );
      })}
    </div>
  );
});

ArtifactList.displayName = "ArtifactList";
