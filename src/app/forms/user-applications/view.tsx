"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import ServerTable, { ServerTableColumns, ServerTableFilter } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { DateCell, makeIconLinkCell } from "@/src/components/TableCells/TableCells";
import { apiPageFetcher } from "@/src/utils/tableQuery";
import type { UserForm } from "@/types";
import { Edit } from "@mui/icons-material";
import { Box, Link, Typography } from "@mui/material";

function formatPosition(position: string) {
  return position
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const columns: ServerTableColumns<UserForm> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<UserForm>({
      href: (application) => `/forms/user-applications/edit?id=${application.id}`,
      icon: <Edit />,
      ariaLabel: "Edit application",
    }),
  },
  // The API sorts created_by by user id, not name, so this column isn't sortable
  created_by: {
    id: "created_by",
    name: "Created By",
    value: (application) => application.created_by?.name ?? application.created_by?.email1 ?? "",
  },
  status: { id: "status", name: "Status", sortable: true },
  pi_name: {
    id: "pi_name",
    name: "PI",
    sortable: true,
    value: (application) => application.pi_name ?? application.pi_email ?? application.pi_id ?? "",
  },
  position: {
    id: "position",
    name: "Position",
    sortable: true,
    value: (application) => formatPosition(application.position),
  },
  created_at: { id: "created_at", name: "Created At", sortable: true, CellComponent: DateCell },
};

const filters: ServerTableFilter[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { value: "PENDING", label: "Pending" },
      { value: "APPROVED", label: "Approved" },
      { value: "DENIED", label: "Denied" },
    ],
  },
];

const defaultSort: SortState<keyof UserForm & string> = { columnId: "created_at", direction: "desc" };

const fetchPage = apiPageFetcher<UserForm>("/forms/user-applications", {
  searchFields: ["pi_name", "pi_email"],
  tiebreakers: [{ columnId: "id", direction: "desc" }],
});

function View() {
  return (
    <Box>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/users/" style={{ textDecoration: "none", color: "inherit" }}>
          User Applications
        </Link>
      </Typography>
      <AuthGuard message="You must be logged in to view user applications.">
        <ServerTable
          cacheKey="/forms/user-applications"
          fetchPage={fetchPage}
          columns={columns}
          defaultSort={defaultSort}
          defaultPageSize={50}
          searchLabel="Search by PI Name or Email"
          filters={filters}
          emptyMessage="No applications found."
        />
      </AuthGuard>
    </Box>
  );
}

export default View;
