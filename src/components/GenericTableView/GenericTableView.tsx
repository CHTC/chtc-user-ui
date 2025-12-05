"use client";

import { formatPhoneNumber } from "@/src/util/format";
import { Table } from "@chtc/web-components";
import { Box, Button, Link, TextField } from "@mui/material";
import { useState } from "react";
import { PaginationParams } from "../../util/types";
import { ApiClient, useAuthClient } from "../AuthProvider";
import { PageSelector } from "./PageSelector";

export interface GenericListComponentProps {
  headers: string[];
  query: (
    client: ApiClient,
    opts: PaginationParams,
    searchQuery: string
  ) => Promise<{ data: (string | number)[][]; totalCount: number }>;
  queryLabel: string;

  timeColumn?: string;
  linkColumn?: string;
}

function CellRenderer(cell: string | number, columnHeader: string, _column: number, _row: number) {
  const timeColumns = new Set(["Last Contact", "Last Modified"]);
  const linkColumn = "Project URL";
  const emailColumn = "Email";
  const phoneColumn = "Phone";

  if (timeColumns.has(columnHeader)) {
    const date = new Date(cell);
    const contents = isNaN(date.getTime()) ? "" : date.toUTCString();
    return <span>{contents}</span>;
  } else if (columnHeader === emailColumn) {
    return <Link href={`mailto:${cell.toString()}`}>{cell}</Link>;
  } else if (columnHeader === linkColumn) {
    return (
      <Link href={cell.toString()} target="_blank" rel="noopener noreferrer">
        {cell}
      </Link>
    );
  } else if (columnHeader === phoneColumn) {
    const formattedPhone = formatPhoneNumber(cell.toString());
    return <span>{formattedPhone}</span>;
  }
  return <span>{cell}</span>;
}

function GenericTableView({ headers, query, queryLabel }: GenericListComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<(string | number)[][]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const { client, isAuthenticated } = useAuthClient();
  const rowsPerPage = 50;

  if (!isAuthenticated) {
    return <p>Please log in to view this data.</p>;
  }

  const handleSearch = (resetPage: boolean = false) => {
    query(client, { page, page_size: rowsPerPage }, searchQuery)
      .then((results) => {
        console.log("Table data:", results);
        setTotalCount(results.totalCount);
        setData(results.data);

        if (resetPage) {
          setPage(0);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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
        <Box sx={{ marginLeft: "auto" }}>
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
      </Box>
      {data.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <Table
          headers={headers}
          data={data}
          cellRenderer={CellRenderer}
          sortable={true}
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
      )}
    </>
  );
}

export default GenericTableView;
