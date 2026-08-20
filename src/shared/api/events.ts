// src/shared/api/events.ts
// このファイルは src/shared/api/commands.ts に統合されたため、今後の機能追加は commands.ts に対して行ってください。
// 後方互換性または一時的なプレースホルダーとして残しています。

import { commands } from "@shared/api/commands";

export const events = {
  operationStatusUpdated: {
    // 互換性のためのラップ
    listen: commands.onOperationStatusUpdated
  },
};
