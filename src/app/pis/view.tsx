"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { EmailCell, makeIconLinkCell } from "@/src/components/TableCells/TableCells";
import { formatPhoneNumber } from "@/src/utils/format";
import type { PiProjectView } from "@/types";
import { Edit } from "@mui/icons-material";

const columns: ServerTableColumns<PiProjectView> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<PiProjectView>({
      href: (pi) => `/users/edit?id=${pi.user_id}`,
      icon: <Edit />,
      ariaLabel: "Edit user",
    }),
  },
  name: { id: "name", name: "Name", sortable: true },
  project_name: { id: "project_name", name: "Project Name", sortable: true },
  email1: { id: "email1", name: "Email", sortable: true, CellComponent: EmailCell },
  phone1: { id: "phone1", name: "Phone", value: (pi) => (pi.phone1 ? formatPhoneNumber(pi.phone1) : "") },
  netid: { id: "netid", name: "NetID", sortable: true },
};

// Newest first; the view has no id of its own, so this goes by the project's
const defaultSort: SortState<keyof PiProjectView & string> = { columnId: "project_id", direction: "desc" };

const searchFields = ["name", "netid"];

// One row per PI per project, so it takes both ids to order rows uniquely
const tiebreakers: SortState[] = [
  { columnId: "user_id", direction: "asc" },
  { columnId: "project_id", direction: "asc" },
];

function View() {
  return (
    <AuthGuard message="You must be logged in to view PI projects.">
      <ServerTable
        endpoint="/pi-projects"
        columns={columns}
        defaultSort={defaultSort}
        tiebreakers={tiebreakers}
        defaultPageSize={50}
        searchLabel="Search by Name or NetID"
        searchFields={searchFields}
        emptyMessage="No PIs found."
      />
    </AuthGuard>
  );
}

export default View;
