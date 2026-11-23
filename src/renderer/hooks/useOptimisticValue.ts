// src/renderer/hooks/useOptimisticValue.ts

import { useCallback, useState } from "react";

interface OptimisticState<T> {
  source: T;
  value: T;
}

/**
- 外部（ストア等）の値の更新に追従しつつ、操作直後の楽観的UI値を保持する共通フック
 */
export function useOptimisticValue<T>(externalValue: T) {
  const [state, setState] = useState<OptimisticState<T>>(() => ({
    source: externalValue,
    value: externalValue,
  }));

  if (!Object.is(state.source, externalValue)) {
    setState({
      source: externalValue,
      value: externalValue,
    });
  }

  const setOptimisticValue = useCallback(
    (nextValue: T) => {
      setState({
        source: externalValue,
        value: nextValue,
      });
    },
    [externalValue],
  );

  return [state.value, setOptimisticValue] as const;
}