"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import type { SortState } from "@chtc/web-components";
import { DateCell, makeIconLinkCell, UrlCell } from "@/src/components/TableCells/TableCells";
import type { Project } from "@/types";
import { Edit } from "@mui/icons-material";
import { Box, FormControlLabel, Switch } from "@mui/material";
import { useMemo, useState } from "react";

const columns: ServerTableColumns<Project> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<Project>({
      href: (project) => `/projects/edit?id=${project.id}`,
      icon: <Edit />,
      ariaLabel: "Edit project",
    }),
  },
  name: { id: "name", name: "Name", sortable: true },
  // The API sorts staff1 by user id, not name, so this column isn't sortable
  staff1: { id: "staff1", name: "Staff", value: (project) => project.staff1?.name ?? project.staff1?.email1 ?? "" },
  status: { id: "status", name: "Status", sortable: true },
  url: { id: "url", name: "Project URL", CellComponent: UrlCell },
  last_contact: {
    id: "last_contact",
    name: "Last Contact",
    sortable: true,
    firstSortDirection: "desc",
    CellComponent: DateCell,
  },
  expires_at: { id: "expires_at", name: "Expires", sortable: true, CellComponent: DateCell },
};

// Newest first
const defaultSort: SortState<keyof Project & string> = { columnId: "id", direction: "desc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "asc" }];

function View() {
  const { currentUser } = useAuthClient();
  // The API hides expired projects by default; only staff may ask for them
  const [showExpired, setShowExpired] = useState(false);
  const params = useMemo(() => (showExpired ? { include_expired: "true" } : undefined), [showExpired]);

  return (
    <AuthGuard message="You must be logged in to view projects.">
      {currentUser?.is_admin && (
        <Box sx={{ mb: 1 }}>
          <FormControlLabel
            control={<Switch checked={showExpired} onChange={(e) => setShowExpired(e.target.checked)} />}
            label="Show expired"
          />
        </Box>
      )}
      <ServerTable
        endpoint="/projects"
        columns={columns}
        defaultSort={defaultSort}
        tiebreakers={tiebreakers}
        defaultPageSize={50}
        searchLabel="Search by Project Name"
        searchFields={searchFields}
        params={params}
        emptyMessage="No projects found."
      />
    </AuthGuard>
  );
}

export default View;
