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
import {
  TableQuery,
  useTableUrlState,
} from '@/src/components/Table/useTableUrlState';

/** Sorting happens on the server, so a column only says whether it can be sorted by its id */
export type ServerColumnConfig<R extends TableData> = Omit<
  ColumnConfig<R>,
  'sort' | 'onSort'
> & { sortable?: boolean };

export type ServerTableColumns<R extends TableData> = Record<
  string,
  ServerColumnConfig<R> | ActionConfig<R>
>;

export interface ServerTablePage<R> {
  data: R[];
  /** Number of rows across all pages */
  totalCount: number;
}

export interface ServerTableFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface ServerTableProps<R extends TableData> {
  /** Names the data source; rows are cached under it and refreshed with useServerTableRefresh */
  cacheKey: string;
  fetchPage: (query: TableQuery) => Promise<ServerTablePage<R>>;
  columns: ServerTableColumns<R>;
  defaultSort?: SortState<keyof R & string>;
  defaultPageSize?: number;
  /** Prefix for this table's URL params, needed when a page has more than one table */
  urlPrefix?: string;
  /** Shows a search box with this label */
  searchLabel?: string;
  filters?: ServerTableFilter[];
  emptyMessage?: string;
}

const SEARCH_DEBOUNCE_MS = 300;

const isServerTableKey = (cacheKey: string) => (key: unknown) =>
  Array.isArray(key) && key[0] === cacheKey;

/**
 * Returns a function that refetches every page of the ServerTable with this cacheKey,
 * for actions inside or outside the table that change its rows.
 */
export function useServerTableRefresh(cacheKey: string) {
  const { mutate } = useSWRConfig();
  return useCallback(
    () => mutate(isServerTableKey(cacheKey)),
    [mutate, cacheKey]
  );
}

/**
 * Server-side counterpart to ClientTable: the server sorts, filters, and pages
 * the rows, and the table's state lives in the URL.
 */
const ServerTable = <R extends TableData>(props: ServerTableProps<R>) => {
  // Reading the URL needs a Suspense boundary in a statically exported app
  return (
    <Suspense fallback={<LinearProgress />}>
      <ServerTableContent {...props} />
    </Suspense>
  );
};

const ServerTableContent = <R extends TableData>({
  cacheKey,
  fetchPage,
  columns,
  defaultSort,
  defaultPageSize,
  urlPrefix,
  searchLabel,
  filters,
  emptyMessage = 'No results',
}: ServerTableProps<R>) => {
  const sortableColumns = useMemo(
    () =>
      Object.values(columns)
        .filter((column) => 'sortable' in column && column.sortable)
        .map((column) => column.id),
    [columns]
  );
  const filterValues = useMemo(
    () =>
      Object.fromEntries(
        (filters ?? []).map((filter) => [
          filter.id,
          filter.options.map((option) => option.value),
        ])
      ),
    [filters]
  );

  const [query, setQuery] = useTableUrlState({
    prefix: urlPrefix,
    defaultSort,
    defaultPageSize,
    sortableColumns,
    filters: filterValues,
  });

  const { data, error, isLoading } = useSWR(
    [cacheKey, query],
    ([, q]: [string, TableQuery]) => fetchPage(q),
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
        const { sortable, ...rest } = column;
        if (!sortable) return rest;
        return {
          ...rest,
          // Table shows the sort icon for columns that have a sort key, and the server does the sorting
          sort: undefined,
          onSort: (next: SortState) =>
            setQuery({
              // A newly chosen column starts ascending rather than inheriting the old direction
              sort:
                next.columnId === query.sort?.columnId
                  ? next
                  : { columnId: next.columnId, direction: 'asc' },
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
              <InputLabel id={`${urlPrefix ?? ''}${filter.id}-filter`}>
                {filter.label}
              </InputLabel>
              <Select
                labelId={`${urlPrefix ?? ''}${filter.id}-filter`}
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

      {/* Fixed height so the table doesn't jump when the bar appears */}
      <Box sx={{ height: 4 }}>{isLoading && <LinearProgress />}</Box>

      <Table
        data={rows}
        columns={tableColumns}
        // useTableUrlState only accepts sorts on this table's column ids
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
 * Search box that reports its value once typing pauses, and follows the
 * value it's given when that changes from outside, e.g. on back navigation.
 */
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

  // Only an outside change should replace the input, not our own report arriving
  // after the user has typed more
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
        }, SEARCH_DEBOUNCE_MS);
      }}
      sx={{ width: 300 }}
    />
  );
};

export default ServerTable;
