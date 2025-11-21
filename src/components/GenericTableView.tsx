"use client";

import { useState } from "react";
import { Table } from "@chtc/web-components";
import { TextField, Button, Box, Link } from "@mui/material";
import { useAuth } from "./AuthProvider";
import AuthenticatedClient from "../util/api";

interface GenericListComponentProps {
  headers: string[];
  query: (client: AuthenticatedClient, searchQuery: string) => Promise<(string | number)[][]>;
  queryLabel: string;

  timeColumn?: string;
  linkColumn?: string;
}

function CellRenderer(cell: string | number, columnHeader: string, column: number, row: number) {
  const timeColumns = new Set(["Last Contact", "Last Modified"]);
  const linkColumn = "Project URL";
  const emailColumn = "Email";

  if (timeColumns.has(columnHeader)) {
    const date = new Date(cell);
    return <span>{date.toUTCString()}</span>;
  } else if (columnHeader === emailColumn) {
    return <Link href={`mailto:${cell.toString()}`}>{cell}</Link>;
  } else if (columnHeader === linkColumn) {
    return (
      <Link href={cell.toString()} target="_blank" rel="noopener noreferrer">
        {cell}
      </Link>
    );
  }
  return <span>{cell}</span>;
}

function GenericTableView({ headers, query, queryLabel }: GenericListComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<(string | number)[][]>([]);

  const client = useAuth();

  const handleSearch = () => {
    query(client, searchQuery)
      .then((results) => {
        console.log("Table data:", results);
        setData(results);
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
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
        {searchQuery && (
          <Button
            variant="outlined"
            onClick={() => {
              // TODO: better logic here
              setSearchQuery("");
              setData([]);
            }}
          >
            Clear
          </Button>
        )}
      </Box>
      {data.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <Table
          headers={headers}
          data={data}
          cellRenderer={CellRenderer}
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
