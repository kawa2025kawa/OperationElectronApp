// src/renderer/hooks/useAutoUpdate.ts

import { checkAndApplyUpdate } from "@renderer/services/updateService";

export const useAutoUpdate = () => {
  return {
    checkForUpdates: checkAndApplyUpdate,
  };
};
