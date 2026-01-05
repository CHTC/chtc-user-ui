"use client";

import { useDebounce } from "@/src/utils/useDebounce";
import { PaginationParams, SortDirection } from "@/types";
import { Table } from "@chtc/web-components";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { ApiClient, useAuthClient } from "../AuthProvider";
import { PageSelector } from "./PageSelector";

export interface GenericListComponentProps {
  cellRenderer: (
    cell: string | number,
    columnHeader: string,
    column: number,
    row: number,
  ) => ReactElement<unknown, string>;
  headers: string[];

  query: (
    client: ApiClient,
    opts: PaginationParams,
    searchQuery: string,
  ) => Promise<{ data: (string | number)[][]; totalCount: number }>;
  queryLabel: string;

  timeColumn?: string;
  linkColumn?: string;

  unauthenticatedMessage: string;

  /** Map of header label to API column name for sortable columns */
  sortableColumns?: Record<string, string>;
}

function GenericTableView({
  cellRenderer,
  headers,
  query,
  queryLabel,
  unauthenticatedMessage,
  sortableColumns,
}: GenericListComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<(string | number)[][]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { client, isAuthenticated } = useAuthClient();
  const rowsPerPage = 50;

  // Debounce search query to avoid excessive API calls while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSearch = useCallback(
    (resetPage: boolean = false) => {
      query(client, { page, page_size: rowsPerPage, sortColumn, sortDirection }, debouncedSearchQuery)
        .then((results) => {
          setTotalCount(results.totalCount);
          setData(results.data);

          if (resetPage) {
            setPage(0);
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    },
    [client, page, query, debouncedSearchQuery, sortColumn, sortDirection],
  );

  // Get sortable column entries for the dropdown
  const sortableEntries = sortableColumns ? Object.entries(sortableColumns) : [];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      handleSearch();
    }
  }, [handleSearch, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">{unauthenticatedMessage}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          label={queryLabel}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{ width: 300 }}
        />
        <Button variant="contained" onClick={() => handleSearch(true)}>
          Search
        </Button>
        {searchQuery && (
          <Button
            variant="outlined"
            onClick={() => {
              // TODO: better logic here
              setSearchQuery("");
              setData([]);
              setTotalCount(0);
              setPage(0);
            }}
          >
            Clear
          </Button>
        )}
        {sortableEntries.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-column-label">Sort by</InputLabel>
              <Select
                labelId="sort-column-label"
                label="Sort by"
                value={sortColumn || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    setSortColumn(value);
                  } else {
                    setSortColumn(undefined);
                  }
                }}
              >
                <MenuItem value="">None</MenuItem>
                {sortableEntries.map(([label, apiColumn]) => (
                  <MenuItem key={apiColumn} value={apiColumn}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {sortColumn && (
              <IconButton
                size="small"
                onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                title={sortDirection === "asc" ? "Ascending" : "Descending"}
              >
                {sortDirection === "asc" ? <ArrowUpward /> : <ArrowDownward />}
              </IconButton>
            )}
          </Box>
        )}
        <Box sx={{ marginLeft: "auto" }}>
          <PageSelector
            totalRows={totalCount}
            rowsPerPage={rowsPerPage}
            currentPage={page}
            onPageChange={(newPage) => {
              setPage(newPage);
            }}
          />
        </Box>
      </Box>
      {data.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <>
          <Table
            headers={headers}
            data={data}
            cellRenderer={cellRenderer}
            headCellSx={{
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              padding: "8px 16px",
            }}
            bodyRowSx={{
              "&:nth-of-type(even)": {
                backgroundColor: "rgba(0, 0, 0, 0.05)",
              },
            }}
            bodyCellSx={{
              border: {
                "&:first-child": {
                  borderLeft: "1px solid rgba(0, 0, 0, 0.10)",
                },
                "&:last-child": {
                  borderRight: "1px solid rgba(0, 0, 0, 0.10)",
                },
                "&:not(:last-child)": {
                  borderRight: "1px solid rgba(0, 0, 0, 0.10)",
                },
              },
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <PageSelector
              totalRows={totalCount}
              rowsPerPage={rowsPerPage}
              currentPage={page}
              onPageChange={(newPage) => {
                setPage(newPage);
                handleSearch();
              }}
            />
          </Box>
        </>
      )}
    </>
  );
}

export default GenericTableView;
