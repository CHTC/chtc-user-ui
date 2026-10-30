"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { makeIconLinkCell } from "@/src/components/TableCells/TableCells";
import type { Group } from "@/types";
import { Edit } from "@mui/icons-material";

const columns: ServerTableColumns<Group> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<Group>({ href: (group) => `/groups/edit?id=${group.id}`, icon: <Edit />, ariaLabel: "Edit group" }),
  },
  name: { id: "name", name: "Group Name", sortable: true },
  // The API sorts point_of_contact by user id, not name, so this column isn't sortable
  point_of_contact: {
    id: "point_of_contact",
    name: "Point of Contact",
    value: (group) => group.point_of_contact?.name ?? group.point_of_contact?.email1 ?? "",
  },
  unix_gid: { id: "unix_gid", name: "GID", sortable: true },
  has_groupdir: {
    id: "has_groupdir",
    name: "Has Group Directory?",
    sortable: true,
    value: (group) => (group.has_groupdir ? "Yes" : "No"),
  },
};

// Newest first
const defaultSort: SortState<keyof Group & string> = { columnId: "id", direction: "desc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "asc" }];

function View() {
  return (
    <AuthGuard message="You must be logged in to view groups.">
      <ServerTable
        endpoint="/groups"
        columns={columns}
        defaultSort={defaultSort}
        tiebreakers={tiebreakers}
        defaultPageSize={50}
        searchLabel="Search by Group"
        searchFields={searchFields}
        emptyMessage="No groups found."
      />
    </AuthGuard>
  );
}

export default View;
