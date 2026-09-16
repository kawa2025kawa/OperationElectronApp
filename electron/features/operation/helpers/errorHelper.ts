// electron/features/operation/helpers/errorHelper.ts

export function cleanErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
      .replace(/^Error invoking remote method '[^']+':\s*/, "")
      .replace(/^Error:\s*/, "")
      .trim();
  }
  return String(error)
    .replace(/^Error invoking remote method '[^']+':\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
}
