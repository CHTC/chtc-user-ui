import { apiFetch } from "@/src/components/AuthProvider";
import useSWR, { KeyedMutator } from "swr";

/**
 * Generic hook for fetching table data with SWR
 */
export function useTableFetch<T>(url: string | null): {
  data: T | undefined;
  mutate: KeyedMutator<T>;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, mutate, isLoading, error } = useSWR<T>(
    url,
    async (): Promise<T> => {
      const response = await apiFetch(url!);
      return response.json();
    },
    { suspense: true },
  );

  return { data, mutate, isLoading, error };
}
