"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { createCellRenderer } from "@/src/utils/cellRenderers";
import type { PiProjectView } from "@/types";

const headers = ["id", "Name", "Project Name", "Email", "Phone", "NetID"];
const cellRenderer = createCellRenderer({ editPath: "/users/edit" });

function Page() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={cellRenderer}
      sortableColumns={{
        Name: "name",
        "Project Name": "project_name",
        Email: "email1",
        NetID: "netid",
      }}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { or: `(name.ilike.${searchQuery},netid.ilike.${searchQuery})` } : undefined;
        const result = await client.getPiProjects({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });

        const data = result.data.map((pi: PiProjectView) => [
          pi.user_id ?? "",
          pi.name ?? "",
          pi.project_name ?? "",
          pi.email1 ?? "",
          pi.phone1 ?? "",
          pi.netid ?? "",
        ]);

        return { data, totalCount: result.totalCount };
      }}
      queryLabel="Search by Name or NetID"
      timeColumn="Last Modified"
      unauthenticatedMessage="You must be logged in to view PI projects."
    />
  );
}

export default Page;
