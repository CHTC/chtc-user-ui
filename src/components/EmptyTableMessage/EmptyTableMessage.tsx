"use client";

import { Box, TableCell, TableRow, Typography } from "@mui/material";

export function EmptyTableMessage({ message }: {message: string}) {
  return (
    <TableRow>
      {/* span 100 columns, bigger than any table we use so it will just span all columns */}
      <TableCell colSpan={100} align="center">
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ 
            fontWeight: 'medium',
          }}
        >
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

export default EmptyTableMessage;
          