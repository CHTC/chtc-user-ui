"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { DateCell, makeIconLinkCell, UrlCell } from "@/src/components/TableCells/TableCells";
import { apiPageFetcher } from "@/src/utils/tableQuery";
import type { Project } from "@/types";
import { Edit } from "@mui/icons-material";

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
  last_contact: { id: "last_contact", name: "Last Contact", sortable: true, CellComponent: DateCell },
};

const defaultSort: SortState<keyof Project & string> = { columnId: "name", direction: "asc" };

const fetchPage = apiPageFetcher<Project>("/projects", {
  searchFields: ["name"],
  tiebreakers: [{ columnId: "id", direction: "asc" }],
});

function View() {
  return (
    <AuthGuard message="You must be logged in to view projects.">
      <ServerTable
        cacheKey="/projects"
        fetchPage={fetchPage}
        columns={columns}
        defaultSort={defaultSort}
        defaultPageSize={50}
        searchLabel="Search by Project Name"
        emptyMessage="No projects found."
      />
    </AuthGuard>
  );
}

export default View;
