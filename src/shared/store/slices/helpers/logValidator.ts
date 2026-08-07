// src/shared/store/slices/helpers/logValidator.ts
export interface LogValidationConfig {
  keyword: string;
  min: number;
  max: number;
}

export interface LogValidationResult {
  isValid: boolean;
  extractedValue: number | null;
  message: string;
}

export function validateLogValue(
  logText: string,
  config: LogValidationConfig,
): LogValidationResult {
  const { keyword, min, max } = config;
  const match = logText.match(new RegExp(`${keyword}\\s*([0-9,]+)`, "i"));

  if (!match || !match[1]) {
    return {
      isValid: false,
      extractedValue: null,
      message: `対象文字列 (${keyword}) が見つかりません。`,
    };
  }

  const value = Number.parseInt(match[1].replace(/,/g, ""), 10);
  if (Number.isNaN(value)) {
    return {
      isValid: false,
      extractedValue: null,
      message: `抽出した値 (${match[1]}) が数値として不正です。`,
    };
  }

  if (value < min || value > max) {
    return {
      isValid: false,
      extractedValue: value,
      message: `値異常 (${value.toLocaleString()}) 期待範囲: ${min.toLocaleString()} 〜 ${max.toLocaleString()}`,
    };
  }

  return { isValid: true, extractedValue: value, message: `正常 (値: ${value.toLocaleString()})` };
}

export const validateJob114Log = (logText: string): LogValidationResult =>
  validateLogValue(logText, { keyword: "READ=", min: 500_000, max: 1_400_000 });
