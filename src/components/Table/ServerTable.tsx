'use client';

import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import Table from './Table';
import {
  ActionConfig,
  ColumnConfig,
  SortState,
  TableData,
} from '@/src/components/Table/types';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/src/components/Table/constants';
import { apiFetch } from '@/src/components/AuthProvider';
import { apiErrorMessage } from '@/src/utils/formErrors';

// Sorting happens on the server, so a column only says whether it can be sorted by its id
export type ServerColumnConfig<R extends TableData> = Omit<
  ColumnConfig<R>,
  'sort' | 'onSort'
> & {
  sortable?: boolean;
  firstSortDirection?: SortState['direction'];
};

export type ServerTableColumns<R extends TableData> = Record<
  string,
  ServerColumnConfig<R> | ActionConfig<R>
>;

export interface ServerTableFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  operator?: 'eq' | 'is'; // default is eq
}

export interface ServerTableProps<R extends TableData> {
  endpoint: string;
  columns: ServerTableColumns<R>;
  defaultSort?: SortState<keyof R & string>;
  tiebreakers?: SortState[];
  defaultPageSize?: number;
  urlPrefix?: string; // used when theres more than one table per page
  searchLabel?: string;
  searchFields?: string[]; // not case sensitive
  filters?: ServerTableFilter[];
  emptyMessage?: string;
}

interface TableQuery {
  page: number;
  pageSize: number;
  sort?: SortState;
  search: string;
  filters: Record<string, string>;
}

interface TablePage<R> {
  data: R[];
  totalCount: number;
}

const isServerTableKey = (endpoint: string) => (key: unknown) =>
  Array.isArray(key) && key[0] === endpoint;

export function useServerTableRefresh(endpoint: string) {
  const { mutate } = useSWRConfig();
  return useCallback(
    () => mutate(isServerTableKey(endpoint)),
    [mutate, endpoint]
  );
}


const ServerTable = <R extends TableData>(props: ServerTableProps<R>) => {
  // Reading URL params needs a Suspense boundary for static export
  return (
    <Suspense fallback={<LinearProgress />}>
      <ServerTableContent {...props} />
    </Suspense>
  );
};

