"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { createCellRenderer } from "@/src/utils/cellRenderers";
import { Box, Link, Typography } from "@mui/material";

const headers = ["id", "Created By", "Status", "PI", "Position", "Created At"];
const cellRenderer = createCellRenderer({
  editPath: "/forms/user-applications/edit",
  timeColumns: ["Created At", "Updated At"],
});

function formatPosition(position: string) {
  return position
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function View() {
  return (
    <Box>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/users/" style={{ textDecoration: "none", color: "inherit" }}>
          User Applications
        </Link>
      </Typography>
      <GenericTableView
        headers={headers}
        cellRenderer={cellRenderer}
        sortableColumns={{
          Status: "status",
          PI: "pi_name",
          Position: "position",
          "Created At": { column: "created_at", default: "desc" },
        }}
        query={async (client, opts, searchQuery) => {
          const queryObj = searchQuery
            ? {
                or: `(pi_name.ilike.${searchQuery},pi_email.ilike.${searchQuery})`,
              }
            : undefined;

          const result = await client.getUserApplications({
            ...opts,
            ...(queryObj && { query: queryObj }),
          });

          const data = result.data.map((application) => [
            application.id,
            application.created_by?.name ?? application.created_by?.email1 ?? "",
            application.status,
            application.pi_name ?? application.pi_email ?? application.pi_id ?? "",
            formatPosition(application.position),
            application.created_at,
          ]);

          return { data, totalCount: result.totalCount };
        }}
        queryLabel="Search by PI Name or Email"
        unauthenticatedMessage="You must be logged in to view user applications."
      />
    </Box>
  );
}

export default View;
