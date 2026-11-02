// src/renderer/features/remoteDesktop/RdpView.tsx

import { useEffect } from "react";

import { UnknownView } from "@renderer/layout/UnknownView";

import { useRdp } from "./useRdp";
import * as styles from "./rdpView.css";

export const RdpView = () => {
  const { rdpTargets, isRdpLoading, fetchRdpTargets, runRdp } = useRdp();

  useEffect(() => {
    void fetchRdpTargets();
  }, [fetchRdpTargets]);

  if (isRdpLoading) {
    return null;
  }

  if (!rdpTargets.length) {
    return <UnknownView view="remoteDesktop (RDP Target Empty)" />;
  }

  return (
    <div className={styles.rdpContainer}>
      <div className={styles.grid}>
        {rdpTargets.map(({ name, ipAddress }) => (
          <button
            key={name}
            className={styles.card}
            onClick={() => void runRdp(name)}
            type="button"
          >
            <span className={styles.cardTitle}>{name}</span>
            <span className={styles.cardHost}>{ipAddress}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
