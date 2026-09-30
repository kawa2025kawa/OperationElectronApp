// src\renderer\features\remoteDesktop\RdpView.tsx

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import { UnknownView } from "@renderer/layout/UnknownView";
import * as styles from "./rdpView.css";

export const RdpView = () => {
  const { rdpTargets, fetchRdpTargets, isRdpLoading, runRdp } = useAppStore(
    useShallow((state) => ({
      rdpTargets: state.rdpTargets,
      fetchRdpTargets: state.fetchRdpTargets,
      isRdpLoading: state.isRdpLoading,
      runRdp: state.runRdp,
    })),
  );

  useEffect(() => {
    void fetchRdpTargets();
  }, [fetchRdpTargets]);

  if (isRdpLoading) return null;
  if (rdpTargets.length === 0)
    return <UnknownView view="remoteDesktop (RDP Target Empty)" />;

  return (
    <div className={styles.rdpContainer}>
      <div className={styles.grid}>
        {rdpTargets.map((target) => (
          <button
            key={target.name}
            className={styles.card}
            onClick={() => void runRdp(target.name)}
            type="button"
          >
            <span className={styles.cardTitle}>{target.name}</span>
            <span className={styles.cardHost}>{target.ipAddress}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
