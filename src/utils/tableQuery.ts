import { apiFetch } from "@/src/components/AuthProvider";
import type { ServerTablePage } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import type { TableQuery } from "@/src/components/Table/useTableUrlState";
import { apiErrorMessage } from "@/src/utils/formErrors";

export interface ApiPageOptions {
  /** Columns the search box matches against, case-insensitively */
  searchFields?: string[];
  /**
   * Sorts applied after the chosen one so rows keep a stable order across pages.
   * Most list endpoints have no default order, so end with a unique column.
   */
  tiebreakers?: SortState[];
  /** Operator each filter is applied with, "eq" when unset */
  filterOperators?: Record<string, "eq" | "is">;
}

/**
 * Builds a ServerTable fetchPage for one of the API's list endpoints, translating the
 * table's query into the API's page, page_size, col=order_by.dir, and col=op.value params
 * and reading the total from the X-Total-Count header.
 */
export function apiPageFetcher<R>(endpoint: string, options: ApiPageOptions = {}) {
  const { searchFields = [], tiebreakers = [], filterOperators = {} } = options;

  return async (query: TableQuery): Promise<ServerTablePage<R>> => {
    const params = new URLSearchParams({
      page: String(query.page),
      page_size: String(query.pageSize),
    });

    // The API applies sorts in the order they appear, so the chosen sort goes first
    const sortedColumns = new Set<string>();
    [...(query.sort ? [query.sort] : []), ...tiebreakers].forEach(({ columnId, direction }) => {
      if (sortedColumns.has(columnId)) return;
      sortedColumns.add(columnId);
      params.append(columnId, `order_by.${direction}`);
    });

    // The API splits or=(...) on commas, so they can't appear in the search term
    const search = query.search.replace(/[,()]/g, " ").trim();
    if (search && searchFields.length > 0) {
      params.append("or", `(${searchFields.map((field) => `${field}.ilike.${search}`).join(",")})`);
    }

    Object.entries(query.filters).forEach(([id, value]) => {
      params.append(id, `${filterOperators[id] ?? "eq"}.${value}`);
    });

    const response = await apiFetch(`${endpoint}?${params}`);
    if (!response.ok) {
      throw new Error(await apiErrorMessage(response, "Failed to load data"));
    }

    return {
      data: await response.json(),
      totalCount: parseInt(response.headers.get("X-Total-Count") ?? "0", 10),
    };
  };
}

/**
 * Sends a DELETE and throws the API's error message if it fails, for makeDeleteCell's handleDelete.
 */
export async function apiDelete(url: string): Promise<void> {
  const response = await apiFetch(url, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Delete failed"));
  }
}
