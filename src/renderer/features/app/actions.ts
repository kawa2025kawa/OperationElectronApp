// src/renderer/features/app/actions.ts

import { appService } from "@shared/store/slices/services/appService";

export const initializeAppAction = async (): Promise<void> => {
  await appService.initializeApp();
};
