"use client";

import { useState } from "react";
import { Table } from "@chtc/web-components";
import { TextField, Button, Box } from "@mui/material";

const headers = ["Username", "Name", "Ticket Count", "Email", "Phone", "Status", "NetID", "Last Modified"];

const data: (string | number | null)[][] = [
  ["jdoe", "John Doe", 5, "jdoe@wisc.edu", "(608) 555-0101", "Active", "jdoe", "2025-11-15"],
  [null, "Alice Smith", 12, "asmith@wisc.edu", "(608) 555-0102", "Active", "asmith", "2025-11-16"],
  ["bjohnson", "Bob Johnson", 3, "bjohnson@wisc.edu", "(608) 555-0103", "Inactive", "bjohnson", "2025-11-10"],
  ["clee", "Charlie Lee", 8, "clee@wisc.edu", "(608) 555-0104", "Active", "clee", "2025-11-17"],
  [null, "Diana Williams", 15, "dwilliams@wisc.edu", "(608) 555-0105", "Active", "dwilliams", "2025-11-14"],
];

/** Convert data to strings for the Table component to handle sorting properly */
const convertDataToStrings = (data: (string | number | null)[][]): (string | number)[][] => {
  return data.map((row) => row.map((cell) => (cell === null ? "" : cell)));
};

function Page() {
  const [searchPI, setSearchPI] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  const handleSearch = () => {
    if (searchPI.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((row) =>
        row.some((cell) => cell?.toString().toLowerCase().includes(searchPI.toLowerCase()))
      );
      setFilteredData(filtered);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Users</h1>
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          label="Search by PI"
          variant="outlined"
          size="small"
          value={searchPI}
          onChange={(e) => setSearchPI(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{ width: 300 }}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
        {searchPI && (
          <Button
            variant="outlined"
            onClick={() => {
              setSearchPI("");
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
          data={convertDataToStrings(filteredData)}
          sortable={true}
          defaultSortDirection="asc"
          defaultSortColumn="Username"
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
    </div>
  );
}

export default Page;
