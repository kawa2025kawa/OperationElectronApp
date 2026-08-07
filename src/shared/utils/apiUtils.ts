// src/shared/utils/apiUtils.ts
export const unwrapResult = <T>(result: T | { status: "ok"; data: T } | { status: "error"; error: unknown }, customFallbackMessage?: string): T => {
  if (result === null || result === undefined) {
    return result as T;
  }
  if (typeof result === "object" && "status" in result) {
    if (result.status === "ok") {
      return result.data as T;
    }
    const errorDetail = result.error;
    let message = customFallbackMessage || "API Error";
    if (typeof errorDetail === "string") {
      message = errorDetail;
    } else if (errorDetail && typeof errorDetail === "object" && "message" in errorDetail) {
      message = String((errorDetail as { message: unknown }).message);
    }
    throw new Error(message);
  }
  return result as T;
};