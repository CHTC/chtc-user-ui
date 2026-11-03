import { apiFetch } from "@/src/components/AuthProvider";
import type { ApiError } from "@/src/utils/formErrors";

/** Thrown for a 403 so pages can show "You do not have access" instead of a generic failure */
export class ForbiddenError extends Error {}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await apiFetch(url);
  if (response.status === 403) throw new ForbiddenError("Forbidden");
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  return response.json();
}

/** A list endpoint's rows plus the unpaginated total from the X-Total-Count header */
export async function fetchList<T>(url: string): Promise<{ rows: T[]; total: number }> {
  const response = await apiFetch(url);
  if (response.status === 403) throw new ForbiddenError("Forbidden");
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const rows: T[] = await response.json();
  const header = Number(response.headers.get("X-Total-Count"));
  return { rows, total: Number.isFinite(header) && header > 0 ? header : rows.length };
}

/** Sends a JSON body; on failure resolves with the API's error body (for FormErrorAlert) instead of throwing */
export async function submitJson<T>(
  url: string,
  method: "POST" | "PUT",
  payload: unknown,
  failureMessage: string,
): Promise<{ data: T; error: null } | { data: null; error: string | ApiError }> {
  try {
    const response = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (response.ok) return { data: await response.json(), error: null };
    try {
      return { data: null, error: await response.json() };
    } catch {
      return { data: null, error: `${failureMessage}: ${response.statusText}` };
    }
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : failureMessage };
  }
}
