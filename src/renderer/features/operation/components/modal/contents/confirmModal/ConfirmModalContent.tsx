import React, { useEffect } from "react";

interface ConfirmModalContentProps {
  value: string;
  label: string;

  setFooterConfig: (config: {
    primaryText?: string;
    primaryDisabled?: boolean;
    onPrimary?: () => void | Promise<void>;
    hidePrimary?: boolean;
  }) => void;
}

export const ConfirmModalContent: React.FC<ConfirmModalContentProps> = ({
  value,
  label,
  setFooterConfig,
}) => {
  useEffect(() => {
    setFooterConfig({
      primaryText: "開く",
      onPrimary: () => {
        if (value) {
          window.open(value, "_blank");
        }
      },
    });

    return () => {
      setFooterConfig({});
    };
  }, [value, setFooterConfig]);

  return (
    <div style={{ padding: "1rem" }}>
      <h3>{label}</h3>
      <p>{value || `${label}が設定されていません`}</p>
    </div>
  );
};
