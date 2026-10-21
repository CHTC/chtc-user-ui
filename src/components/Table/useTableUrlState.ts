'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { SortState } from '@/src/components/Table/types';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/src/components/Table/constants';

/**
 * Everything a server-side table needs to request one page of rows.
 */
export interface TableQuery {
  /** 0-based */
  page: number;
  pageSize: number;
  sort?: SortState;
  search: string;
  /** Filter id to selected value; unset filters are absent */
  filters: Record<string, string>;
}

export interface TableUrlStateOptions {
  /** Prepended to every param this table owns so several tables can share a page */
  prefix?: string;
  defaultSort?: SortState;
  defaultPageSize?: number;
  /** Column ids the URL may sort by; anything else falls back to defaultSort */
  sortableColumns: string[];
  /** Filter id to the values it accepts; anything else is ignored */
  filters: Record<string, string[]>;
}

/**
 * Keeps a table's page, page size, sort, search, and filters in the URL so
 * reloading or going back restores them. Values read from the URL are
 * validated against the options, and values equal to their default are left
 * out of the URL.
 */
export function useTableUrlState({
  prefix = '',
  defaultSort,
  defaultPageSize = DEFAULT_PAGE_SIZE_OPTIONS[0],
  sortableColumns,
  filters,
}: TableUrlStateOptions): [TableQuery, (changes: Partial<TableQuery>) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const keys = useMemo(
    () => ({
      page: `${prefix}page`,
      pageSize: `${prefix}size`,
      sort: `${prefix}sort`,
      search: `${prefix}q`,
      filter: (id: string) => `${prefix}${id}`,
    }),
    [prefix]
  );

  const query = useMemo((): TableQuery => {
    const page = parseInt(searchParams.get(keys.page) ?? '', 10);
    const pageSize = parseInt(searchParams.get(keys.pageSize) ?? '', 10);

    return {
      page: page >= 1 ? page - 1 : 0,
      pageSize: DEFAULT_PAGE_SIZE_OPTIONS.includes(pageSize)
        ? pageSize
        : defaultPageSize,
      sort:
        parseSort(searchParams.get(keys.sort), sortableColumns) ?? defaultSort,
      search: searchParams.get(keys.search) ?? '',
      filters: Object.fromEntries(
        Object.entries(filters).flatMap(([id, allowed]) => {
          const value = searchParams.get(keys.filter(id));
          return value !== null && allowed.includes(value) ? [[id, value]] : [];
        })
      ),
    };
  }, [searchParams, keys, defaultPageSize, defaultSort, sortableColumns, filters]);

  const setQuery = useCallback(
    (changes: Partial<TableQuery>) => {
      const next = { ...query, ...changes };
      // Any change other than the page itself makes the current page meaningless
      if (changes.page === undefined) {
        next.page = 0;
      }

      const params = new URLSearchParams(searchParams.toString());
      const set = (key: string, value: string | undefined) =>
        value === undefined ? params.delete(key) : params.set(key, value);

      set(keys.page, next.page > 0 ? String(next.page + 1) : undefined);
      set(
        keys.pageSize,
        next.pageSize !== defaultPageSize ? String(next.pageSize) : undefined
      );
      set(
        keys.sort,
        next.sort && !sameSort(next.sort, defaultSort)
          ? formatSort(next.sort)
          : undefined
      );
      set(keys.search, next.search || undefined);
      Object.keys(filters).forEach((id) =>
        set(keys.filter(id), next.filters[id])
      );

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [query, searchParams, keys, defaultPageSize, defaultSort, filters, router, pathname]
  );

  return [query, setQuery];
}

/** Sorts are written as the column id, prefixed with "-" when descending */
function formatSort(sort: SortState): string {
  return `${sort.direction === 'desc' ? '-' : ''}${sort.columnId}`;
}

function parseSort(
  value: string | null,
  sortableColumns: string[]
): SortState | undefined {
  if (!value) return undefined;
  const direction = value.startsWith('-') ? 'desc' : 'asc';
  const columnId = value.replace(/^-/, '');
  return sortableColumns.includes(columnId)
    ? { columnId, direction }
    : undefined;
}

function sameSort(a: SortState, b: SortState | undefined): boolean {
  return a.columnId === b?.columnId && a.direction === b.direction;
}
