"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { createCellRenderer } from "@/src/util/cellRenderers";

const headers = ["id", "Name", "Staff", "Status", "Project URL", "Last Contact"];
const cellRenderer = createCellRenderer({ editPath: "/projects/edit" });

function Page() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={cellRenderer}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { name: `like.${searchQuery}` } : undefined;
        const result = await client.getProjects({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });

        const data = result.data.map((project) => [
          project.id,
          project.name,
          project.staff1 ?? "",
          project.status ?? "",
          project.url ?? "",
          project.last_contact ?? "",
        ]);

        return { data, totalCount: result.totalCount };
      }}
      queryLabel="Search by Project Name"
      timeColumn="Last Contact"
      linkColumn="Project URL"
      unauthenticatedMessage="You must be logged in to view projects."
    />
  );
}

export default Page;
