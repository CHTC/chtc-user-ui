import { apiFetch } from "@/src/components/AuthProvider";
import type { Project } from "@/types";
import useSWR from "swr";

/** SWR key for a project's record. Shared so every caller hits the same cache entry. */
export const projectKey = (projectId: number) => [`/projects/${projectId}`];

const projectFetcher = async (projectId: number): Promise<Project> => {
  const response = await apiFetch(`/projects/${projectId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project with id ${projectId}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetches a single project. Callers on the same page share one request through SWR's
 * cache, so a view and the form inside it can both call this without refetching.
 * Passing a null id skips the fetch.
 */
export function useProject(projectId: number | null) {
  return useSWR(projectId ? projectKey(projectId) : null, () => projectFetcher(projectId as number), {
    suspense: true,
  });
}
