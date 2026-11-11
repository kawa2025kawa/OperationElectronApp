// src/renderer/features/remoteDesktop/RdpView.tsx

import { memo, useCallback, useEffect } from "react";

import { UnknownView } from "@renderer/layout/UnknownView";

import { useRdp } from "./useRdp";
import * as styles from "./rdpView.css";

interface RdpCardProps {
  readonly name: string;
  readonly ipAddress: string;
  readonly onRun: (name: string) => void;
}

const RdpCard = memo(function RdpCard({
  name,
  ipAddress,
  onRun,
}: RdpCardProps) {
  const handleClick = useCallback(() => {
    onRun(name);
  }, [name, onRun]);

  return (
    <button className={styles.card} onClick={handleClick} type="button">
      <span className={styles.cardTitle}>{name}</span>
      <span className={styles.cardHost}>{ipAddress}</span>
    </button>
  );
});

export const RdpView = memo(function RdpView() {
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
          <RdpCard
            key={name}
            name={name}
            ipAddress={ipAddress}
            onRun={runRdp}
          />
        ))}
      </div>
    </div>
  );
});

RdpView.displayName = "RdpView";
