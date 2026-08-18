import { ipcMain } from "electron";
import {
  setJob30Params,
  type Job30Params,
} from "../operation/jobs/scripts/job_30";

export function registerTempomaticIpc(): void {
  ipcMain.handle(
    "tempomaticUploadDocument",
    async (_event, args: Job30Params) => {
      setJob30Params({
        filePaths: args?.filePaths ?? [],
        expireDate: args?.expireDate ?? "",
      });
      return true;
    },
  );
}
