"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { DateCell, makeIconLinkCell } from "@/src/components/TableCells/TableCells";
import { apiPageFetcher } from "@/src/utils/tableQuery";
import type { TokenGet } from "@/types";
import { Edit } from "@mui/icons-material";

const columns: ServerTableColumns<TokenGet> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<TokenGet>({ href: (token) => `/tokens/edit?id=${token.id}`, icon: <Edit />, ariaLabel: "Edit token" }),
  },
  created_by: { id: "created_by", name: "Created By", sortable: true },
  description: { id: "description", name: "Description", sortable: true },
  created_at: {
    id: "created_at",
    name: "Created At",
    sortable: true,
    firstSortDirection: "desc",
    CellComponent: DateCell,
  },
  expires_at: { id: "expires_at", name: "Expires At", sortable: true, CellComponent: DateCell },
};

// Newest first
const defaultSort: SortState<keyof TokenGet & string> = { columnId: "id", direction: "desc" };

const fetchPage = apiPageFetcher<TokenGet>("/tokens", {
  searchFields: ["description"],
  tiebreakers: [{ columnId: "id", direction: "asc" }],
});

function View() {
  return (
    <AuthGuard message="You must be logged in to view tokens.">
      <ServerTable
        cacheKey="/tokens"
        fetchPage={fetchPage}
        columns={columns}
        defaultSort={defaultSort}
        defaultPageSize={50}
        searchLabel="Search by Description"
        emptyMessage="No tokens found."
      />
    </AuthGuard>
  );
}

export default View;
