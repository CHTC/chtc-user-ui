import { fetchJson, ForbiddenError } from "@/src/utils/fetchList";
import type { Group } from "@/types";
import useSWR from "swr";

/**
 * Every component that reads one group uses this key with fetchGroup. SWR shares a cache entry
 * per key, so a second fetcher for the same key would hand its differently shaped data to the
 * others depending on which page loaded first.
 */
export const groupKey = (id: number) => [`/groups/${id}`];

/** The group, or "forbidden" when the viewer may not read it, so pages can say so instead of throwing */
export const fetchGroup = async (id: number): Promise<Group | "forbidden"> => {
  try {
    return await fetchJson<Group>(`/groups/${id}`);
  } catch (e) {
    if (e instanceof ForbiddenError) return "forbidden";
    throw e;
  }
};

/** A group for a picker or a note: undefined while loading, when the viewer may not read it, or on failure */
export function useReadableGroup(id: number | null): Group | undefined {
  const { data } = useSWR(id ? groupKey(id) : null, () => fetchGroup(id!), { shouldRetryOnError: false });
  return data && data !== "forbidden" ? data : undefined;
}
