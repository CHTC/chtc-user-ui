"use client";

import { useState } from "react";
import { Table } from "@chtc/web-components";
import { TextField, Button, Box, Link } from "@mui/material";

interface GenericListComponentProps {
  headers: string[];
  data: (string | number)[][];
  timeColumn?: string;
  linkColumn?: string;
  searchLabel?: string;
  defaultSortColumn?: string;
}

function GenericListComponent({
  headers,
  data,
  timeColumn,
  linkColumn,
  searchLabel = "Search",
  defaultSortColumn,
}: GenericListComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((row) =>
        row.some((cell) => cell?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredData(filtered);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const cellRenderer = (cell: string | number, columnHeader: string, column: number, row: number) => {
    if (timeColumn && columnHeader === timeColumn && cell) {
      const date = new Date(cell);
      return <span>{date.toUTCString()}</span>;
    }
    if (linkColumn && columnHeader === linkColumn && cell) {
      return (
        <Link href={cell.toString()} target="_blank" rel="noopener noreferrer">
          {cell}
        </Link>
      );
    }
    return <span>{cell}</span>;
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          label={searchLabel}
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
              setSearchQuery("");
              setFilteredData(data);
            }}
          >
            Clear
          </Button>
        )}
      </Box>
      {filteredData.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <Table
          headers={headers}
          data={filteredData}
          sortable={true}
          defaultSortDirection="asc"
          defaultSortColumn={defaultSortColumn}
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
        />
      )}
    </>
  );
}

export default GenericListComponent;
