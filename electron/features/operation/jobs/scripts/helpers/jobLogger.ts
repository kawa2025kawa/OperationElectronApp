// electron/features/operation/jobs/scripts/helpers/jobLogger.ts

import { format } from "date-fns";

export class JobLogger {
  private readonly lines: string[] = [];

  constructor() {
    this.lines.push(`▶ [${format(new Date(), "MM/dd HH:mm:ss")}] 開始`);
  }

  public log(message = ""): void {
    this.lines.push(`▶ ${message}`);
  }

  public section(title?: string): void {
    if (title) this.lines.push(`▶ ${title}`);
  }

  public complete(summary?: string): string {
    this.lines.push(
      `▶ [${format(new Date(), "MM/dd HH:mm:ss")}] 正常終了${summary ? ` : ${summary}` : ""}`,
    );

    return this.lines.join("\n");
  }

  public fail(errorMessage: string): Error {
    this.lines.push(
      `▶ [${format(new Date(), "MM/dd HH:mm:ss")}] 失敗 : ${errorMessage}`,
    );

    return new Error(`${errorMessage}\n\n${this.lines.join("\n")}`);
  }
}
