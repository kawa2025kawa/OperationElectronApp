// src/shared/store/slices/services/fileDialogService.ts

import { commands } from "@shared/api/commands";

export interface OpenFileDialogParams {
  multiple?: boolean;
  acceptExtensions?: string[];
}

export const fileDialogService = {
  async openFileDialog(params: OpenFileDialogParams = {}): Promise<string[]> {
    const { multiple = true, acceptExtensions = ["pdf"] } = params;

    const selected = await commands.showOpenDialog({
      properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
      filters: [
        {
          name: "Files",
          extensions: acceptExtensions,
        },
      ],
    });

    return selected ?? [];
  },
};
