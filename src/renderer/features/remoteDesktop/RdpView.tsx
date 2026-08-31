// src/renderer/features/remoteDesktop/RdpView.tsx

import React, { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@renderer/store";
import { UnknownView } from "@renderer/layout/UnknownView";

import * as styles from "./rdpView.css";

export const RdpView: React.FC = () => {
  const { rdpTargets, fetchRdpTargets, isRdpLoading, runRdp } = useAppStore(
    useShallow((state: AppState) => ({
      rdpTargets: state.rdpTargets,
      fetchRdpTargets: state.fetchRdpTargets,
      isRdpLoading: state.isRdpLoading,
      runRdp: state.runRdp,
    })),
  );

  useEffect(() => {
    void fetchRdpTargets();
  }, [fetchRdpTargets]);

  if (isRdpLoading) {
    return null;
  }

  if (rdpTargets.length === 0) {
    return <UnknownView view="remoteDesktop (RDP Target Empty)" />;
  }

  return (
    <div className={styles.rdpContainer}>
      <div className={styles.grid}>
        {rdpTargets.map((target) => (
          <button
            key={target.id}
            className={styles.card}
            onClick={() => void runRdp(target.id)}
            type="button"
          >
            <span className={styles.cardTitle}>{target.name}</span>
            <span className={styles.cardHost}>{target.host}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

RdpView;
