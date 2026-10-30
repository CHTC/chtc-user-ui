"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { DateCell, EmailCell, makeIconLinkCell, TruncatedTextCell } from "@/src/components/TableCells/TableCells";
import type { User } from "@/types";
import { Edit } from "@mui/icons-material";

const columns: ServerTableColumns<User> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<User>({ href: (user) => `/users/edit?id=${user.id}`, icon: <Edit />, ariaLabel: "Edit user" }),
  },
  name: { id: "name", name: "Name", sortable: true },
  email1: { id: "email1", name: "Email", sortable: true, CellComponent: EmailCell },
  netid: { id: "netid", name: "NetID", sortable: true },
  submit_nodes: {
    id: "submit_nodes",
    name: "Submit Nodes",
    value: (user) => (user.submit_nodes ?? []).map((node) => node.name).join(", "),
    CellComponent: TruncatedTextCell,
  },
  updated_at: {
    id: "updated_at",
    name: "Last Modified",
    sortable: true,
    firstSortDirection: "desc",
    CellComponent: DateCell,
  },
};

// Newest first
const defaultSort: SortState<keyof User & string> = { columnId: "id", direction: "desc" };

const searchFields = ["name", "netid"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "asc" }];

function View() {
  return (
    <AuthGuard message="You must be logged in to view users.">
      <ServerTable
        endpoint="/users"
        columns={columns}
        defaultSort={defaultSort}
        tiebreakers={tiebreakers}
        defaultPageSize={50}
        searchLabel="Search by Name or NetID"
        searchFields={searchFields}
        emptyMessage="No users found."
      />
    </AuthGuard>
  );
}

export default View;
