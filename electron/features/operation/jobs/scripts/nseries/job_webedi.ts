// electron/features/operation/jobs/scripts/nseries/job_webedi.ts

import { rdpCommands } from "@renderer/services/commands";

export async function runJobWebEdiDb(): Promise<string> {
  await rdpCommands.startRdpSession("WEBEDI_DB");
  return "WEBEDI_DB へのRDP接続を開始しました";
}

export async function runJobWebEdi(): Promise<string> {
  await rdpCommands.startRdpSession("WEBEDI");
  return "WEBEDI へのRDP接続を開始しました";
}
