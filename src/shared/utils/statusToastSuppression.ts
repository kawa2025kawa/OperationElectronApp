// src/shared/utils/statusToastSuppression.ts

const suppressedSuccesses = new Set<string>();

const SUPPRESSION_TTL = 5_000;

export const suppressNextSuccessToast = (kanriNo: string): void => {
  suppressedSuccesses.add(kanriNo);

  window.setTimeout(() => {
    suppressedSuccesses.delete(kanriNo);
  }, SUPPRESSION_TTL);
};

export const consumeSuppressedSuccessToast = (kanriNo: string): boolean => {
  if (!suppressedSuccesses.has(kanriNo)) {
    return false;
  }

  suppressedSuccesses.delete(kanriNo);
  return true;
};
