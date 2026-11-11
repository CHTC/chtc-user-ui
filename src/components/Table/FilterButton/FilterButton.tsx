"use client";

import { SearchFilters, type SearchFiltersProps, type TableData } from "@chtc/web-components";
import { FilterList } from "@mui/icons-material";
import { FIELD_HEIGHT_SPACING } from "@/src/app/theme";
import { Button, Popover, useTheme } from "@mui/material";
import { useState } from "react";

/** A Filter button that opens SearchFilters in a popover. */
export const FilterButton = <R extends TableData>(props: SearchFiltersProps<R>) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const theme = useTheme();

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
        // Opens beside the button, top edges lined up
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { ml: 1 } } }}
      >
        <SearchFilters
          {...props}
          // Field-height inputs plus room above and below for their raised labels
          rowHeight={parseInt(theme.spacing(FIELD_HEIGHT_SPACING + 2.5), 10)}
          sx={{ border: 0, typography: "body1" }}
        />
      </Popover>
    </>
  );
};

export default FilterButton;
