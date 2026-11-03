// electron/ipc/index.ts

import { registerOperationIpc } from "./operationIpc";
import { registerServiceIpc } from "./serviceIpc";
import { registerSystemIpc } from "./systemIpc";

// 各機能のIPCハンドラーをまとめて登録する
export function registerIpcHandlers(): void {
  registerSystemIpc();
  registerServiceIpc();
  registerOperationIpc();
}
