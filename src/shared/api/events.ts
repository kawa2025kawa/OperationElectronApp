// src/shared/api/events.ts

import type { OperationItem } from "@shared/types/operationType";

export const events = {
  operationStatusUpdated: {
    listen(
      callback: (event: { payload: { status: OperationItem } }) => void,
    ): () => void {
      const remove = window.electronAPI.on(
        "operationStatusUpdated",
        (...args: unknown[]) => {
          callback({
            payload: {
              status: args[0] as OperationItem,
            },
          });
        },
      );

      return remove;
    },
  },
};
