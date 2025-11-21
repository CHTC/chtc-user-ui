import { Box, Button } from "@mui/material";

export interface PageSelectorProps {
  totalRows: number;
  rowsPerPage: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
}

export function PageSelector({ totalRows, rowsPerPage, currentPage, onPageChange }: PageSelectorProps) {
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 2, gap: 2 }}>
      <Button variant="contained" disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}>
        Previous
      </Button>
      <span>
        Page {currentPage + 1} of {totalPages}
      </span>
      <Button
        variant="contained"
        disabled={currentPage + 1 >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </Box>
  );
}