const ServerTableContent = <R extends TableData>({
  endpoint,
  columns,
  defaultSort,
  tiebreakers,
  defaultPageSize = DEFAULT_PAGE_SIZE_OPTIONS[0],
  urlPrefix = '',
  searchLabel,
  searchFields,
  filters,
  emptyMessage = 'No results',
}: ServerTableProps<R>) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const keys = useMemo(
    () => ({
      page: `${urlPrefix}page`,
      pageSize: `${urlPrefix}size`,
      sort: `${urlPrefix}sort`,
      search: `${urlPrefix}q`,
      filter: (id: string) => `${urlPrefix}${id}`,
    }),
    [urlPrefix]
  );

  const sortableColumns = useMemo(
    () =>
      Object.values(columns)
        .filter((column) => 'sortable' in column && column.sortable)
        .map((column) => column.id),
    [columns]
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
        (filters ?? []).flatMap((filter) => {
          const value = searchParams.get(keys.filter(filter.id));
          return value !== null &&
            filter.options.some((option) => option.value === value)
            ? [[filter.id, value]]
            : [];
        })
      ),
    };
  }, [searchParams, keys, defaultPageSize, defaultSort, sortableColumns, filters]);

  const setQuery = useCallback(
    (changes: Partial<TableQuery>) => {
      const next = { ...query, ...changes };

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
      (filters ?? []).forEach((filter) =>
        set(keys.filter(filter.id), next.filters[filter.id])
      );

      const queryString = params.toString();

      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [query, searchParams, keys, defaultPageSize, defaultSort, filters, router, pathname]
  );

  const { data, error, isLoading } = useSWR(
    [endpoint, query],
    ([, q]: [string, TableQuery]) =>
      fetchPage<R>(endpoint, q, { tiebreakers, searchFields, filters }),
    { keepPreviousData: true }
  );

  // Step back when the page runs past the end, e.g. after deleting the last row on the last page
  useEffect(() => {
    if (!isLoading && data && query.page > 0 && data.data.length === 0 && data.totalCount > 0) {
      setQuery({ page: Math.ceil(data.totalCount / query.pageSize) - 1 });
    }
  }, [isLoading, data, query.page, query.pageSize, setQuery]);

  const tableColumns = useMemo(
    () =>
      Object.values(columns).map((column) => {
        if (!('sortable' in column)) return column;
        const { sortable, firstSortDirection = 'asc', ...rest } = column;
        if (!sortable) return rest;
        return {
          ...rest,
          // Table shows the sort icon for columns that have a sort key, and the server does the sorting
          sort: undefined,
          onSort: (next: SortState) =>
            setQuery({
              // A newly chosen column starts in its first direction rather than inheriting the old one
              sort:
                next.columnId === query.sort?.columnId
                  ? next
                  : { columnId: next.columnId, direction: firstSortDirection },
            }),
        };
      }),
    [columns, query.sort, setQuery]
  );

  const rows = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  return (
    <Box>
      {(searchLabel || filters?.length) && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          {searchLabel && (
            <SearchField
              label={searchLabel}
              value={query.search}
              onChange={(search) => setQuery({ search })}
            />
          )}
          {filters?.map((filter) => (
            <FormControl key={filter.id} size='small' sx={{ minWidth: 160 }}>
              <InputLabel id={`${urlPrefix}${filter.id}-filter`}>
                {filter.label}
              </InputLabel>
              <Select
                labelId={`${urlPrefix}${filter.id}-filter`}
                label={filter.label}
                value={query.filters[filter.id] ?? ''}
                onChange={(e) => {
                  const { [filter.id]: _previous, ...others } = query.filters;
                  setQuery({
                    filters: e.target.value
                      ? { ...others, [filter.id]: e.target.value }
                      : others,
                  });
                }}
              >
                <MenuItem value=''>All</MenuItem>
                {filter.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      )}

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : 'Failed to load data'}
        </Alert>
      )}

   
      <Box sx={{ height: 4 }}>{isLoading && <LinearProgress />}</Box>

      <Table
        data={rows}
        columns={tableColumns}
        sort={query.sort as SortState<keyof R & string> | undefined}
        pagination={
          totalCount > DEFAULT_PAGE_SIZE_OPTIONS[0]
            ? {
                totalCount,
                page: query.page,
                pageSize: query.pageSize,
                onPageChange: (page) => setQuery({ page }),
                onPageSizeChange: (pageSize) => setQuery({ pageSize }),
              }
            : undefined
        }
      />

      {!isLoading && !error && rows.length === 0 && (
        <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Page fetch helper for translating props and making list requests
 */
async function fetchPage<R>(
  endpoint: string,
  query: TableQuery,
  {
    tiebreakers = [],
    searchFields = [],
    filters = [],
  }: Pick<ServerTableProps<TableData>, 'tiebreakers' | 'searchFields' | 'filters'>
): Promise<TablePage<R>> {
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
  const search = query.search.replace(/[,()]/g, ' ').trim();
  if (search && searchFields.length > 0) {
    params.append(
      'or',
      `(${searchFields.map((field) => `${field}.ilike.${search}`).join(',')})`
    );
  }

  Object.entries(query.filters).forEach(([id, value]) => {
    const operator = filters.find((filter) => filter.id === id)?.operator ?? 'eq';
    params.append(id, `${operator}.${value}`);
  });

  const response = await apiFetch(`${endpoint}?${params}`);
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, 'Failed to load data'));
  }

  return {
    data: await response.json(),
    totalCount: parseInt(response.headers.get('X-Total-Count') ?? '0', 10),
  };
}

// Sorts are written to the URL as the column id, prefixed with "-" when descending
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

const SearchField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const [input, setInput] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastReported = useRef(value);

  useEffect(() => {
    if (value !== lastReported.current) {
      lastReported.current = value;
      setInput(value);
    }
  }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <TextField
      label={label}
      size='small'
      value={input}
      onChange={(e) => {
        const next = e.target.value;
        setInput(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          lastReported.current = next;
          onChange(next);
        }, 300); // debounce
      }}
      sx={{ width: 300 }}
    />
  );
};

export default ServerTable;
