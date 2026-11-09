"use client";

import { SearchFilters, type SearchFiltersProps, type TableData } from "@chtc/web-components";
import { FilterList } from "@mui/icons-material";
import { Button, Popover } from "@mui/material";
import { useState } from "react";

/** A Filter button that opens SearchFilters in a popover. */
export const FilterButton = <R extends TableData>(props: SearchFiltersProps<R>) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Button variant="field" startIcon={<FilterList />} onClick={(e) => setAnchor(e.currentTarget)}>
        Filter
      </Button>
      {/* Popover closes on a click outside it */}
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 1 } } }}
      >
        <SearchFilters {...props} sx={{ border: 0, typography: "body1" }} />
      </Popover>
    </>
  );
};

export default FilterButton;
