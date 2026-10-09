// electron/ipc/ipcHandlerRegistry.ts

export function registerIpcHandlers(): void {
  // すべての invoke / handle 処理は electron-trpc 経由へ移行完了
  console.log("[IPC] Handlers registered via tRPC.");
}
