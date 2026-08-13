// src/renderer/features/operation/components/modal/contents/manualModal/ManualModalContent.tsx

import React, { useEffect, useMemo } from "react";

interface ManualModalContentProps {
  kanriNo: string;
  setFooterConfig: (config: {
    primaryText?: string;
    primaryDisabled?: boolean;
    onPrimary?: () => void | Promise<void>;
    hidePrimary?: boolean;
  }) => void;
}

const MANUAL_BASE_URL = "https://sites.google.com/belc.co.jp/operation-manual-";

export const ManualModalContent: React.FC<ManualModalContentProps> = ({
  kanriNo,
  setFooterConfig,
}) => {
  const manualUrl = useMemo(() => {
    if (!kanriNo) {
      return "";
    }

    return `${MANUAL_BASE_URL}${encodeURIComponent(kanriNo)}`;
  }, [kanriNo]);

  const hasManual = Boolean(manualUrl);

  useEffect(() => {
    setFooterConfig({
      primaryText: "開く",
      primaryDisabled: !hasManual,
      onPrimary: hasManual
        ? () => {
            window.open(manualUrl, "_blank", "noopener,noreferrer");
          }
        : undefined,
    });

    return () => {
      setFooterConfig({});
    };
  }, [manualUrl, hasManual, setFooterConfig]);

  return (
    <div style={{ padding: "1rem" }}>
      <h3>マニュアル</h3>

      {hasManual ? (
        <>
          <p>以下のマニュアルを開きます。</p>
          <p>{manualUrl}</p>
        </>
      ) : (
        <p>マニュアルが設定されていません</p>
      )}
    </div>
  );
};

ManualModalContent.displayName = "ManualModalContent";
