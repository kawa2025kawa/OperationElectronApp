import type { OperationStatusEvent } from "@shared/types/statusType";

export const events = {
  operationStatusUpdatedEvent: {
    listen(callback: (event: { payload: OperationStatusEvent }) => void) {
      const remove = window.electronAPI.on(
        "operationStatusUpdated",
        (...args: unknown[]) => {
          callback({
            payload: args[0] as OperationStatusEvent,
          });
        },
      );

      return Promise.resolve(remove);
    },
  },
};
