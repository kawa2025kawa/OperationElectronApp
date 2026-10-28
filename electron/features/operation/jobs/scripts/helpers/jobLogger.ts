//electron\features\operation\jobs\scripts\helpers\jobLogger.ts

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
    if (title) {
      this.lines.push(`▶ ${title}`);
    }
  }

  /**
   * 正常終了を記録する。
   */
  public complete(summary?: string): string {
    this.lines.push(
      `▶ [${format(new Date(), "MM/dd HH:mm:ss")}] 正常終了${summary ? ` : ${summary}` : ""}`,
    );

    return this.lines.join("\n");
  }

  /**
   * 対応が必要な業務結果を記録する。
   *
   * システムエラーではないため、例外は送出しない。
   */
  public needsAction(summary: string): string {
    this.lines.push(
      `▶ [${format(new Date(), "MM/dd HH:mm:ss")}] 要対応 : ${summary}`,
    );

    return this.lines.join("\n");
  }

  /**
   * システムエラーを記録し、例外を生成する。
   */
  public fail(errorMessage: string): Error {
    this.lines.push(
      `▶ [${format(new Date(), "MM/dd HH:mm:ss")}] 失敗 : ${errorMessage}`,
    );

    return new Error(`${errorMessage}\n\n${this.lines.join("\n")}`);
  }
}
