// electron/features/operation/jobs/scripts/helpers/logFormatHelper.ts

interface AlignedColumnSpec<TRow> {
  readonly getValue: (row: TRow) => string;
  readonly align?: "left" | "right";
  readonly prefix?: string;
  readonly suffix?: string;
}

/**
- 等幅フォント環境向けに文字列の表示幅（ASCII=1, 全角=2）を計算する。
 */
function getDisplayWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    width += code <= 0xff ? 1 : 2;
  }
  return width;
}

/**
- 全角・半角を考慮して末尾に半角スペースを補完する。
 */
function padEndDisplayWidth(text: string, targetWidth: number): string {
  const diff = targetWidth - getDisplayWidth(text);
  return diff > 0 ? text + " ".repeat(diff) : text;
}

/**
- 全角・半角を考慮して先頭に半角スペースを補完する。
 */
function padStartDisplayWidth(text: string, targetWidth: number): string {
  const diff = targetWidth - getDisplayWidth(text);
  return diff > 0 ? " ".repeat(diff) + text : text;
}

/**
- 複数行のデータを全角・半角幅を考慮して列ごとに縦揃え整形する。
 */
export function formatAlignedColumns<TRow>(
  rows: readonly TRow[],
  columns: readonly AlignedColumnSpec<TRow>[],
  separator = " | ",
): string[] {
  if (rows.length === 0 || columns.length === 0) {
    return [];
  }

  const matrix = rows.map((row) => columns.map((col) => col.getValue(row)));
  const maxWidths = columns.map((_, colIdx) =>
    Math.max(...matrix.map((cells) => getDisplayWidth(cells[colIdx] ?? "")), 0),
  );

  return matrix.map((cells) =>
    columns
      .map((col, colIdx) => {
        const raw = cells[colIdx] ?? "";
        const width = maxWidths[colIdx] ?? 0;
        const padded =
          col.align === "right"
            ? padStartDisplayWidth(raw, width)
            : padEndDisplayWidth(raw, width);
        return `${col.prefix ?? ""}${padded}${col.suffix ?? ""}`;
      })
      .join(separator),
  );
}

/**
- "002:002東町店" の重複した店舗番号を整理し、"002 東町店" 形式の表示ラベルにする。
 */
export function formatStoreDisplayLabel(
  rawCell: string,
  normalizedCode: string,
): string {
  const paddedCode = normalizedCode.padStart(3, "0");
  const parts = rawCell.split(":");
  if (parts.length < 2) {
    return `${paddedCode} ${rawCell}`;
  }

  const rawName = parts.slice(1).join(":").trim();
  const strippedName = rawName.replace(
    new RegExp(`^0*${normalizedCode}\\s*`),
    "",
  );
  return strippedName ? `${paddedCode} ${strippedName}` : paddedCode;
}
