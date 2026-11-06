"use client";

import { Table, type ActionConfig, type ColumnConfig, type TableData } from "@chtc/web-components";
import { Skeleton, Typography } from "@mui/material";

interface StaticTableProps<R extends TableData> {
  data: R[];
  columns: (ColumnConfig<R> | ActionConfig<R>)[];
  isLoading?: boolean;
  emptyMessage: string;
}

/**
 * The generic Table for lists fetched whole (no server paging), with the same loading and empty
 * states as ServerTable. Table keys rows by index, so buttons in its cells should carry a per-row key.
 */
const StaticTable = <R extends TableData>({ data, columns, isLoading = false, emptyMessage }: StaticTableProps<R>) => {
  if (isLoading) return <Skeleton variant="rectangular" height={100} />;

  return (
    <>
      <Table data={data} columns={columns} />
      {data.length === 0 && (
        <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
          {emptyMessage}
        </Typography>
      )}
    </>
  );
};

export default StaticTable;
