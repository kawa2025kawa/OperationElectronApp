//src\renderer\features\remoteDesktop\RdpView.tsx

import React, { useEffect } from "react";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, type AppState } from "@shared/store";
import { animateFadeIn } from "@renderer/styles/tokens";

import * as styles from "./rdpView.css";

export const RdpView: React.FC = () => {
  const { rdpTargets, fetchRdpTargets, runRdp, isRdpLoading } = useAppStore(
    useShallow((state: AppState) => ({
      rdpTargets: state.rdpTargets,
      fetchRdpTargets: state.fetchRdpTargets,
      runRdp: state.runRdp,
      isRdpLoading: state.isRdpLoading,
    })),
  );

  useEffect(() => {
    void fetchRdpTargets();
  }, [fetchRdpTargets]);

  if (isRdpLoading) {
    return (
      <div className={clsx(styles.rdpContainer, animateFadeIn)}>
        <p className={styles.messageText}>RDP ターゲット情報を読み込み中...</p>
      </div>
    );
  }

  if (rdpTargets.length === 0) {
    return (
      <div className={clsx(styles.rdpContainer, animateFadeIn)}>
        <p className={styles.messageText}>
          利用可能な RDP ターゲットが登録されていません。
        </p>

        <p className={styles.captionText}>
          システム管理者にお問い合わせいただくか、設定を確認してください。
        </p>
      </div>
    );
  }

  return (
    <div className={clsx(styles.rdpContainer, animateFadeIn)}>
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

export default RdpView;
