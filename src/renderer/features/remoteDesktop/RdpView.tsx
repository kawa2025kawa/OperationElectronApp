// src/renderer/features/remoteDesktop/RdpView.tsx

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UnknownView } from "@renderer/layout/MainView";
import { rdpIpcService } from "@renderer/services/ipcServices";
import { toErrorMessage } from "@renderer/utils/rendererUtils";
import type { RdpTarget } from "@shared/types/electron/ipcTypes";
import * as styles from "./rdpView.css";

const RDP_LAUNCH_COOLDOWN_MS = 1500;

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
  const [rdpTargets, setRdpTargets] = useState<readonly RdpTarget[]>([]);
  const [isRdpLoading, setIsRdpLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const launchingNamesRef = useRef(new Set<string>());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchRdpTargets = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRdpLoading(true);

    try {
      const targets = await rdpIpcService.getMasters();
      if (isMountedRef.current) {
        setRdpTargets(targets);
      }
    } catch (error: unknown) {
      if (isMountedRef.current) {
        toast.error(`RDP取得エラー: ${toErrorMessage(error)}`);
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setIsRdpLoading(false);
      }
    }
  }, []);

  const runRdp = useCallback(async (name: string) => {
    const normalized = name.trim();
    if (!normalized || launchingNamesRef.current.has(normalized)) {
      return;
    }

    launchingNamesRef.current.add(normalized);
    try {
      await rdpIpcService.startSession(normalized);
    } catch (error: unknown) {
      toast.error(`RDP起動エラー: ${toErrorMessage(error)}`);
    } finally {
      window.setTimeout(() => {
        launchingNamesRef.current.delete(normalized);
      }, RDP_LAUNCH_COOLDOWN_MS);
    }
  }, []);

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