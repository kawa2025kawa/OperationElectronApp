// src/renderer/layout/UnknownView.tsx

import React from "react";

type Props = {
  view: string;
};

export const UnknownView: React.FC<Props> = ({ view }) => {
  return (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h2>⚠️ SYSTEM ERROR: Unknown View</h2>
      <p>
        レジストリに登録されていない、または指定された画面 ID（{view}
        ）の実体コンポーネントをバインドできませんでした。
      </p>
      <span>
        src/shared/registry/appRegistry.ts および src/renderer/main.tsx
        の結合定義を確認してください。
      </span>
    </div>
  );
};
