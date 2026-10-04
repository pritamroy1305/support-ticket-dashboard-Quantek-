import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
}

/**
 * Runs `fetcher` whenever `deps` change (or `reload()` is called).
 * Stale responses are cancelled with AbortController so fast typing can't show out-of-order results.
 */
export function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetcher(controller.signal)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err : new ApiError("Unexpected error", 0));
        setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  return { data, loading, error, reload };
}
